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
        .map((match) => decodeXml(match[1]))
        .join("");
      return normalizeWhitespace(text);
    })
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

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBlogSource(path) {
  const paragraphs = xmlParagraphsFromDocx(path);
  const tabs = [];
  let current = null;

  for (const line of paragraphs) {
    if (/^Tab\s+\d+$/i.test(line)) {
      if (current) tabs.push(current);
      current = {label: line, title: "", bodyLines: []};
      continue;
    }
    if (!current) continue;
    if (!current.title) {
      current.title = line;
      continue;
    }
    current.bodyLines.push(line);
  }

  if (current) tabs.push(current);
  return tabs.map((tab, index) => ({
    ...tab,
    index: index + 1,
    contentHtml: renderHtml(tab.bodyLines),
  }));
}

function parseMetadata(path) {
  const paragraphs = xmlParagraphsFromDocx(path);
  const entries = [];
  let current = null;

  for (const line of paragraphs) {
    if (/^\d+\.\s+/.test(line)) {
      if (current) entries.push(current);
      current = {sourceHeading: line.replace(/^\d+\.\s+/, "")};
      continue;
    }
    if (!current) continue;
    const match = line.match(/^(Title|Description|Slug|H1|Keywords)-\s*(.+)$/i);
    if (match) {
      const key = match[1].toLowerCase();
      current[key] = match[2].trim();
    }
  }

  if (current) entries.push(current);
  return entries;
}

function renderHtml(lines) {
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line) {
      index += 1;
      continue;
    }

    if (line.endsWith(":")) {
      blocks.push(`<p>${escapeHtml(line)}</p>`);
      index += 1;
      const items = [];
      while (index < lines.length && looksLikeListItem(lines[index])) {
        items.push(lines[index]);
        index += 1;
      }
      if (items.length) {
        blocks.push(`<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
      }
      continue;
    }

    if (looksLikeHeading(line)) {
      const tag = looksLikeSubheading(line) ? "h3" : "h2";
      blocks.push(`<${tag}>${escapeHtml(line)}</${tag}>`);
      index += 1;
      continue;
    }

    blocks.push(`<p>${escapeHtml(line)}</p>`);
    index += 1;
  }

  return blocks.join("\n");
}

function looksLikeHeading(line) {
  if (!line) return false;
  if (line.length > 90) return false;
  if (/[.!?]$/.test(line)) return false;
  if (/^(Different|Difficulty|Section distribution|Marking schemes|Divide|Avoid|Increase|Maintain|Which|All India|Detailed|Section-wise|Reading|Grammar|Vocabulary|Verbal|Physics|Chemistry|Mathematics|Biology|Accountancy|Economics|Political|General Knowledge|Current Affairs|Logical Reasoning|Quantitative Aptitude|Candidates|There is|Learning|Daily|Regular|Review|Identify|Improve|Track|Strict|Long|Continuous|Decision-making|Structured|Real-time|Smart preparation|Expert guidance|How to allocate|How to prioritise|How to avoid)$/i.test(line)) {
    return false;
  }
  return /^[A-Z0-9]/.test(line);
}

function looksLikeSubheading(line) {
  return /^(\d+\.\s|Section\s+[IVX]+:|Basic Eligibility$|Strengths$|Weak Areas$|Progress Trends$|Better Focus$|Improved Speed$|Smart Decision-Making$|Strong Time Management$|Real Exam Simulation$|Performance Benchmarking$|Speed and Accuracy Improvement$|Strategy Development$)/.test(line);
}

function looksLikeListItem(line) {
  if (!line) return false;
  if (line.length > 80) return false;
  if (/[.!?]$/.test(line)) return false;
  if (looksLikeHeading(line)) return false;
  return true;
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
