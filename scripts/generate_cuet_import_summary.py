import json
import subprocess
from collections import defaultdict
from pathlib import Path


ROOT = Path(r"c:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers")
DOCS = ROOT / "docs"
SKIPPED_PATH = DOCS / "cuet_skipped_questions.json"
AUDIT_PATH = DOCS / "cuet_remaining_audit.json"
JSON_OUT = DOCS / "cuet_final_import_summary.json"
MD_OUT = DOCS / "cuet_final_import_summary.md"


def q(sql: str) -> str:
    return subprocess.check_output(
        [
            "docker",
            "exec",
            "merit-launchers-postgres",
            "psql",
            "-U",
            "merit",
            "-d",
            "merit_launchers",
            "-t",
            "-A",
            "-F",
            "|",
            "-c",
            sql,
        ],
        text=True,
    )


def load_skipped():
    data = json.loads(SKIPPED_PATH.read_text(encoding="utf-8"))
    grouped = defaultdict(list)
    for item in data.get("items", []):
        grouped[(item["subject"], item["paper"])].append(
            {
                "questionIndex": item["questionIndex"],
                "reason": item["reason"],
                "prompt": item["prompt"],
            }
        )
    for items in grouped.values():
        items.sort(key=lambda x: x["questionIndex"])
    return grouped


def load_db_summary():
    sql = """
    select
      s.title as subject,
      p.title as paper,
      count(q.id)::int as question_count
    from papers p
    join courses c on c.id = p.course_id
    left join subjects s on s.id = p.subject_id
    left join questions q on q.paper_id = p.id
    where c.id = 'cuet'
    group by s.title, p.title
    order by s.title asc, p.title asc;
    """
    rows = []
    for line in q(sql).splitlines():
        if not line.strip():
            continue
        subject, paper, count = line.split("|")
        rows.append(
            {
                "subject": subject,
                "paper": paper,
                "questionCount": int(count),
            }
        )
    return rows


def build_report():
    skipped = load_skipped()
    db_rows = load_db_summary()
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))

    subjects = defaultdict(list)
    total_skipped = 0
    total_questions = 0
    papers_with_skips = 0

    for row in db_rows:
        key = (row["subject"], row["paper"])
        skipped_items = skipped.get(key, [])
        skipped_count = len(skipped_items)
        total_skipped += skipped_count
        total_questions += row["questionCount"]
        if skipped_count:
            papers_with_skips += 1
        subjects[row["subject"]].append(
            {
                "paper": row["paper"],
                "questionCount": row["questionCount"],
                "skippedCount": skipped_count,
                "skippedQuestionNumbers": [item["questionIndex"] for item in skipped_items],
                "skippedDetails": skipped_items,
            }
        )

    for papers in subjects.values():
        papers.sort(key=lambda x: x["paper"])

    report = {
        "createdAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "course": "CUET",
        "paperCount": len(db_rows),
        "questionCount": total_questions,
        "papersWithSkippedQuestions": papers_with_skips,
        "totalSkippedQuestionsLogged": total_skipped,
        "remainingMissingPapers": audit.get("missing", []),
        "subjects": [
            {
                "subject": subject,
                "paperCount": len(papers),
                "questionCount": sum(item["questionCount"] for item in papers),
                "skippedQuestionCount": sum(item["skippedCount"] for item in papers),
                "papers": papers,
            }
            for subject, papers in sorted(subjects.items())
        ],
    }
    return report


def write_markdown(report):
    lines = [
        "# CUET Final Import Summary",
        "",
        f"- Papers in DB: {report['paperCount']}",
        f"- Questions in DB: {report['questionCount']}",
        f"- Papers with skipped questions: {report['papersWithSkippedQuestions']}",
        f"- Total skipped questions logged: {report['totalSkippedQuestionsLogged']}",
        f"- Missing papers: {len(report['remainingMissingPapers'])}",
        "",
    ]

    if report["remainingMissingPapers"]:
        lines.append("## Missing Papers")
        lines.append("")
        for item in report["remainingMissingPapers"]:
            lines.append(f"- {item['subject']} / {item['paper']}")
        lines.append("")

    lines.append("## Subject Breakdown")
    lines.append("")
    for subject in report["subjects"]:
        lines.append(
            f"### {subject['subject']} ({subject['paperCount']} papers, {subject['questionCount']} questions, {subject['skippedQuestionCount']} skipped)"
        )
        lines.append("")
        for paper in subject["papers"]:
            skipped = ", ".join(str(x) for x in paper["skippedQuestionNumbers"]) or "None"
            lines.append(
                f"- {paper['paper']}: {paper['questionCount']} questions in DB, skipped {paper['skippedCount']} ({skipped})"
            )
        lines.append("")

    lines.append("## Skipped Question Details")
    lines.append("")
    for subject in report["subjects"]:
        for paper in subject["papers"]:
            if not paper["skippedDetails"]:
                continue
            lines.append(f"### {subject['subject']} / {paper['paper']}")
            lines.append("")
            for item in paper["skippedDetails"]:
                prompt = item["prompt"].replace("\n", " ").strip()
                lines.append(f"- Q{item['questionIndex']}: {item['reason']}")
                lines.append(f"  Prompt: {prompt}")
            lines.append("")

    MD_OUT.write_text("\n".join(lines), encoding="utf-8")


def main():
    report = build_report()
    JSON_OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    write_markdown(report)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
