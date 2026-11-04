const fs = require('fs');
const pages = require('./extracted/pages.json');

const emails = new Set();
const shortcodes = new Map();
let imgs = new Set();
for (const p of pages) {
  const em = p.content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  em.forEach((e) => emails.add(e + ' @ ' + p.slug));
  const sc = p.content.match(/\[[a-z0-9_:-]+[^\]]*\]/gi) || [];
  sc.forEach((s) => {
    const key = s.slice(0, 60);
    shortcodes.set(key, (shortcodes.get(key) || 0) + 1);
  });
  const im = p.content.match(/https?:\/\/[^"'\s>]+\.(?:jpg|jpeg|png|gif|webp)/gi) || [];
  im.forEach((u) => imgs.add(u.split('?')[0]));
}
console.log('EMAILS', [...emails]);
console.log('IMG COUNT', imgs.size);
console.log('SHORTCODES');
for (const [k, v] of [...shortcodes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(v, k);
}

const projects = pages.find((p) => p.slug === 'projects');
console.log('---PROJECTS---');
console.log(projects.content);
const credits = pages.find((p) => p.slug === 'website-credits');
console.log('---CREDITS---');
console.log(credits.content);
const impact = pages.find((p) => p.slug === 'impact');
console.log('---IMPACT HEAD---');
console.log(impact.content.slice(0, 1500));
