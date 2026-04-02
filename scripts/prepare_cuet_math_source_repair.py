import importlib.util
import json
import os
import re
from pathlib import Path

import psycopg2


REPO_ROOT = Path(r"c:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers")
RECOVERY_SCRIPT = REPO_ROOT / "scripts" / "recover_cuet_skipped_with_ocr.py"
OUTPUT_REPORT = REPO_ROOT / "tmp" / "math_source_direct_repair_report.json"


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


def clean_text(value: str) -> str:
    result = str(value or "").replace("\r\n", "\n").replace("\r", "\n").strip()
    replacements = {
        "Ã‚Â²": "²",
        "Ã‚Â³": "³",
        "Ã‚Â·": "·",
        "Ã‚Â°": "°",
        "Ãƒâ€”": "×",
        "Ã¢Ë†Â«": "∫",
        "Ã¢Ë†Å¡": "√",
        "Ã¢â€°Â¥": "≥",
        "Ã¢â€°Â¤": "≤",
        "Ã¢Ë†Â©": "∩",
        "Ã¢Ë†Âª": "∪",
        "Ã¢Ë†â€¦": "∅",
        "Ã¢Ë†â€ ": "Δ",
        "ÃŽâ€": "Δ",
        "Ãâ‚¬": "π",
        "ÃŽÂ¸": "θ",
        "ÃŽÂ±": "α",
        "ÃŽÂ²": "β",
        "ÃŽÂ³": "γ",
        "Ã¢â€ â€™": "→",
        "Ã¢Ë†Å¾": "∞",
    }
    for from_text, to_text in replacements.items():
        result = result.replace(from_text, to_text)
    result = re.sub(r"\s+", " ", result.replace("\n", " \n ")).replace(" \n ", "\n")
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result.strip()


def main():
    load_env()
    recovery = load_recovery_module()
    conn = psycopg2.connect(db_url())
    cur = conn.cursor()
    report = {"papers": [], "updates": []}

    try:
        for paper_no in range(1, 11):
            paper_title = f"PAPER {paper_no}"
            file_path = recovery.ROOT / "Mathematics" / f"{paper_title}.pdf"
            text = recovery.extract_targeted_hybrid_text(file_path)
            item = recovery.parse_paper(text, "Mathematics", paper_title, file_path)

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
            existing_rows = {
                row[0]: {
                    "prompt": row[1],
                    "options": row[2],
                    "correctIndex": row[3],
                }
                for row in cur.fetchall()
            }

            paper_updates = []
            for question in item["questions"]:
                question_number = int(question.get("questionNumber") or 0)
                sort_order = question_number - 1
                if sort_order not in existing_rows:
                    continue
                if len(question.get("options", [])) != 4:
                    continue

                next_prompt = clean_text(question["prompt"])
                next_options = [clean_text(option) for option in question["options"]]
                next_correct_index = question.get("correctIndex", -1)
                existing = existing_rows[sort_order]
                current_prompt = clean_text(existing["prompt"])
                current_options = [clean_text(option) for option in existing["options"]]

                if (
                    next_prompt != current_prompt
                    or next_options != current_options
                    or (next_correct_index >= 0 and next_correct_index != existing["correctIndex"])
                ):
                    paper_updates.append(
                        {
                            "paperTitle": paper_title,
                            "questionNumber": question_number,
                            "sortOrder": sort_order,
                            "prompt": next_prompt,
                            "options": next_options,
                            "correctIndex": (
                                next_correct_index
                                if next_correct_index >= 0
                                else existing["correctIndex"]
                            ),
                        }
                    )

            report["papers"].append(
                {
                    "paperTitle": paper_title,
                    "recoveredCount": len(item["questions"]),
                    "updates": len(paper_updates),
                }
            )
            report["updates"].extend(paper_updates)
    finally:
        cur.close()
        conn.close()

    OUTPUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_REPORT.write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(json.dumps(report["papers"], indent=2, ensure_ascii=False))
    print(f"TOTAL {len(report['updates'])}")


if __name__ == "__main__":
    main()
