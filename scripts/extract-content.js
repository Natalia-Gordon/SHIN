const fs = require('fs');
const path = require('path');

const xml = fs.readFileSync('documents/shin.WordPress.2026-11-03.xml', 'utf8');
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

function tag(block, name) {
  const re = new RegExp(
    '<' + name + '(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + name + '>|<' + name + '(?:\\s[^>]*)?>([^<]*)<\\/' + name + '>'
  );
  const m = block.match(re);
  if (!m) return '';
  return m[1] !== undefined ? m[1] : m[2];
}

function allMeta(block) {
  const metas = {};
  const re = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g;
  let m;
  while ((m = re.exec(block))) {
    const key = tag(m[1], 'wp:meta_key');
    const value = tag(m[1], 'wp:meta_value');
    if (!metas[key]) metas[key] = value;
    else if (Array.isArray(metas[key])) metas[key].push(value);
    else metas[key] = [metas[key], value];
  }
  return metas;
}

const records = items.map((it) => ({
  id: Number(tag(it, 'wp:post_id')),
  title: tag(it, 'title'),
  slug: tag(it, 'wp:post_name'),
  type: tag(it, 'wp:post_type'),
  status: tag(it, 'wp:status'),
  parent: Number(tag(it, 'wp:post_parent') || 0),
  order: Number(tag(it, 'wp:menu_order') || 0),
  date: tag(it, 'wp:post_date'),
  link: tag(it, 'link'),
  content: tag(it, 'content:encoded'),
  excerpt: tag(it, 'excerpt:encoded'),
  attachmentUrl: tag(it, 'wp:attachment_url'),
  meta: allMeta(it),
}));

const byId = Object.fromEntries(records.map((r) => [r.id, r]));

const menus = records
  .filter((r) => r.type === 'nav_menu_item' && r.status === 'publish')
  .map((r) => ({
    id: r.id,
    title: r.title,
    order: r.order,
    parent: r.parent,
    objectId: r.meta._menu_item_object_id,
    object: r.meta._menu_item_object,
    type: r.meta._menu_item_type,
    url: r.meta._menu_item_url,
    menu: Array.isArray(r.meta._menu_item_menu) ? r.meta._menu_item_menu : undefined,
    classes: r.meta._menu_item_classes,
    terms: (r.meta && r.content) || '',
  }));

// menu term relationships are in category domain. Extract from item categories.
function categories(block) {
  const cats = [];
  const re = /<category domain="([^"]*)" nicename="([^"]*)"><!\[CDATA\[([\s\S]*?)\]\]><\/category>/g;
  let m;
  while ((m = re.exec(block))) {
    cats.push({ domain: m[1], nicename: m[2], name: m[3] });
  }
  return cats;
}

const menuItems = [];
items.forEach((it) => {
  const type = tag(it, 'wp:post_type');
  if (type !== 'nav_menu_item') return;
  const cats = categories(it);
  menuItems.push({
    id: Number(tag(it, 'wp:post_id')),
    title: tag(it, 'title'),
    order: Number(tag(it, 'wp:menu_order') || 0),
    menus: cats.filter((c) => c.domain === 'nav_menu').map((c) => c.nicename),
    meta: allMeta(it),
  });
});

const pages = records
  .filter((r) => (r.type === 'page' || r.type === 'post') && r.status === 'publish')
  .map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    type: r.type,
    parent: r.parent,
    order: r.order,
    date: r.date,
    link: r.link,
    excerpt: r.excerpt,
    content: r.content,
  }));

const textBlocks = records
  .filter((r) => r.type === 'text-blocks' && r.status === 'publish')
  .map((r) => ({ id: r.id, title: r.title, slug: r.slug, content: r.content }));

const outDir = path.join('scripts', 'extracted');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'pages.json'), JSON.stringify(pages, null, 2));
fs.writeFileSync(path.join(outDir, 'menus.json'), JSON.stringify(menuItems, null, 2));
fs.writeFileSync(path.join(outDir, 'text-blocks.json'), JSON.stringify(textBlocks, null, 2));

const home = pages.find((p) => p.slug === 'home');
fs.writeFileSync(path.join(outDir, 'home.html'), home ? home.content : '');
const about = pages.find((p) => p.slug === 'about-us');
fs.writeFileSync(path.join(outDir, 'about.html'), about ? about.content : '');
const contact = pages.find((p) => p.slug === 'contact-us');
fs.writeFileSync(path.join(outDir, 'contact.html'), contact ? contact.content : '');
const impact = pages.find((p) => p.slug === 'impact');
fs.writeFileSync(path.join(outDir, 'impact.html'), impact ? impact.content : '');
const vision = pages.find((p) => p.slug === 'our-vision');
fs.writeFileSync(path.join(outDir, 'vision.html'), vision ? vision.content : '');

console.log('pages', pages.length, 'menus', menuItems.length, 'blocks', textBlocks.length);
console.log('--- MENUS ---');
for (const item of menuItems) {
  const objectId = item.meta._menu_item_object_id;
  const url = item.meta._menu_item_url || '';
  const target = byId[Number(objectId)];
  console.log(
    [
      item.menus.join(','),
      'order=' + item.order,
      'parentItem=' + (item.meta._menu_item_menu_item_parent || 0),
      item.title || (target && target.title),
      'obj=' + objectId,
      target ? target.slug : '',
      url,
    ].join(' | ')
  );
}
