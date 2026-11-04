const fs = require('fs');
const xml = fs.readFileSync('documents/shin.WordPress.2026-11-03.xml', 'utf8');
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

function tag(block, name) {
  const re = new RegExp(
    '<' + name + '[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + name + '>|<' + name + '[^>]*>([^<]*)<\\/' + name + '>'
  );
  const m = block.match(re);
  return m ? (m[1] !== undefined ? m[1] : m[2]) : '';
}

const summary = {};
for (const it of items) {
  const type = tag(it, 'wp:post_type');
  const status = tag(it, 'wp:status');
  const key = type + '/' + status;
  summary[key] = (summary[key] || 0) + 1;
}
console.log('items', items.length);
console.log(JSON.stringify(summary, null, 2));
console.log('---CONTENT---');
for (const it of items) {
  const type = tag(it, 'wp:post_type');
  const status = tag(it, 'wp:status');
  if (type === 'page' || type === 'post' || type === 'nav_menu_item') {
    const title = tag(it, 'title');
    const name = tag(it, 'wp:post_name');
    const id = tag(it, 'wp:post_id');
    const parent = tag(it, 'wp:post_parent');
    const content = tag(it, 'content:encoded');
    const menuOrder = tag(it, 'wp:menu_order');
    console.log([type, status, id, 'parent=' + parent, 'order=' + menuOrder, name, title, 'len=' + content.length].join(' | '));
  }
}
