const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const XML_PATH = path.join(ROOT, 'documents', 'shin.WordPress.2026-11-03.xml');
const PUBLIC_DIR = path.join(ROOT, 'web', 'public');
const MEDIA_DIR = path.join(PUBLIC_DIR, 'media');
const BRAND_DIR = path.join(PUBLIC_DIR, 'brand');
const CONTENT_PATH = path.join(PUBLIC_DIR, 'content', 'site.json');

const xml = fs.readFileSync(XML_PATH, 'utf8');
const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

function tag(block, name) {
  const re = new RegExp(
    '<' + name + '(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + name + '>|<' +
      name + '(?:\\s[^>]*)?>([^<]*)<\\/' + name + '>'
  );
  const match = block.match(re);
  if (!match) return '';
  return match[1] !== undefined ? match[1] : match[2];
}

function allMeta(block) {
  const metas = {};
  const re = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g;
  let match;
  while ((match = re.exec(block))) {
    const key = tag(match[1], 'wp:meta_key');
    const value = tag(match[1], 'wp:meta_value');
    metas[key] = value;
  }
  return metas;
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function uploadsRelative(url) {
  const match = String(url).match(/wp-content\/uploads\/([^"'?\s]+)/i);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function localMediaName(relativePath) {
  const ext = (path.extname(relativePath).toLowerCase().match(/\.(jpe?g|png|gif|webp|mp4)$/) || ['.jpg'])[0];
  const hash = crypto.createHash('sha1').update(relativePath).digest('hex').slice(0, 16);
  return hash + ext;
}

const records = itemBlocks.map((block) => ({
  id: Number(tag(block, 'wp:post_id')),
  title: decodeHtml(tag(block, 'title')),
  slug: tag(block, 'wp:post_name'),
  type: tag(block, 'wp:post_type'),
  status: tag(block, 'wp:status'),
  parent: Number(tag(block, 'wp:post_parent') || 0),
  order: Number(tag(block, 'wp:menu_order') || 0),
  date: tag(block, 'wp:post_date'),
  content: tag(block, 'content:encoded'),
  attachmentUrl: tag(block, 'wp:attachment_url'),
  meta: allMeta(block),
}));

const attachments = new Map();
for (const record of records) {
  if (record.type !== 'attachment') continue;
  const relative = uploadsRelative(record.attachmentUrl);
  const sizes = { full: relative };
  const meta = record.meta._wp_attachment_metadata || '';
  const main = meta.match(/s:4:"file";s:\d+:"([^"]+)"/);
  const baseDir = main ? path.posix.dirname(main[1]) : path.posix.dirname(relative);
  const sizeRe = /s:\d+:"(thumbnail|medium|medium_large|large)";a:\d+:\{s:4:"file";s:\d+:"([^"]+)"/g;
  let sizeMatch;
  while ((sizeMatch = sizeRe.exec(meta))) {
    sizes[sizeMatch[1]] = path.posix.join(baseDir, sizeMatch[2]).replace(/\\/g, '/');
  }
  attachments.set(record.id, {
    id: record.id,
    parent: record.parent,
    title: record.title,
    alt: record.meta._wp_attachment_image_alt || record.title || '',
    url: record.attachmentUrl,
    sizes,
  });
}

const textBlocks = new Map(
  records
    .filter((record) => record.type === 'text-blocks' && record.status === 'publish')
    .map((record) => [String(record.id), record])
);

const pages = records.filter(
  (record) =>
    record.type === 'page' &&
    record.status === 'publish' &&
    record.slug &&
    record.slug !== 'search-results'
);
for (const page of pages) {
  if (page.slug === 'ywp-in-the-kenesst-november-2018') page.parent = 20;
}
const byId = new Map(pages.map((page) => [page.id, page]));

function pagePath(page) {
  if (page.slug === 'home') return '/';
  const parts = [];
  let current = page;
  const seen = new Set();
  while (current && current.slug !== 'home') {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    parts.unshift(current.slug);
    current = byId.get(current.parent);
  }
  return '/' + parts.join('/');
}

for (const page of pages) page.path = pagePath(page);

const pathById = new Map(pages.map((page) => [page.id, page.path]));
const pageByPath = new Map(pages.map((page) => [page.path, page]));

function childrenOf(id) {
  return pages.filter((page) => page.parent === id);
}

function attachmentRelative(id, preferred) {
  const attachment = attachments.get(Number(id));
  if (!attachment) return '';
  const order = preferred === 'full' ? ['full', 'large', 'medium'] : ['large', 'medium_large', 'medium', 'full'];
  for (const key of order) {
    if (attachment.sizes[key]) return attachment.sizes[key];
  }
  return '';
}

const needed = new Map();
function claim(relativePath) {
  if (!relativePath) return '';
  const normalized = relativePath.replace(/\\/g, '/');
  if (!needed.has(normalized)) needed.set(normalized, '/media/' + localMediaName(normalized));
  return needed.get(normalized);
}

const BRAND = {
  logo: '2015/07/SHIN-Logo.png',
  favicon: '2015/07/fav.png',
  womenParliament: '2015/07/WP.jpg',
  youngWomen: '2015/07/YWP.jpg',
  anuar: '2015/09/anuar.jpg',
  womenReborn: '2015/07/WR.jpg',
  activistit: '2020/09/Activistit-full-final.png',
};

for (const relativePath of Object.values(BRAND)) claim(relativePath);

function collectFromHtml(html) {
  const urls = html.match(/https?:\/\/[^"'\s>]+wp-content\/uploads\/[^"'\s>]+/gi) || [];
  for (const url of urls) {
    const relativePath = uploadsRelative(url);
    if (/\.(jpe?g|png|gif|webp)$/i.test(relativePath)) claim(relativePath);
  }
}

for (const page of pages) collectFromHtml(page.content);
for (const block of textBlocks.values()) collectFromHtml(block.content);

function galleryIds(attrs, page) {
  const listed = attrs.match(/ids\s*=\s*"([^"]+)"/i);
  if (listed) return listed[1].split(',').map((id) => Number(id.trim())).filter(Boolean);
  return [...attachments.values()].filter((item) => item.parent === page.id).map((item) => item.id);
}

for (const page of pages) {
  const re = /\[gallery([^\]]*)\]/gi;
  let match;
  while ((match = re.exec(page.content))) {
    const size = /size\s*=\s*"([^"]+)"/i.exec(match[1]);
    const preferred = size && size[1] === 'full' ? 'full' : 'large';
    for (const id of galleryIds(match[1], page)) claim(attachmentRelative(id, preferred));
  }
}

function rewriteUploads(html) {
  return html.replace(/https?:\/\/[^"'\s>]+wp-content\/uploads\/([^"'\s>]+)/gi, (full, relative) => {
    let decoded = relative;
    try {
      decoded = decodeURIComponent(relative.split('?')[0]);
    } catch {
      decoded = relative.split('?')[0];
    }
    return needed.get(decoded) || full.replace(/^http:\/\//i, 'https://').replace('www.shin-women-equality.org.il', 'www.shin.org.il');
  });
}

function rewriteLinks(html) {
  return html.replace(/href="([^"]+)"/gi, (full, href) => {
    const pageId = href.match(/[?&]page_id=(\d+)/);
    if (pageId && pathById.has(Number(pageId[1]))) {
      return `href="${pathById.get(Number(pageId[1]))}"`;
    }
    let url;
    try {
      url = new URL(href, 'https://www.shin.org.il');
    } catch {
      return full;
    }
    const host = url.hostname.replace(/^www\./, '');
    if (host !== 'shin.org.il' && host !== 'shin-women-equality.org.il') return full;
    if (url.pathname === '/' || url.pathname === '') return 'href="/"';
    const candidate = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
    if (pageByPath.has(candidate)) return `href="${candidate}"`;
    const slug = candidate.split('/').filter(Boolean).pop();
    const matches = pages.filter((page) => page.slug === slug);
    if (matches.length === 1) return `href="${matches[0].path}"`;
    return full;
  });
}

function basicClean(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<input\b[^>]*>/gi, '')
    .replace(/\s(?:on\w+|style|srcset|sizes|width|height|align)="[^"]*"/gi, '')
    .replace(/\s(?:on\w+|style|srcset|sizes|width|height|align)='[^']*'/gi, '');
}

function renderGallery(attrs, page) {
  const slideshow = /type\s*=\s*"slideshow"/i.test(attrs);
  const size = /size\s*=\s*"([^"]+)"/i.exec(attrs);
  const preferred = size && size[1] === 'full' ? 'full' : 'large';
  const figures = galleryIds(attrs, page)
    .map((id) => {
      const relativePath = attachmentRelative(id, preferred);
      const src = needed.get(relativePath);
      if (!src) return '';
      const attachment = attachments.get(id);
      const alt = escapeHtml((attachment && attachment.alt) || '');
      return `<figure><img src="${src}" alt="${alt}"></figure>`;
    })
    .filter(Boolean)
    .join('');
  if (!figures) return '';
  return `<div class="${slideshow ? 'gallery gallery-snap' : 'gallery'}">${figures}</div>`;
}

const sectionOrder = {
  'about-us': 1,
  'our-vision': 2,
  'board-members': 3,
  'women-parliament': 1,
  'young-women-parliament': 2,
  anuar: 3,
  'women-reborn': 4,
};

function renderChildren(attrs, page) {
  const explicitDate = /post_date/i.test(attrs);
  const descending = /DESC/i.test(attrs) || explicitDate;
  const items = childrenOf(page.id).slice();
  const ranked = items.some((item) => sectionOrder[item.slug] || item.order);
  items.sort((a, b) => {
    if (!explicitDate && ranked) {
      const ao = sectionOrder[a.slug] ?? (a.order || 100);
      const bo = sectionOrder[b.slug] ?? (b.order || 100);
      return ao - bo || a.title.localeCompare(b.title);
    }
    return a.date.localeCompare(b.date) * (descending ? -1 : 1);
  });
  if (!items.length) return '';
  return `<ul class="child-pages">${items
    .map((child) => `<li><a href="${child.path}">${escapeHtml(child.title)}</a></li>`)
    .join('')}</ul>`;
}

function transformHtml(html, page) {
  let output = html.replace(/\[siteorigin_widget class="TextBlocksWidget"\][\s\S]*?\[\/siteorigin_widget\]/g, (block) => {
    const raw = block.match(/value="([^"]*)"/);
    if (!raw) return '';
    let parsed;
    try {
      parsed = JSON.parse(decodeHtml(raw[1]));
    } catch {
      return '';
    }
    const instance = parsed.instance || {};
    const source = textBlocks.get(String(instance.id));
    const title = instance.title || (source ? source.title : '');
    const body = source ? basicClean(rewriteLinks(rewriteUploads(source.content))) : '';
    return `<article class="person"><h3>${escapeHtml(title)}</h3>${body}</article>`;
  });
  output = output.replace(/\[gallery([^\]]*)\]/gi, (_, attrs) => renderGallery(attrs, page));
  output = output.replace(/\[child-pages([^\]]*)\]/gi, (_, attrs) => renderChildren(attrs, page));
  output = output.replace(/\[video\b([^\]]*)\][\s\S]*?\[\/video\]/gi, (_, attrs) => {
    const mp4 = /mp4\s*=\s*"([^"]+)"/i.exec(attrs);
    if (!mp4) return '';
    const relativePath = uploadsRelative(mp4[1]);
    const src = claim(relativePath) || mp4[1].replace(/^http:\/\//i, 'https://');
    return `<video controls preload="metadata" src="${src}"></video>`;
  });
  output = output.replace(/\[wpforms[^\]]*\]/gi, '');
  output = output.replace(/\[\/?[a-z0-9_-]+[^\]]*\]/gi, '');
  output = basicClean(rewriteLinks(rewriteUploads(output)));
  output = output.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (full, _level, inner) => {
    if (!inner.includes('child-pages')) return full;
    return inner.replace(/<\/?span>/gi, '');
  });
  output = output.replace(/([A-Za-z0-9])<(a|strong|em)\b/g, '$1 <$2');
  output = output.replace(/\sdata-(?:style|weight|index)="[^"]*"/gi, '');
  if (!output.includes('class="child-pages"')) {
    const extra = renderChildren('sort_column="menu_order"', page);
    if (extra && page.slug !== 'home') output += extra;
  }
  return output.trim();
}

function plainText(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

const sitePages = pages
  .map((page) => {
    const html = page.slug === 'home' ? '' : transformHtml(page.content, page);
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      path: page.path,
      parentId: page.parent,
      date: page.date.replace(' ', 'T'),
      showDate: page.parent !== 0,
      html,
      text: plainText(page.slug === 'home' ? page.content : html),
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

const nav = [
  { label: 'Home', path: '/' },
  {
    label: 'About',
    path: '/about',
    children: [
      { label: 'About SHIN', path: '/about/about-us' },
      { label: 'Our vision', path: '/about/our-vision' },
      { label: 'Steering Committee', path: '/about/board-members' },
    ],
  },
  {
    label: 'Projects',
    path: '/projects',
    children: [
      { label: 'Women Parliament', path: '/projects/women-parliament' },
      { label: 'Young Women Parliament', path: '/projects/young-women-parliament' },
      { label: 'Anuar', path: '/projects/anuar' },
      { label: 'Women Reborn', path: '/projects/women-reborn' },
    ],
  },
  { label: 'Achievements & Impact', path: '/impact' },
  { label: 'Contact', path: '/contact-us' },
];

const footer = [
  {
    title: 'SHIN',
    links: [
      { label: 'Home', path: '/' },
      { label: 'About SHIN', path: '/about/about-us' },
      { label: 'Contact', path: '/contact-us' },
      { label: 'Website credits', path: '/website-credits' },
    ],
  },
  {
    title: 'Projects',
    links: [
      { label: 'Women Parliament', path: '/projects/women-parliament' },
      { label: 'Young Women Parliament', path: '/projects/young-women-parliament' },
      { label: 'Anuar', path: '/projects/anuar' },
      { label: 'Women Reborn', path: '/projects/women-reborn' },
      { label: 'Achievements & Impact', path: '/impact' },
    ],
  },
  {
    title: 'SHIN online',
    links: [
      { label: 'Women Parliament website', href: 'http://womenparliament.org/', external: true },
      { label: 'Women Parliament on Facebook', href: 'https://www.facebook.com/pages/%D7%A4%D7%A8%D7%9C%D7%9E%D7%A0%D7%98-%D7%A0%D7%A9%D7%99%D7%9D/382265370469', external: true },
      { label: 'Women Parliament on YouTube', href: 'https://www.youtube.com/channel/UCfykTpqUkS2eIrqo-2Ik1JA', external: true },
      { label: 'SHIN on Facebook', href: 'https://www.facebook.com/pages/%D7%A4%D7%A8%D7%9C%D7%9E%D7%A0%D7%98-%D7%A0%D7%A9%D7%99%D7%9D/382265370469', external: true },
    ],
  },
  {
    title: 'Worth a visit',
    links: [
      { label: "A Site of One's Own", href: 'http://femlinks.co.il/', external: true },
      { label: 'ALIA: For Children and Parents Rights', href: 'http://www.alia.co.il/', external: true },
      { label: 'The Knesset Committee on the Status of Women', href: 'http://main.knesset.gov.il/Activity/Committees/Women/Pages/default.aspx', external: true },
      { label: "The Israeli Union of Advisers on Women's Issues", href: 'https://www.facebook.com/pages/%D7%90%D7%99%D7%92%D7%95%D7%93-%D7%94%D7%99%D7%95%D7%A2%D7%A6%D7%95%D7%AA-%D7%9C%D7%A7%D7%99%D7%93%D7%95%D7%9D-%D7%9E%D7%A2%D7%9E%D7%93-%D7%94%D7%90%D7%A9%D7%94-%D7%91%D7%A8%D7%A9%D7%95%D7%99%D7%95%D7%AA-%D7%94%D7%9E%D7%A7%D7%95%D7%9E%D7%99%D7%95%D7%AA-%D7%91%D7%99%D7%A9%D7%A8%D7%90%D7%9C/378281385709654', external: true },
      { label: 'The Israeli Union of Elected Women', href: 'https://www.facebook.com/nivcharot', external: true },
      { label: 'Israel Association for Feminist and Gender Studies', href: 'http://www.gendersite.org.il', external: true },
    ],
  },
];

fs.mkdirSync(path.dirname(CONTENT_PATH), { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });
fs.mkdirSync(BRAND_DIR, { recursive: true });
fs.writeFileSync(
  CONTENT_PATH,
  JSON.stringify({ pages: sitePages, nav, footer }, null, 0)
);

function looksLikeImage(bytes) {
  if (bytes.length < 12) return false;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return true;
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return true;
  if (bytes.toString('ascii', 0, 3) === 'GIF') return true;
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return true;
  return false;
}

function looksLikeMedia(bytes, relativePath) {
  if (/\.mp4$/i.test(relativePath)) {
    return bytes.length > 1000 && bytes.subarray(0, 64).includes(Buffer.from('ftyp'));
  }
  return looksLikeImage(bytes);
}

async function downloadOne(relativePath) {
  const destination = path.join(MEDIA_DIR, path.basename(needed.get(relativePath)));
  if (fs.existsSync(destination) && looksLikeMedia(fs.readFileSync(destination).subarray(0, 64), relativePath)) return 'cached';
  const encoded = relativePath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  const urls = [
    `https://www.shin.org.il/wp-content/uploads/${encoded}`,
    `http://www.shin-women-equality.org.il/wp-content/uploads/${encoded}`,
  ];
  let lastError = 'failed';
  for (const url of urls) {
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (!response.ok) {
        lastError = String(response.status);
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!looksLikeMedia(bytes, relativePath)) {
        lastError = 'not-media';
        continue;
      }
      fs.writeFileSync(destination, bytes);
      return 'ok';
    } catch (error) {
      lastError = error.message;
    }
  }
  return lastError;
}

async function pool(items, limit, worker) {
  const queue = items.slice();
  const runners = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const entries = [...needed.keys()];
  let done = 0;
  let failed = 0;
  const failures = [];
  await pool(entries, 8, async (relativePath) => {
    const result = await downloadOne(relativePath);
    done += 1;
    if (result !== 'ok' && result !== 'cached') {
      failed += 1;
      failures.push(result + ' ' + relativePath);
    }
    if (done % 40 === 0 || done === entries.length) {
      console.log(`media ${done}/${entries.length} failed ${failed}`);
    }
  });
  const brandFiles = {
    logo: 'logo.png',
    favicon: 'favicon.png',
    womenParliament: 'women-parliament.jpg',
    youngWomen: 'young-women-parliament.jpg',
    anuar: 'anuar.jpg',
    womenReborn: 'women-reborn.jpg',
    activistit: 'activistit.png',
  };
  for (const [key, fileName] of Object.entries(brandFiles)) {
    const source = path.join(MEDIA_DIR, path.basename(needed.get(BRAND[key])));
    const target = key === 'favicon' ? path.join(PUBLIC_DIR, fileName) : path.join(BRAND_DIR, fileName);
    if (fs.existsSync(source)) fs.copyFileSync(source, target);
    else console.warn('missing brand', key);
  }
  if (failures.length) {
    fs.writeFileSync(path.join(PUBLIC_DIR, 'content', 'media-failures.txt'), failures.join('\n'));
    console.log('failures', failures.length);
  }
  console.log('pages', sitePages.length, 'media', entries.length, 'json bytes', fs.statSync(CONTENT_PATH).size);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
