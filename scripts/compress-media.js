const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const roots = [
  path.join(__dirname, '..', 'web', 'public', 'media'),
  path.join(__dirname, '..', 'web', 'public', 'brand'),
];
const favicon = path.join(__dirname, '..', 'web', 'public', 'favicon.png');

function looksLikeImage(bytes) {
  if (bytes.length < 12) return false;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return true;
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return true;
  if (bytes.toString('ascii', 0, 3) === 'GIF') return true;
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return true;
  return false;
}

async function compress(file) {
  const input = fs.readFileSync(file);
  if (!looksLikeImage(input)) return { skipped: true, before: input.length, after: input.length };
  const ext = path.extname(file).toLowerCase();
  const image = sharp(input, { failOn: 'none' }).rotate();
  let output;
  if (ext === '.jpg' || ext === '.jpeg') {
    output = await image.resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
  } else if (ext === '.png') {
    output = await image.resize({ width: 1400, withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
  } else {
    return { skipped: true, before: input.length, after: input.length };
  }
  if (output.length < input.length) fs.writeFileSync(file, output);
  else output = input;
  return { skipped: false, before: input.length, after: output.length };
}

async function main() {
  const files = roots.flatMap((root) => fs.readdirSync(root).map((name) => path.join(root, name)));
  files.push(favicon);
  let before = 0;
  let after = 0;
  let done = 0;
  const queue = files.slice();
  async function worker() {
    while (queue.length) {
      const file = queue.shift();
      const result = await compress(file);
      before += result.before;
      after += result.after;
      done += 1;
      if (done % 80 === 0 || done === files.length) {
        console.log(`${done}/${files.length} ${Math.round(after / 1024 / 1024)}MB`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`compressed ${Math.round(before / 1024 / 1024)}MB -> ${Math.round(after / 1024 / 1024)}MB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
