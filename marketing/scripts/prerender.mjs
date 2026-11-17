// Post-build step: renders public routes to static HTML so search engines and
// AI crawlers (which mostly do not execute JavaScript) see real page content.
// Also generates sitemap.xml, llms.txt and llms-full.txt from the rendered pages.
//
// Fails soft: if the headless browser cannot start, the plain SPA build is left
// untouched and the build still succeeds.

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SITE_ORIGIN = "https://www.meritlaunchers.com";
const API_ORIGIN = (process.env.PRERENDER_API_ORIGIN || SITE_ORIGIN).replace(/\/$/, "");
const STRICT = process.env.PRERENDER_STRICT === "1";

const STATIC_ROUTES = [
  { path: "/", group: "Main", priority: "1.0", changefreq: "weekly" },
  { path: "/courses/cuet", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/courses/clat", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/courses/nda", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/courses/ipmat", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/courses/jee", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/courses/neet", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/courses/ssc", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/courses/dsssb", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/courses/ctet-1", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/courses/ctet-2", group: "Courses", priority: "0.9", changefreq: "weekly" },
  { path: "/fee-structure", group: "Main", priority: "0.8", changefreq: "monthly" },
  { path: "/faq", group: "Main", priority: "0.8", changefreq: "monthly" },
  { path: "/about", group: "Main", priority: "0.7", changefreq: "monthly" },
  { path: "/our-team", group: "Main", priority: "0.6", changefreq: "monthly" },
  { path: "/blog", group: "Main", priority: "0.8", changefreq: "weekly" },
  { path: "/videos", group: "Main", priority: "0.6", changefreq: "weekly" },
  { path: "/external-links", group: "Main", priority: "0.4", changefreq: "monthly" },
  { path: "/contact", group: "Main", priority: "0.6", changefreq: "monthly" },
  { path: "/privacy-policy", group: "Policies", priority: "0.3", changefreq: "yearly" },
  { path: "/terms-conditions", group: "Policies", priority: "0.3", changefreq: "yearly" },
  { path: "/return-policy", group: "Policies", priority: "0.3", changefreq: "yearly" },
];

// Any path the app doesn't know renders the NotFound page.
const NOT_FOUND_PATH = "/__not-found__";

const BLOCKED_HOSTS = [
  "googletagmanager.com",
  "google-analytics.com",
  "doubleclick.net",
  "facebook.net",
  "clarity.ms",
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

function log(message) {
  console.log(`[prerender] ${message}`);
}

async function fetchBlogs() {
  try {
    const res = await fetch(`${API_ORIGIN}/v1/cms/blogs`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blogs = await res.json();
    return blogs.filter((b) => b.slug && (!b.status || b.status === "published"));
  } catch (err) {
    log(`could not load blog list from ${API_ORIGIN} (${err.message}); blog posts will not be prerendered`);
    return [];
  }
}

function startStaticServer(shellHtml) {
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const filePath = path.join(DIST, urlPath);
    try {
      if (!filePath.startsWith(DIST)) throw new Error("outside dist");
      const info = await stat(filePath);
      if (!info.isFile()) throw new Error("not a file");
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
      res.end(await readFile(filePath));
    } catch {
      // SPA fallback always serves the original, un-prerendered shell.
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(shellHtml);
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function renderRoute(browser, baseUrl, route) {
  const page = await browser.newPage();
  try {
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      const url = new URL(request.url());
      if (BLOCKED_HOSTS.some((host) => url.hostname.endsWith(host))) {
        return request.abort();
      }
      // Serve API calls from production so pages render with real content.
      if (url.origin === baseUrl && url.pathname.startsWith("/v1/")) {
        try {
          const upstream = await fetch(`${API_ORIGIN}${url.pathname}${url.search}`, {
            signal: AbortSignal.timeout(20000),
          });
          return request.respond({
            status: upstream.status,
            contentType: upstream.headers.get("content-type") || "application/json",
            body: Buffer.from(await upstream.arrayBuffer()),
          });
        } catch {
          return request.respond({ status: 502, contentType: "application/json", body: "{}" });
        }
      }
      return request.continue();
    });

    await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle0", timeout: 60000 });
    // Let page-level SEO effects (title, meta, canonical, JSON-LD) settle.
    await page.waitForFunction(
      (expected) => {
        const canonical = document.querySelector('link[rel="canonical"]');
        return canonical && canonical.href.replace(/\/$/, "").endsWith(expected.replace(/\/$/, ""));
      },
      { timeout: 10000 },
      route.path === "/" ? "meritlaunchers.com" : route.path,
    ).catch(() => {});
    if (route.notFound) await page.waitForFunction(() => /not found/i.test(document.title), { timeout: 10000 });

    const details = await page.evaluate(() => {
      const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") || "";
      const root = document.getElementById("root");
      const contentRoot = document.querySelector("main") || root;
      // innerText needs live layout to keep line breaks, so hide chrome in place and restore afterwards.
      const hidden = [...contentRoot.querySelectorAll("nav, header, footer, [aria-hidden='true']")].map((el) => {
        const previous = el.style.display;
        el.style.display = "none";
        return () => (el.style.display = previous);
      });
      const text = contentRoot.innerText;
      hidden.forEach((restore) => restore());
      return {
        title: document.title,
        description: meta("description"),
        robots: meta("robots"),
        isNotFound: /not found|404/i.test(document.title) || /404/.test(root?.innerText.slice(0, 200) || ""),
        text: text.replace(/\n{3,}/g, "\n\n").trim(),
        rootHasContent: Boolean(root && root.children.length > 0),
      };
    });

    if (!details.rootHasContent) throw new Error("page rendered no content");

    // The snapshot is for crawlers. Visitors with JavaScript never see it: it is
    // hidden until main.tsx clears it and renders the app normally. This also
    // covers nginx serving index.html as the app shell for other routes.
    const hideForJs =
      `<script>document.documentElement.classList.add("js-enabled")</script>` +
      `<style>.js-enabled #root[data-prerendered]{visibility:hidden}</style>`;
    const html = (await page.content())
      .replace("</head>", `${hideForJs}</head>`)
      .replace('<div id="root">', '<div id="root" data-prerendered="">');
    if (!html.includes("data-prerendered")) throw new Error("could not mark prerendered root");

    return { ...details, html };
  } finally {
    await page.close();
  }
}

// Written as /about.html (not /about/index.html) so nginx's `try_files $uri $uri.html`
// serves /about directly instead of 301-redirecting to /about/.
async function writeRouteHtml(routePath, html) {
  const target = routePath === "/" ? path.join(DIST, "index.html") : path.join(DIST, `${routePath.replace(/^\/+/, "")}.html`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
}

function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildSitemap(entries) {
  const urls = entries
    .filter((e) => !/noindex/i.test(e.robots || ""))
    .map(
      (e) => `  <url>
    <loc>${xmlEscape(SITE_ORIGIN + (e.path === "/" ? "/" : e.path))}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function cleanTitle(title) {
  return title.replace(/\s*\|\s*Merit Launchers( Blog)?\s*$/i, "").trim();
}

function buildLlmsTxt(entries) {
  const sections = [
    ["Courses", "Mock test series by exam"],
    ["Main", "About the platform"],
    ["Blog", "Exam preparation guides"],
    ["Policies", "Policies"],
  ];
  const lines = [
    "# Merit Launchers",
    "",
    "> Merit Launchers (meritlaunchers.com) is an Indian online mock test platform for competitive and entrance exams: CUET, CLAT, NDA, IPMAT, JEE, NEET, SSC, DSSSB and CTET (Paper I and II). Students take full-length, exam-pattern mock tests online, get instant scores with detailed solutions and performance analytics, and can try free preview papers before buying a test series. Based in New Delhi, India.",
    "",
    "Key facts:",
    "- Website: https://www.meritlaunchers.com",
    "- Student web app (works on any device): https://www.meritlaunchers.com/portal/",
    "- Android app: https://play.google.com/store/apps/details?id=co.robin.qibrw",
    "- Contact: info@meritlaunchers.com, +91 93549 02925",
    "- Full text of every page: https://www.meritlaunchers.com/llms-full.txt",
    "",
  ];
  for (const [group, heading] of sections) {
    const items = entries.filter((e) => e.group === group);
    if (!items.length) continue;
    lines.push(`## ${heading}`, "");
    for (const e of items) {
      const desc = e.description ? `: ${e.description}` : "";
      lines.push(`- [${cleanTitle(e.title)}](${SITE_ORIGIN}${e.path})${desc}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function buildLlmsFullTxt(entries) {
  const parts = [
    "# Merit Launchers: full site content",
    "",
    "> Plain-text version of the public pages on https://www.meritlaunchers.com, generated at build time for AI assistants and search tools.",
    "",
  ];
  for (const e of entries) {
    if (!e.text) continue;
    parts.push("---", "", `## ${cleanTitle(e.title)}`, "", `URL: ${SITE_ORIGIN}${e.path}`, "");
    if (e.description) parts.push(`Summary: ${e.description}`, "");
    parts.push(e.text, "");
  }
  return parts.join("\n");
}

async function main() {
  const shellPath = path.join(DIST, "index.html");
  const shellHtml = await readFile(shellPath, "utf8");

  let puppeteer;
  try {
    puppeteer = (await import("puppeteer")).default;
  } catch (err) {
    log(`puppeteer unavailable (${err.message}); skipping prerender`);
    if (STRICT) process.exit(1);
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  } catch (err) {
    log(`could not start headless browser (${err.message}); skipping prerender`);
    if (STRICT) process.exit(1);
    return;
  }

  const server = await startStaticServer(shellHtml);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const today = new Date().toISOString().slice(0, 10);

  const blogs = await fetchBlogs();
  const routes = [
    ...STATIC_ROUTES.map((r) => ({ ...r, lastmod: today })),
    ...blogs.map((b) => ({
      path: `/blog/${b.slug}`,
      group: "Blog",
      priority: "0.7",
      changefreq: "monthly",
      lastmod: (b.updated_at || b.publish_date || b.created_at || today).slice(0, 10),
    })),
  ];

  const rendered = [];
  const failures = [];
  try {
    for (const route of routes) {
      try {
        const result = await renderRoute(browser, baseUrl, route);
        if (result.isNotFound) {
          failures.push(`${route.path}: rendered as Not Found`);
          continue;
        }
        rendered.push({ ...route, ...result });
        log(`ok   ${route.path} (${result.text.length} chars)`);
      } catch (err) {
        failures.push(`${route.path}: ${err.message}`);
        log(`fail ${route.path}: ${err.message}`);
      }
    }
    // Not-found page, served by nginx with a real 404 status for unknown URLs.
    try {
      const notFound = await renderRoute(browser, baseUrl, { path: NOT_FOUND_PATH, notFound: true });
      const html = notFound.html
        .replace(/<link rel="canonical"[^>]*>/g, "")
        .replace(/<meta property="og:url"[^>]*>/g, "");
      await writeFile(path.join(DIST, "404.html"), html, "utf8");
      log("ok   404.html");
    } catch (err) {
      failures.push(`404.html: ${err.message}`);
    }
  } finally {
    await browser.close();
    server.close();
  }

  // Write HTML only after every route has rendered from the pristine shell.
  for (const entry of rendered) {
    await writeRouteHtml(entry.path, entry.html);
  }

  if (rendered.length) {
    await writeFile(path.join(DIST, "sitemap.xml"), buildSitemap(rendered), "utf8");
    await writeFile(path.join(DIST, "llms.txt"), buildLlmsTxt(rendered), "utf8");
    await writeFile(path.join(DIST, "llms-full.txt"), buildLlmsFullTxt(rendered), "utf8");
  }

  log(`prerendered ${rendered.length}/${routes.length} routes`);
  if (failures.length) {
    log(`failures:\n  ${failures.join("\n  ")}`);
    if (STRICT) process.exit(1);
  }
}

main().catch((err) => {
  log(`unexpected error: ${err.stack || err.message}`);
  process.exit(STRICT ? 1 : 0);
});
