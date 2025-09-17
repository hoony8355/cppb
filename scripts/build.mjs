// Minimal, dependency-free static site builder for GitHub Pages
// Assumes the following exist: site.config.json, src/layout.html, src/post.html, src/styles.css
// Reads Markdown from content/posts/*.md and emits HTML under /docs plus sitemap.xml & robots.txt

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "posts");
const SRC_DIR = path.join(ROOT, "src");
const DOCS_DIR = path.join(ROOT, "docs");

// ---------------------- helpers ----------------------
const exists = async (p) => !!(await fs.stat(p).catch(() => null));
const read = (p) => fs.readFile(p, "utf8");
const write = (p, c) => fs.mkdir(path.dirname(p), { recursive: true }).then(() => fs.writeFile(p, c, "utf8"));

const todayISO = () => new Date().toISOString().slice(0, 10);

function safe(val, fallback = "") {
  return (val ?? "").toString().trim() || fallback;
}

function slugify(s) {
  return safe(s)
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)/g, "") || "post";
}

// very tiny YAML frontmatter parser (keys: title, description, date, updated, slug, cover, keywords, products)
function parseFrontmatter(src) {
  const fmMatch = src.match(/^---\s*([\s\S]*?)\s*---\s*\n?([\s\S]*)$/);
  if (!fmMatch) return [{}, src];

  const yaml = fmMatch[1];
  const body = fmMatch[2];

  const data = {};
  let currentKey = null;

  const lines = yaml.split(/\r?\n/);
  for (let raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;

    // array start: keywords: [ "a", "b" ]
    const arrMatchInline = line.match(/^(\w+)\s*:\s*\[(.*)\]\s*$/);
    if (arrMatchInline) {
      const key = arrMatchInline[1];
      const arr = arrMatchInline[2]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      data[key] = arr;
      currentKey = null;
      continue;
    }

    // key: value
    const kv = line.match(/^(\w+)\s*:\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      let value = kv[2].trim();
      // strip quotes
      value = value.replace(/^["']|["']$/g, "");
      // start of block (products:)
      if (value === "" && (key === "products" || key === "keywords")) {
        data[key] = [];
        currentKey = key;
      } else {
        data[key] = value;
        currentKey = null;
      }
      continue;
    }

    // list items for currentKey
    const li = line.match(/^-\s+(.*)$/);
    if (li && currentKey) {
      const itemLine = li[1].trim();
      if (currentKey === "keywords") {
        data.keywords.push(itemLine.replace(/^["']|["']$/g, ""));
      } else if (currentKey === "products") {
        // very naive product object parser: key: val pairs separated by commas
        // ex) name: "상품", url: "https://...", image: "...", price: 1000, currency: "KRW"
        const obj = {};
        itemLine.split(/\s*,\s*/).forEach((pair) => {
          const m = pair.match(/^(\w+)\s*:\s*(.*)$/);
          if (m) {
            const k = m[1];
            let v = m[2].trim().replace(/^["']|["']$/g, "");
            // number
            if (/^\d+(\.\d+)?$/.test(v)) v = Number(v);
            obj[k] = v;
          }
        });
        data.products.push(obj);
      }
    }
  }

  return [data, body];
}

// **very** small markdown to HTML (headings, links, images, paragraphs, bold/italic, lists)
function mdToHtml(md) {
  let html = md;

  // code fences (no highlighting, keep as-is)
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${escapeHtml(code)}</code></pre>`);

  // images ![alt](src)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    return `<img src="${src}" alt="${escapeHtml(alt)}" loading="lazy">`;
  });

  // links [text](href)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, text, href) => {
    return `<a href="${href}" target="_blank" rel="sponsored nofollow ugc">${escapeHtml(text)}</a>`;
  });

  // bold/italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // headings #### ### ## #
  html = html.replace(/^\s*######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^\s*#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^\s*####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^\s*###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^\s*##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^\s*#\s+(.+)$/gm, "<h1>$1</h1>");

  // unordered lists
  html = html.replace(/(^|\n)(\s*[-*]\s.+(\n\s*[-*]\s.+)*)/g, (m) => {
    const items = m
      .trim()
      .split(/\n/)
      .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
      .map((c) => `<li>${c}</li>`)
      .join("");
    return `\n<ul>${items}</ul>`;
  });

  // paragraphs (very naive): wrap bare lines into <p>
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (/^\s*<(h\d|ul|ol|pre|img|blockquote)/i.test(block.trim())) return block;
      return `<p>${block.trim().replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function excerptFrom(html, limit = 160) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, limit);
}

function ensureRelTarget(html) {
  // add rel/target to any external link missing them
  return html.replace(/<a\s+([^>]*href="https?:\/\/[^"]+"[^>]*)>/gi, (m, attrs) => {
    const hasRel = /rel=/.test(attrs);
    const hasTarget = /target=/.test(attrs);
    return `<a ${attrs}${hasTarget ? "" : ' target="_blank"'}${hasRel ? "" : ' rel="sponsored nofollow ugc"'}>`;
  });
}

// JSON-LD
function jsonLdForPost({ title, description, url, date, updated, image, siteName }) {
  const graph = [
    {
      "@type": "BlogPosting",
      "headline": title,
      "description": description,
      "image": image ? { "@type": "ImageObject", "url": image } : undefined,
      "datePublished": date,
      "dateModified": updated || date,
      "mainEntityOfPage": { "@type": "WebPage", "@id": url },
      "publisher": { "@type": "Organization", "name": siteName }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": siteName, "item": url.split("/").slice(0, 3).join("/") + "/" },
        { "@type": "ListItem", "position": 2, "name": title, "item": url }
      ]
    }
  ].filter(Boolean);

  return `<script type="application/ld+json">{"@context":"https://schema.org","@graph":${JSON.stringify(graph)}}</script>`;
}

function jsonLdSite({ siteName, baseUrl }) {
  const graph = [
    {
      "@type": "Organization",
      "name": siteName,
      "url": baseUrl
    },
    {
      "@type": "WebSite",
      "name": siteName,
      "url": baseUrl
    }
  ];
  return `<script type="application/ld+json">{"@context":"https://schema.org","@graph":${JSON.stringify(graph)}}</script>`;
}

// ---------------------- main build ----------------------
async function main() {
  if (!(await exists(DOCS_DIR))) await fs.mkdir(DOCS_DIR, { recursive: true });

  const cfg = JSON.parse(await read(path.join(ROOT, "site.config.json")).catch(() => "{}"));
  const siteName = cfg.siteName || "My Blog";
  const baseUrl = (cfg.baseUrl || "").replace(/\/+$/, ""); // e.g. https://username.github.io/repo
  const defaultImage = cfg.defaultImage || "/public/og.jpg";
  const disclosure = cfg.disclosure || "";
  const year = new Date().getFullYear().toString();

  const layout = await read(path.join(SRC_DIR, "layout.html"));
  const postTpl = await read(path.join(SRC_DIR, "post.html"));

  const files = (await fs.readdir(CONTENT_DIR).catch(() => []))
    .filter((f) => f.endsWith(".md"))
    .sort();

  const posts = [];

  for (const f of files) {
    const raw = await read(path.join(CONTENT_DIR, f));
    const [fm, mdBody] = parseFrontmatter(raw);

    const title = safe(fm.title, f.replace(/\.md$/i, ""));
    const date = safe(fm.date, todayISO());
    const updated = safe(fm.updated, date);
    const slug = slugify(fm.slug || f.replace(/\.md$/i, ""));
    const cover = safe(fm.cover, defaultImage);
    const description = safe(fm.description, "");
    const keywords = Array.isArray(fm.keywords) ? fm.keywords.join(",") : safe(fm.keywords, "");

    const y = date.slice(0, 4);
    const m = date.slice(5, 7);

    const relPath = `/${y}/${m}/${slug}/index.html`;
    const outPath = path.join(DOCS_DIR, y, m, slug, "index.html");
    const url = `${baseUrl}${relPath}`;

    let bodyHtml = mdToHtml(mdBody);
    bodyHtml = ensureRelTarget(bodyHtml);

    // simple product cards if fm.products exists
    let productCards = "";
    if (Array.isArray(fm.products) && fm.products.length) {
      productCards = fm.products
        .map((p) => {
          const name = escapeHtml(safe(p.name, ""));
          const image = escapeHtml(safe(p.image, ""));
          const price = safe(String(p.price ?? ""), "");
          const currency = escapeHtml(safe(p.currency, "KRW"));
          const url = escapeHtml(safe(p.url, "#"));
          return `
<div class="product-card">
  ${image ? `<img src="${image}" alt="${name}" loading="lazy" width="96" height="96">` : ""}
  <div class="info">
    <div class="title"><strong>${name}</strong></div>
    ${price ? `<div class="price">${price} ${currency}</div>` : ""}
    <div class="cta"><a href="${url}" target="_blank" rel="sponsored nofollow ugc">최저가 확인하기</a></div>
  </div>
</div>`;
        })
        .join("\n");
    }

    const jsonLd = jsonLdForPost({
      title,
      description,
      url,
      date,
      updated,
      image: cover,
      siteName
    });

    // fill post template
    const postInner = postTpl
      .replaceAll("{{POST_TITLE}}", escapeHtml(title))
      .replaceAll("{{DATE}}", date)
      .replaceAll("{{UPDATED}}", updated)
      .replace("{{PRODUCT_CARDS}}", productCards)
      .replace("{{POST_HTML}}", bodyHtml);

    // wrap with layout
    const html = layout
      .replaceAll("{{BASE}}", baseUrl)
      .replaceAll("{{TITLE}}", escapeHtml(title))
      .replaceAll("{{DESCRIPTION}}", escapeHtml(description || excerptFrom(bodyHtml)))
      .replaceAll("{{KEYWORDS}}", escapeHtml(keywords))
      .replaceAll("{{CANONICAL}}", url)
      .replaceAll("{{OG_IMAGE}}", makeAbsoluteUrl(cover || defaultImage, baseUrl))
      .replace("{{JSON_LD}}", jsonLd + "\n" + jsonLdSite({ siteName, baseUrl }))
      .replaceAll("{{SITENAME}}", escapeHtml(siteName))
      .replaceAll("{{DISCLOSURE}}", escapeHtml(disclosure))
      .replaceAll("{{YEAR}}", year)
      .replace("{{CONTENT}}", postInner);

    await write(outPath, html);

    posts.push({
      title,
      description,
      date,
      updated,
      url,
      y,
      m,
      slug
    });
  }

  // build home index (latest 10)
  posts.sort((a, b) => (a.updated < b.updated ? 1 : -1));
  const latest = posts.slice(0, 10);
  const homeList = latest
    .map((p) => {
      return `<article><h2><a href="${p.url}">${escapeHtml(p.title)}</a></h2><p>${escapeHtml(
        p.description || ""
      )}</p><small>${p.date}</small></article>`;
    })
    .join("\n");

  const homeHtml = (await read(path.join(SRC_DIR, "layout.html")))
    .replaceAll("{{BASE}}", baseUrl)
    .replaceAll("{{TITLE}}", escapeHtml(siteName))
    .replaceAll("{{DESCRIPTION}}", escapeHtml("Latest posts"))
    .replaceAll("{{KEYWORDS}}", "")
    .replaceAll("{{CANONICAL}}", `${baseUrl}/`)
    .replaceAll("{{OG_IMAGE}}", defaultImage)
    .replace("{{JSON_LD}}", jsonLdSite({ siteName, baseUrl }))
    .replaceAll("{{SITENAME}}", escapeHtml(siteName))
    .replaceAll("{{DISCLOSURE}}", escapeHtml(disclosure))
    .replaceAll("{{YEAR}}", new Date().getFullYear().toString())
    .replace("{{CONTENT}}", homeList || "<p>글이 없습니다. 첫 글을 업로드하세요.</p>");

  await write(path.join(DOCS_DIR, "index.html"), homeHtml);

  function makeAbsoluteUrl(src, base) {
  if (!src) return base;
  if (/^https?:\/\//i.test(src)) return src;
  // "/public/og.jpg" 같은 루트 경로도 baseUrl 붙여 절대 경로화
  return `${base}${src.startsWith("/") ? "" : "/"}${src}`;
}

  // sitemap.xml (home + posts)
  const sitemapUrls = [
    `${baseUrl}/`,
    ...posts.map((p) => p.url)
  ]
    .map((loc) => `<url><loc>${loc}</loc><lastmod>${todayISO()}</lastmod></url>`)
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>`;

  await fs.writeFile(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");

  // robots.txt (optional but useful)
  const robots = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`;
  await fs.writeFile(path.join(ROOT, "robots.txt"), robots, "utf8");

  console.log("Build complete. Files written to /docs, plus sitemap.xml and robots.txt at repo root.");
}

await main().catch((e) => {
  console.error(e);
  process.exit(1);
});
