const site = require('../web/public/content/site.json');
console.log('pages', site.pages.length);
const slugs = ['about', 'about-us', 'board-members', 'projects', 'women-parliament', 'contact-us', 'impact', 'women-reborn', 'young-women-parliament'];
for (const slug of slugs) {
  const page = site.pages.find((item) => item.slug === slug);
  console.log('\n====', slug, page && page.path, 'html', page && page.html.length);
  console.log((page && page.html.slice(0, 700)) || 'MISSING');
}
const leftovers = site.pages.filter((page) => /\[[a-z]/.test(page.html));
console.log('\nleftover shortcodes', leftovers.map((page) => page.slug));
const remoteImgs = site.pages.filter((page) => /shin-women-equality|wp-content/.test(page.html));
console.log('remote uploads left', remoteImgs.map((page) => page.slug));
