import json
import os
import re
import time
from pathlib import Path
from typing import Any

import requests


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "docs" / "cuet_non_math_questions_prod.json"
OUTPUT_PATH = ROOT / "docs" / "cuet_answer_audit_gemini.json"
MODEL = "gemini-2.5-flash-lite"
BATCH_SIZE = int(os.environ.get("AUDIT_BATCH_SIZE", "20") or "20")
SLEEP_SECONDS = float(os.environ.get("AUDIT_SLEEP_SECONDS", "0.2") or "0.2")
MAX_PENDING = int(os.environ.get("AUDIT_MAX_PENDING", "0") or "0")
SUBJECT_FILTER = os.environ.get("AUDIT_SUBJECT", "").strip().lower()


def load_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip().lower()


def build_unique_questions(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[str, dict[str, Any]] = {}
    for row in rows:
        options = row.get("options") or []
        key = "||".join([row.get("subject", ""), normalize_text(row.get("prompt", "")), *[normalize_text(opt) for opt in options]])
        bucket = buckets.get(key)
        occurrence = {
            "paper_id": row.get("paper_id"),
            "paper_title": row.get("paper_title"),
            "question_id": row.get("question_id"),
            "sort_order": row.get("sort_order"),
            "correct_index": row.get("correct_index"),
        }
        if bucket is None:
            bucket = {
                "audit_id": f"uq-{len(buckets) + 1:05d}",
                "subject": row.get("subject"),
                "prompt": row.get("prompt"),
                "options": options,
                "marked_correct_indices": {},
                "occurrences": [],
            }
            buckets[key] = bucket
        marked = str(row.get("correct_index"))
        bucket["marked_correct_indices"][marked] = bucket["marked_correct_indices"].get(marked, 0) + 1
        bucket["occurrences"].append(occurrence)
    return list(buckets.values())


def load_source() -> list[dict[str, Any]]:
    raw = SOURCE_PATH.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("utf-8", errors="replace")
    payload = json.loads(text)
    return payload["questions"]


def load_existing() -> dict[str, dict[str, Any]]:
    if not OUTPUT_PATH.exists():
        return {}
    payload = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    return {item["audit_id"]: item for item in payload.get("results", [])}


def save_results(results: list[dict[str, Any]]) -> None:
    summary: dict[str, Any] = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model": MODEL,
        "totalReviewed": len(results),
        "verdictCounts": {},
        "results": results,
    }
    for item in results:
        verdict = item.get("verdict", "unknown")
        summary["verdictCounts"][verdict] = summary["verdictCounts"].get(verdict, 0) + 1
    OUTPUT_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def build_prompt(batch: list[dict[str, Any]]) -> str:
    instructions = """
You are auditing CUET multiple-choice questions for answer-key mistakes.

Goal:
- Decide whether the currently marked correct option is wrong.
- Exclude mathematical or numerical problem solving questions even if they are from non-Mathematics subjects.

Verdict rules:
- "correct": the marked correct option is correct.
- "wrong": the marked correct option is wrong and exactly one other option is clearly better.
- "skip_math": the item requires calculation, equation-solving, or numeric/scientific problem solving.
- "unsure": insufficient confidence, ambiguous wording, OCR corruption, or more context needed.
- "malformed": prompt/options are too broken, duplicated, or unusable to audit.

Important:
- Be conservative. Use "wrong" only when highly confident.
- For language, history, polity, business, psychology, sociology, geography, biology, chemistry, physics, economics, and accountancy conceptual questions, audit normally.
- If Hindi/OCR text is too corrupted to read confidently, use "malformed" or "unsure".
- If the prompt itself is incomplete or all options are effectively identical, use "malformed".
- Return JSON only. No markdown, no prose before/after JSON.

Required JSON:
{
  "results": [
    {
      "audit_id": "uq-00001",
      "verdict": "correct|wrong|skip_math|unsure|malformed",
      "corrected_index": 0|1|2|3|null,
      "reason": "short reason"
    }
  ]
}
""".strip()
    items = []
    for item in batch:
        items.append({
            "audit_id": item["audit_id"],
            "subject": item["subject"],
            "prompt": item["prompt"],
            "options": item["options"],
            "marked_correct_index": most_common_marked_index(item),
            "marked_correct_distribution": item["marked_correct_indices"],
            "occurrence_count": len(item["occurrences"]),
        })
    return instructions + "\n\nQUESTIONS:\n" + json.dumps(items, ensure_ascii=False, indent=2)


def most_common_marked_index(item: dict[str, Any]) -> int | None:
    distribution = item.get("marked_correct_indices", {})
    if not distribution:
        return None
    key = sorted(distribution.items(), key=lambda pair: (-pair[1], pair[0]))[0][0]
    try:
        return int(key)
    except Exception:
        return None


def call_gemini(api_key: str, prompt: str) -> dict[str, Any]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }
    last_error: Exception | None = None
    for attempt in range(6):
        try:
            response = requests.post(url, json=payload, timeout=180)
            response.raise_for_status()
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
        except Exception as error:
            last_error = error
            if attempt == 5:
                break
            time.sleep(min(20, 2 ** attempt))
    raise last_error or RuntimeError("Gemini request failed.")


def main() -> None:
    env = {
        **load_env_file(ROOT / "server.env"),
        **os.environ,
    }
    api_key = env.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not found.")

    source_rows = load_source()
    unique_questions = build_unique_questions(source_rows)
    existing = load_existing()
    completed_ids = set(existing.keys())
    results = list(existing.values())

    total = len(unique_questions)
    pending = [item for item in unique_questions if item["audit_id"] not in completed_ids]
    if SUBJECT_FILTER:
        pending = [item for item in pending if str(item.get("subject", "")).strip().lower() == SUBJECT_FILTER]
    if MAX_PENDING > 0:
        pending = pending[:MAX_PENDING]
    print(f"Unique questions: {total}; pending: {len(pending)}")

    for start in range(0, len(pending), BATCH_SIZE):
        batch = pending[start:start + BATCH_SIZE]
        prompt = build_prompt(batch)
        payload = call_gemini(api_key, prompt)
        batch_results = payload.get("results", [])
        by_id = {item["audit_id"]: item for item in batch_results}
        for question in batch:
            answer = by_id.get(question["audit_id"], {
                "audit_id": question["audit_id"],
                "verdict": "unsure",
                "corrected_index": None,
                "reason": "Model did not return a result for this item.",
            })
            results.append({
                "audit_id": question["audit_id"],
                "subject": question["subject"],
                "prompt": question["prompt"],
                "options": question["options"],
                "marked_correct_index": most_common_marked_index(question),
                "marked_correct_distribution": question["marked_correct_indices"],
                "occurrence_count": len(question["occurrences"]),
                "occurrences": question["occurrences"],
                "verdict": answer.get("verdict"),
                "corrected_index": answer.get("corrected_index"),
                "reason": answer.get("reason"),
            })
        save_results(results)
        print(f"Processed {min(start + BATCH_SIZE, len(pending))}/{len(pending)} pending")
        time.sleep(SLEEP_SECONDS)

    print(f"Saved audit results to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
