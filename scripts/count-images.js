const fs = require('fs');
const pages = JSON.parse(fs.readFileSync('scripts/extracted/pages.json', 'utf8'));
const blocks = JSON.parse(fs.readFileSync('scripts/extracted/text-blocks.json', 'utf8'));
const ids = new Set();
const noIdGalleries = [];
for (const p of [...pages, ...blocks]) {
  const re = /\[gallery([^\]]*)\]/gi;
  let m;
  while ((m = re.exec(p.content))) {
    const attrs = m[1];
    const idm = attrs.match(/ids="([^"]+)"/i);
    if (idm) idm[1].split(',').forEach((id) => ids.add(Number(id.trim())));
    else noIdGalleries.push(p.slug || p.id);
  }
  const imgs = p.content.match(/wp-content\/uploads\/[^"'\s]+/g) || [];
  imgs.forEach((u) => ids.add('url:' + u));
}
console.log('gallery ids', [...ids].filter((x) => typeof x === 'number').length);
console.log('url refs', [...ids].filter((x) => typeof x === 'string').length);
console.log('galleries without ids', noIdGalleries);
