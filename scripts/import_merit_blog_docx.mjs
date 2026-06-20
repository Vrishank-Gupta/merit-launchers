import {execFileSync} from "node:child_process";
import process from "node:process";

const BLOG_DOC = process.env.BLOG_DOC_PATH || "/root/Merit Launchers(1).docx";
const META_DOC = process.env.META_DOC_PATH || "/root/Merit Blog Meta Tags.docx";
const API_BASE = (process.env.BLOG_IMPORT_API_BASE || "https://meritlaunchers.com/api").replace(/\/$/, "");
const CMS_EMAIL = process.env.CMS_ADMIN_EMAIL || "";
const CMS_PASSWORD = process.env.CMS_ADMIN_PASSWORD || "";

if (!CMS_EMAIL || !CMS_PASSWORD) {
  throw new Error("CMS_ADMIN_EMAIL and CMS_ADMIN_PASSWORD are required.");
}

function xmlParagraphsFromDocx(path) {
  const xml = execFileSync("unzip", ["-p", path, "word/document.xml"], {encoding: "utf8"});
  const paragraphs = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  return paragraphs
    .map((paragraph) => {
      const text = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map((match) => stripNestedTags(decodeXml(match[1])))
        .join("");
      return normalizeWhitespace(text);
    })
    .filter(Boolean);
}

function docParagraphsFromDocx(path) {
  const xml = execFileSync("unzip", ["-p", path, "word/document.xml"], {encoding: "utf8"});
  const paragraphs = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  return paragraphs
    .map((paragraph) => {
      const text = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map((match) => stripNestedTags(decodeXml(match[1])))
        .join("");
      const normalized = normalizeWhitespace(text);
      const style = paragraph.match(/<w:pStyle w:val="([^"]+)"\/>/)?.[1] || "";
      const isList = /<w:numPr>/.test(paragraph);
      return {text: normalized, style, isList};
    })
    .filter((paragraph) => paragraph.text);
}

function xmlTextRunsFromDocx(path) {
  const xml = execFileSync("unzip", ["-p", path, "word/document.xml"], {encoding: "utf8"});
  return [...xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((match) => stripNestedTags(decodeXml(match[1])))
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean);
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripNestedTags(value) {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBlogSource(path) {
  const paragraphs = docParagraphsFromDocx(path);
  const tabs = [];
  let current = null;

  for (const paragraph of paragraphs) {
    if (/^Tab\s+\d+$/i.test(paragraph.text)) {
      if (current) tabs.push(current);
      current = {label: paragraph.text, title: "", bodyParagraphs: []};
      continue;
    }
    if (!current) continue;
    if (!current.title) {
      current.title = paragraph.text;
      continue;
    }
    current.bodyParagraphs.push(paragraph);
  }

  if (current) tabs.push(current);
  return tabs.map((tab, index) => ({
    ...tab,
    index: index + 1,
    contentHtml: renderHtml(tab.bodyParagraphs),
  }));
}

function parseMetadata(path) {
  const paragraphs = xmlParagraphsFromDocx(path);
  const entries = [];
  let current = null;
  let pendingKey = null;

  for (const line of paragraphs) {
    if (/^\d+\.\s+/.test(line)) {
      if (current) entries.push(current);
      current = {sourceHeading: line.replace(/^\d+\.\s+/, "")};
      pendingKey = null;
      continue;
    }
    if (!current) continue;
    const match = line.match(/^(Title|Description|Slug|H1|Keywords)-\s*(.+)$/i);
    if (match) {
      const key = match[1].toLowerCase();
      current[key] = match[2].trim();
      pendingKey = null;
      continue;
    }
    const pendingMatch = line.match(/^(Title|Description|Slug|H1|Keywords)-\s*$/i);
    if (pendingMatch) {
      pendingKey = pendingMatch[1].toLowerCase();
      continue;
    }
    if (pendingKey && line) {
      current[pendingKey] = line.trim();
      pendingKey = null;
    }
  }

  if (current) entries.push(current);
  return entries;
}

function renderHtml(paragraphs) {
  const blocks = [];
  let index = 0;

  while (index < paragraphs.length) {
    const paragraph = paragraphs[index];
    if (!paragraph?.text) {
      index += 1;
      continue;
    }

    if (paragraph.isList) {
      const items = [];
      while (index < paragraphs.length && paragraphs[index].isList) {
        items.push(paragraphs[index].text);
        index += 1;
      }
      blocks.push(`<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
      continue;
    }

    const headingTag = htmlHeadingTag(paragraph.style);
    if (headingTag) {
      blocks.push(`<${headingTag}>${escapeHtml(paragraph.text)}</${headingTag}>`);
      index += 1;
      continue;
    }

    blocks.push(`<p>${escapeHtml(paragraph.text)}</p>`);
    index += 1;
  }

  return blocks.join("\n");
}

function htmlHeadingTag(style) {
  if (style === "Heading4") return "h4";
  if (style === "Heading3") return "h3";
  if (style === "Heading2" || style === "Heading1") return "h2";
  return null;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inferCategory(title, keywords) {
  const haystack = `${title} ${keywords}`.toLowerCase();
  if (haystack.includes("clat")) return "CLAT";
  if (haystack.includes("cuet")) return "CUET";
  if (haystack.includes("mock")) return "Mock Tests";
  return "Exam Preparation";
}

function selectH1(sourceTitle, metadataH1) {
  if (!metadataH1) return sourceTitle;
  if (/^mention\b/i.test(metadataH1)) return sourceTitle;
  return metadataH1;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return response.json();
}

async function main() {
  const sourceBlogs = parseBlogSource(BLOG_DOC);
  const metadataEntries = parseMetadata(META_DOC);

  if (sourceBlogs.length !== metadataEntries.length) {
    throw new Error(`Blog count mismatch: source=${sourceBlogs.length}, metadata=${metadataEntries.length}`);
  }

  const auth = await request("/v1/cms/auth/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email: CMS_EMAIL, password: CMS_PASSWORD}),
  });

  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.token}`,
  };

  const existingBlogs = await request("/v1/cms/admin/blogs", {headers: adminHeaders});
  const existingBySlug = new Map(existingBlogs.map((blog) => [blog.slug, blog]));
  const publishDate = new Date().toISOString();

  for (let i = 0; i < sourceBlogs.length; i += 1) {
    const source = sourceBlogs[i];
    const meta = metadataEntries[i];
    const payload = {
      title: source.title,
      slug: meta.slug,
      content: source.contentHtml,
      featured_image: null,
      author: "Merit Launchers",
      category: inferCategory(source.title, meta.keywords || ""),
      tags: (meta.keywords || "").split(",").map((item) => item.trim()).filter(Boolean),
      seo_title: meta.title || null,
      h1_title: selectH1(source.title, meta.h1),
      meta_description: meta.description || null,
      meta_keywords: meta.keywords || null,
      status: "published",
      publish_date: publishDate,
    };

    const existing = existingBySlug.get(payload.slug);
    if (existing) {
      await request(`/v1/cms/admin/blogs/${encodeURIComponent(existing.id)}`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify(payload),
      });
      console.log(`Updated ${payload.slug}`);
    } else {
      await request("/v1/cms/admin/blogs", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify(payload),
      });
      console.log(`Created ${payload.slug}`);
    }
  }
}

await main();
