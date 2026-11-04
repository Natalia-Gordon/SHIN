const pages = require('./extracted/pages.json');
for (const slug of ['women-parliament', 'young-women-parliament', 'anuar', 'women-reborn', 'about']) {
  const p = pages.find((x) => x.slug === slug);
  console.log('\n========', slug, 'parent', p.parent, 'len', p.content.length);
  console.log(p.content.slice(0, 1200));
  console.log('---TAIL---');
  console.log(p.content.slice(-800));
}
