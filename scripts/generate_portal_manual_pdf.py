from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "merit_launchers_portal_manual.md"
OUTPUT = ROOT / "docs" / "merit_launchers_portal_manual.pdf"
ENV_FILE = ROOT / "server.env"


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ManualTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=14,
            alignment=TA_LEFT,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ManualH1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=22,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=12,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ManualH2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=18,
            textColor=colors.HexColor("#1d4ed8"),
            spaceBefore=10,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ManualBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#334155"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ManualBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#334155"),
            leftIndent=14,
            firstLineIndent=-8,
            bulletIndent=0,
            spaceAfter=4,
        )
    )
    return styles


def escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def load_env_values():
    values = {}
    if not ENV_FILE.exists():
        return values
    for raw in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def build_internal_credentials_block():
    env = load_env_values()
    return [
        "",
        "## Internal Access Snapshot",
        "### Admin CMS",
        "- Login URL: `https://meritlaunchers.com/admin/`",
        f"- Username: `{env.get('CMS_ADMIN_EMAIL', 'not configured')}`",
        f"- Password: `{env.get('CMS_ADMIN_PASSWORD', 'not configured')}`",
        "### Marketing Admin",
        "- Login URL: `https://meritlaunchers.com/marketing-admin/login`",
        f"- Username: `{env.get('MARKETING_ADMIN_EMAIL', 'not configured')}`",
        f"- Password: `{env.get('MARKETING_ADMIN_PASSWORD', 'not configured')}`",
        "### Student / Partner Notes",
        "- Student production sign-in uses Google and OTP flows.",
        "- Partner accounts use partner-specific credentials created from the marketing admin portal.",
        "",
        "## Security Note",
        "- This PDF is intentionally generated locally for internal use.",
        "- Do not commit or circulate the generated PDF outside the internal team.",
    ]


def render_markdown(lines, styles):
    story = []
    for raw in lines:
        line = raw.rstrip()
        if not line:
            story.append(Spacer(1, 4))
            continue
        if line.startswith("# "):
            story.append(Paragraph(escape(line[2:]), styles["ManualTitle"]))
            continue
        if line.startswith("## "):
            story.append(Paragraph(escape(line[3:]), styles["ManualH1"]))
            continue
        if line.startswith("### "):
            story.append(Paragraph(escape(line[4:]), styles["ManualH2"]))
            continue
        if line.startswith("- "):
            story.append(
                Paragraph(escape(line[2:]), styles["ManualBullet"], bulletText="•")
            )
            continue
        story.append(Paragraph(escape(line), styles["ManualBody"]))
    return story


def main():
    styles = build_styles()
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    lines.extend(build_internal_credentials_block())
    story = render_markdown(lines, styles)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="Merit Launchers Internal Portal Manual",
        author="OpenAI Codex",
    )
    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    main()
