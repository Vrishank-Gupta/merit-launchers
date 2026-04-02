import difflib
import importlib.util
import json
import os
import re
from pathlib import Path

import psycopg2


REPO_ROOT = Path(r"c:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers")
RECOVERY_SCRIPT = REPO_ROOT / "scripts" / "recover_cuet_skipped_with_ocr.py"
OUTPUT_SQL = REPO_ROOT / "tmp" / "repair_cuet_mathematics_formatting.sql"
OUTPUT_REPORT = REPO_ROOT / "tmp" / "repair_cuet_mathematics_formatting_report.json"


def load_env():
    env_path = REPO_ROOT / "server.env"
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        if not raw_line or raw_line.strip().startswith("#") or "=" not in raw_line:
            continue
        key, value = raw_line.split("=", 1)
        os.environ.setdefault(key, value)


def db_url():
    return os.environ["DATABASE_URL"].replace("@postgres:5432/", "@localhost:5432/")


def load_recovery_module():
    spec = importlib.util.spec_from_file_location("recover_cuet", RECOVERY_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fix_mojibake(value: str) -> str:
    replacements = {
        "Â²": "²",
        "Â³": "³",
        "Â·": "·",
        "Â°": "°",
        "Ã—": "×",
        "âˆ«": "∫",
        "âˆš": "√",
        "â‰¥": "≥",
        "â‰¤": "≤",
        "âˆ©": "∩",
        "âˆª": "∪",
        "âˆ…": "∅",
        "âˆ†": "Δ",
        "Î”": "Δ",
        "Ï€": "π",
        "Î¸": "θ",
        "Î±": "α",
        "Î²": "β",
        "Î³": "γ",
        "âˆ’": "-",
        "â‰ ": "≠",
        "â†’": "→",
        "âˆž": "∞",
    }
    result = str(value or "")
    for from_text, to_text in replacements.items():
        result = result.replace(from_text, to_text)
    return result


def format_math_prompt(prompt: str) -> str:
    result = fix_mojibake(prompt).replace("\r\n", "\n").replace("\r", "\n").strip()
    if not result:
        return result

    original = result
    replacements = [
        (r"\s+(subject to)\s+", r"\n\1 "),
        (r"\s+(where)\s+", r"\n\1 "),
        (r"\s+(List[\s-]*I)\s*", r"\n\1\n"),
        (r"\s+(List[\s-]*II)\s*", r"\n\1\n"),
        (r"\s+(LIST[\s-]*I)\s*", r"\n\1\n"),
        (r"\s+(LIST[\s-]*II)\s*", r"\n\1\n"),
        (r"\s+(\([ivx]+\))\s*", r"\n\1 "),
        (r"\s+([IVX]+\.)\s*", r"\n\1 "),
        (r"\s+([A-D]\.)\s*", r"\n\1 "),
        (r"\s+([A-D]\))\s*", r"\n\1 "),
    ]
    for pattern, replacement in replacements:
        result = re.sub(pattern, replacement, result)

    if "subject to" in result.lower():
        result = re.sub(r",\s*(?=[A-Za-z0-9xypz].*[≤≥=<>])", ",\n", result)

    if result.count(";") >= 2:
        result = result.replace("; ", ";\n")

    result = re.sub(r"\n{3,}", "\n\n", result)
    result = re.sub(r"[ \t]+\n", "\n", result)
    result = re.sub(r"\n[ \t]+", "\n", result)
    result = re.sub(r"[ \t]{2,}", " ", result).strip()

    return result if result != original else original


def normalize_text(value: str) -> str:
    value = fix_mojibake(value).lower().replace("\n", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, normalize_text(a), normalize_text(b)).ratio()


def sql_literal(value):
    if value is None:
        return "NULL"
    text = str(value).replace("'", "''")
    return f"'{text}'"


def build_updates():
    load_env()
    recovery = load_recovery_module()
    conn = psycopg2.connect(db_url())
    conn.autocommit = True
    cur = conn.cursor()
    report = []
    updates = []

    try:
        for paper_no in range(1, 11):
            paper_title = f"PAPER {paper_no}"
            cur.execute(
                """
                select q.sort_order, q.prompt, q.options, q.correct_index
                from questions q
                join papers p on p.id = q.paper_id
                where p.subject_id = 'cuet-mathematics'
                  and p.title = %s
                order by q.sort_order
                """,
                (paper_title,),
            )
            existing_rows = [
                {
                    "sort_order": row[0],
                    "prompt": row[1],
                    "options": row[2],
                    "correct_index": row[3],
                }
                for row in cur.fetchall()
            ]
            if not existing_rows:
                continue

            file_path = recovery.ROOT / "Mathematics" / f"{paper_title}.pdf"
            text = recovery.extract_targeted_hybrid_text(file_path)
            recovered = recovery.parse_paper(text, "Mathematics", paper_title, file_path)
            unmatched_existing = set(range(len(existing_rows)))
            paper_updates = []

            for question in recovered["questions"]:
                best = None
                recovered_prompt = fix_mojibake(question["prompt"])
                recovered_options = [fix_mojibake(option) for option in question["options"]]

                for row_index in sorted(unmatched_existing):
                    row = existing_rows[row_index]
                    prompt_ratio = similarity(recovered_prompt, row["prompt"])
                    option_ratio = similarity(" || ".join(recovered_options), " || ".join(row["options"]))
                    combined = prompt_ratio * 0.75 + option_ratio * 0.25
                    if best is None or combined > best["score"]:
                        best = {
                            "score": combined,
                            "prompt_ratio": prompt_ratio,
                            "option_ratio": option_ratio,
                            "row_index": row_index,
                            "row": row,
                        }

                if not best or best["score"] < 0.82:
                    continue

                unmatched_existing.remove(best["row_index"])
                row = best["row"]
                next_prompt = format_math_prompt(recovered_prompt)
                next_options = recovered_options
                next_correct_index = question["correctIndex"] if question["correctIndex"] is not None else row["correct_index"]

                changed = (
                    next_prompt != row["prompt"]
                    or next_options != row["options"]
                    or next_correct_index != row["correct_index"]
                )
                if not changed:
                    continue

                paper_updates.append(
                    {
                        "paperTitle": paper_title,
                        "sortOrder": row["sort_order"],
                        "score": round(best["score"], 3),
                        "promptRatio": round(best["prompt_ratio"], 3),
                        "optionRatio": round(best["option_ratio"], 3),
                        "recoveredQuestionNumber": question.get("questionNumber"),
                        "prompt": next_prompt,
                        "options": next_options,
                        "correctIndex": next_correct_index,
                    }
                )

            for row in existing_rows:
                formatted_prompt = format_math_prompt(row["prompt"])
                formatted_options = [fix_mojibake(option) for option in row["options"]]
                if formatted_prompt != row["prompt"] or formatted_options != row["options"]:
                    if any(
                        update["sortOrder"] == row["sort_order"]
                        for update in paper_updates
                    ):
                        continue
                    paper_updates.append(
                        {
                            "paperTitle": paper_title,
                            "sortOrder": row["sort_order"],
                            "score": None,
                            "promptRatio": None,
                            "optionRatio": None,
                            "recoveredQuestionNumber": None,
                            "prompt": formatted_prompt,
                            "options": formatted_options,
                            "correctIndex": row["correct_index"],
                        }
                    )

            paper_updates.sort(key=lambda item: item["sortOrder"])
            updates.extend(paper_updates)
            report.append(
                {
                    "paperTitle": paper_title,
                    "existingCount": len(existing_rows),
                    "recoveredCount": len(recovered["questions"]),
                    "updates": len(paper_updates),
                }
            )
    finally:
        cur.close()
        conn.close()

    return updates, report


def write_sql(updates):
    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    statements = ["begin;"]
    for item in updates:
        statements.append(
            f"""
update questions q
set prompt = {sql_literal(item["prompt"])},
    options = {sql_literal(json.dumps(item["options"], ensure_ascii=False))}::jsonb,
    correct_index = {int(item["correctIndex"]) if item["correctIndex"] is not None else 'correct_index'}
from papers p
where q.paper_id = p.id
  and p.subject_id = 'cuet-mathematics'
  and p.title = {sql_literal(item["paperTitle"])}
  and q.sort_order = {int(item["sortOrder"])};""".strip()
        )
    statements.append("commit;")
    OUTPUT_SQL.write_text("\n\n".join(statements) + "\n", encoding="utf-8")


def main():
    updates, report = build_updates()
    OUTPUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_REPORT.write_text(
        json.dumps({"totalUpdates": len(updates), "papers": report, "updates": updates}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    write_sql(updates)
    print(json.dumps({"totalUpdates": len(updates), "papers": report}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
