function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type ReportCard = {
  label: string;
  value: string;
  note?: string;
};

type ReportSection = {
  heading: string;
  intro?: string;
  rows: Record<string, string>[];
};

function buildReportHtml(title: string, subtitle: string, cards: ReportCard[], sections: ReportSection[]) {
  const cardsHtml = cards.map((card) => `
    <div class="summary-card">
      <div class="summary-label">${escapeHtml(card.label)}</div>
      <div class="summary-value">${escapeHtml(card.value)}</div>
      ${card.note ? `<div class="summary-note">${escapeHtml(card.note)}</div>` : ""}
    </div>
  `).join("");

  const sectionsHtml = sections.map((section) => {
    const columns = Array.from(new Set(section.rows.flatMap((row) => Object.keys(row))));
    const header = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
    const body = section.rows.map((row) => (
      `<tr>${columns.map((column) => `<td>${escapeHtml(row[column] || "")}</td>`).join("")}</tr>`
    )).join("");
    return `
      <section class="report-section">
        <div class="section-head">
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.intro ? `<p>${escapeHtml(section.intro)}</p>` : ""}
        </div>
        <table>
          <thead><tr>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </section>
    `;
  }).join("");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { margin: 28px; }
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; background: #f8fbff; }
          .page { padding: 24px; }
          .hero {
            background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%);
            color: #fff;
            border-radius: 24px;
            padding: 28px 30px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
          }
          .eyebrow {
            font-size: 11px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            opacity: 0.82;
            margin-bottom: 10px;
          }
          h1 { margin: 0; font-size: 28px; line-height: 1.2; }
          .subtitle { margin-top: 10px; color: rgba(255,255,255,0.88); font-size: 13px; line-height: 1.6; }
          .meta { margin-top: 12px; font-size: 11px; color: rgba(255,255,255,0.78); }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin: 22px 0 0;
          }
          .summary-card {
            background: #fff;
            border: 1px solid #dbeafe;
            border-radius: 18px;
            padding: 14px 16px;
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
          }
          .summary-label {
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 10px;
          }
          .summary-value {
            margin-top: 8px;
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
          }
          .summary-note {
            margin-top: 6px;
            color: #475569;
            font-size: 11px;
            line-height: 1.45;
          }
          .report-section {
            margin-top: 22px;
            background: #fff;
            border: 1px solid #dbeafe;
            border-radius: 22px;
            overflow: hidden;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          }
          .section-head {
            padding: 18px 20px 12px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
          }
          .section-head h2 {
            margin: 0;
            font-size: 18px;
            color: #102a43;
          }
          .section-head p {
            margin: 6px 0 0;
            color: #64748b;
            font-size: 12px;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead th {
            background: #eff6ff;
            color: #1e3a8a;
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            border-bottom: 1px solid #dbeafe;
          }
          tbody td {
            padding: 10px 12px;
            font-size: 11px;
            border-bottom: 1px solid #eef2f7;
            vertical-align: top;
            line-height: 1.45;
          }
          tbody tr:nth-child(even) td {
            background: #fbfdff;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="hero">
            <div class="eyebrow">Merit Launchers partner operations</div>
            <h1>${escapeHtml(title)}</h1>
            <div class="subtitle">${escapeHtml(subtitle)}</div>
            <div class="meta">Generated on ${escapeHtml(new Date().toLocaleString("en-IN"))}</div>
          </div>
          <div class="summary-grid">${cardsHtml}</div>
          ${sectionsHtml}
        </div>
      </body>
    </html>
  `;
}

export function downloadPartnerDoc(
  filename: string,
  title: string,
  subtitle: string,
  cards: ReportCard[],
  sections: ReportSection[],
) {
  const html = buildReportHtml(title, subtitle, cards, sections);
  downloadBlob(filename, new Blob([html], { type: "application/msword" }));
}

function pdfEscape(text: string) {
  return String(text || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxChars = 88) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function flattenSectionsForPdf(cards: ReportCard[], sections: ReportSection[]) {
  const lines: Array<{ text: string; kind: "title" | "meta" | "section" | "line" }> = [];
  for (const card of cards) {
    lines.push({ text: `${card.label}: ${card.value}${card.note ? ` (${card.note})` : ""}`, kind: "meta" });
  }
  sections.forEach((section) => {
    lines.push({ text: "", kind: "line" });
    lines.push({ text: section.heading, kind: "section" });
    if (section.intro) {
      wrapText(section.intro, 92).forEach((line) => lines.push({ text: line, kind: "line" }));
    }
    section.rows.forEach((row, index) => {
      lines.push({ text: `${index + 1}. ${Object.values(row).filter(Boolean).join(" | ")}`, kind: "line" });
    });
  });
  return lines;
}

export function downloadPartnerPdf(
  filename: string,
  title: string,
  subtitle: string,
  cards: ReportCard[],
  sections: ReportSection[],
) {
  const pageWidth = 595;
  const pageHeight = 842;
  const left = 42;
  const right = 553;
  const top = 800;
  const bottom = 48;
  const bodyFont = 10;
  const lineHeight = 15;
  const objects: string[] = [];
  const addObject = (value: string) => {
    objects.push(value);
    return objects.length;
  };
  const fontRegular = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageObjectIds: number[] = [];

  const drawText = (x: number, y: number, text: string, fontRef: string, size: number) =>
    `BT ${fontRef} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfEscape(text)}) Tj ET`;

  const lines = flattenSectionsForPdf(cards, sections);
  let cursorY = top;
  let contentParts: string[] = [];

  const flushPage = () => {
    const content = contentParts.join("\n");
    const contentObjectId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    pageObjectIds.push(addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjectId} 0 R /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> >>`,
    ));
    contentParts = [];
    cursorY = top;
  };

  contentParts.push("0.97 0.98 1 rg");
  contentParts.push(`40 724 515 90 re f`);
  contentParts.push("0.06 0.16 0.29 rg");
  contentParts.push(drawText(left, 780, "MERIT LAUNCHERS PARTNER REPORT", "/F2", 11));
  contentParts.push(drawText(left, 754, title, "/F2", 22));
  wrapText(subtitle, 84).forEach((line, index) => {
    contentParts.push("0.25 0.35 0.47 rg");
    contentParts.push(drawText(left, 734 - (index * 14), line, "/F1", 10));
  });
  cursorY = 690;

  for (const entry of lines) {
    const wrapped = entry.kind === "line" ? wrapText(entry.text, 94) : [entry.text];
    const requiredHeight = wrapped.length * lineHeight + (entry.kind === "section" ? 8 : 0);
    if (cursorY - requiredHeight < bottom) {
      flushPage();
    }
    if (entry.kind === "section") {
      contentParts.push("0.93 0.96 1 rg");
      contentParts.push(`${left - 2} ${cursorY - 6} ${right - left} 22 re f`);
      contentParts.push("0.08 0.23 0.42 rg");
      contentParts.push(drawText(left + 6, cursorY, entry.text, "/F2", 12));
      cursorY -= 24;
      continue;
    }
    const fontRef = entry.kind === "title" ? "/F2" : "/F1";
    const size = entry.kind === "title" ? 12 : bodyFont;
    const color = entry.kind === "meta" ? "0.28 0.36 0.48 rg" : "0.14 0.18 0.24 rg";
    wrapped.forEach((line) => {
      contentParts.push(color);
      contentParts.push(drawText(left, cursorY, line, fontRef, size));
      cursorY -= lineHeight;
    });
  }

  if (contentParts.length) {
    flushPage();
  }

  const pagesObjectId = addObject(`<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>`);
  pageObjectIds.forEach((pageObjectId) => {
    objects[pageObjectId - 1] = objects[pageObjectId - 1].replace("/Parent 0 0 R", `/Parent ${pagesObjectId} 0 R`);
  });
  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  downloadBlob(filename, new Blob([pdf], { type: "application/pdf" }));
}

