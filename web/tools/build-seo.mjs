// Writes sitemap.xml, robots.txt, llms.txt and llms-full.txt into public/ from the archive content.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(WEB, 'public');
const config = JSON.parse(readFileSync(join(WEB, 'src/site.config.json'), 'utf8'));
const site = JSON.parse(readFileSync(join(PUBLIC, 'content/site.json'), 'utf8'));

const SITE_URL = config.siteUrl.replace(/\/+$/, '');
const url = (path) => SITE_URL + (path === '/' ? '/' : path);
const pages = site.pages;
const byPath = new Map(pages.map((page) => [page.path, page]));

function summary(text, max = 180) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.–-]+$/, '') + '…';
}

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// sitemap.xml
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((page) => {
    const lastmod = page.date ? `<lastmod>${page.date.slice(0, 10)}</lastmod>` : '';
    return `  <url><loc>${escapeXml(url(page.path))}</loc>${lastmod}</url>`;
  }),
  '</urlset>',
  '',
].join('\n');
writeFileSync(join(PUBLIC, 'sitemap.xml'), sitemap);

// robots.txt: open to search engines and AI assistants alike.
const aiAgents = [
  'Googlebot',
  'Bingbot',
  'Google-Extended',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot',
  'Applebot-Extended',
  'CCBot',
];
const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
  '',
  ...aiAgents.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', 'Disallow: /api/', '']),
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  '',
].join('\n');
writeFileSync(join(PUBLIC, 'robots.txt'), robots);

// llms.txt (https://llmstxt.org): a short guide to the site for AI models.
const childrenOf = (path) => pages.filter((page) => page.parentId === byPath.get(path)?.id);

function bodyText(html) {
  return html
    .replace(/<h([1-6])[^>]*>[\s\S]*?<\/h\1>/gi, ' ')
    .replace(/<ul class="child-pages">[\s\S]*?<\/ul>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function describe(page) {
  const text = bodyText(page.html || '');
  if (text.length > 40) return summary(text);
  const children = childrenOf(page.path).map((child) => child.title);
  return children.length ? `Overview of ${children.join(', ')}.` : summary(page.text);
}

const link = (page) => `- [${page.title}](${url(page.path)}): ${describe(page)}`;
const listed = new Set(['/']);
const section = (title, list) => {
  const items = list.filter(Boolean);
  items.forEach((page) => listed.add(page.path));
  return items.length ? [`## ${title}`, '', ...items.map(link), ''] : [];
};

const about = section('About SHIN', [byPath.get('/about'), ...childrenOf('/about')]);
const projects = section('Projects', [byPath.get('/projects'), ...childrenOf('/projects')]);
const impact = section('Achievements and impact', [byPath.get('/impact'), ...childrenOf('/impact')]);
const contact = section('Contact', [byPath.get('/contact-us')]);
const rest = pages.filter((page) => !listed.has(page.path));

const llms = [
  `# ${config.organizationName}`,
  '',
  `> ${config.description} This is the English website of the movement, with its history, projects and an archive of events since 1999.`,
  '',
  'Key facts:',
  '',
  '- Founded in February 1989 by Prof. Esther Hertzog and a group of women and men, in protest against the exclusion of women from political and public leadership in Israel.',
  '- Projects: Women Parliament (since 1999), Anuar, a Jewish-Arab women’s leadership group (since 2002), Women Reborn (since 2008) and Young Women Parliament (since 2010).',
  '- Address: Almog 5, Michmoret, 4092700 Israel. Registered nonprofit number 580163632.',
  `- Full text of every page: ${SITE_URL}/llms-full.txt`,
  '',
  ...about,
  ...projects,
  ...impact,
  ...contact,
  '## Optional',
  '',
  ...rest.map(link),
  '',
].join('\n');
writeFileSync(join(PUBLIC, 'llms.txt'), llms);

// llms-full.txt: the plain text of every page, in site order.
const order = [...listed].filter((path) => path !== '/').concat(rest.map((page) => page.path));
const home = byPath.get('/');
const full = [
  `# ${config.organizationName}`,
  '',
  `Source: ${SITE_URL}/`,
  '',
  home?.text || config.description,
  '',
  ...order.flatMap((path) => {
    const page = byPath.get(path);
    if (!page) return [];
    const meta = [`Source: ${url(page.path)}`];
    if (page.showDate && page.date) meta.push(`Published: ${page.date.slice(0, 10)}`);
    return ['---', '', `## ${page.title}`, '', ...meta, '', page.text || '', ''];
  }),
].join('\n');
writeFileSync(join(PUBLIC, 'llms-full.txt'), full);

console.log(`SEO files written for ${pages.length} pages (${SITE_URL}).`);
