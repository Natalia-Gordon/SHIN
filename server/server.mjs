import compression from 'compression';
import express from 'express';
import nodemailer from 'nodemailer';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(process.env.PUBLIC_DIR || path.join(ROOT, 'public'));
const PORT = Number(process.env.PORT) || 8080;

const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const CONTACT_TO = (process.env.CONTACT_TO || 'michal.zeevi@gmail.com,bental4@gmail.com,ishai_r@yahoo.com')
  .split(',')
  .map((address) => address.trim())
  .filter(Boolean);
const mailEnabled = Boolean(SMTP_USER && SMTP_PASS && CONTACT_TO.length);

const transport = mailEnabled
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const recentSends = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const times = (recentSends.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (times.length >= RATE_LIMIT) {
    recentSends.set(ip, times);
    return true;
  }
  times.push(now);
  recentSends.set(ip, times);
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of recentSends) {
    if (times.every((time) => now - time >= RATE_WINDOW_MS)) recentSends.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

function field(body, name, max) {
  const value = typeof body?.[name] === 'string' ? body[name].trim() : '';
  return value.length <= max ? value : null;
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(compression());
// One address per page for search engines: www.shin.org.il -> shin.org.il.
app.use((req, res, next) => {
  const host = req.hostname || '';
  if (host.startsWith('www.')) {
    res.redirect(301, `https://${host.slice(4)}${req.originalUrl}`);
    return;
  }
  next();
});

app.use((_req, res, next) => {
  res.set({
    'Content-Language': 'en',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  next();
});

app.get('/config.json', (_req, res) => {
  res.set('Cache-Control', 'no-cache').json({ contactFormEnabled: mailEnabled });
});

app.post('/api/contact', express.json({ limit: '20kb' }), async (req, res) => {
  if (!transport) {
    res.status(503).json({ error: 'The contact form is not available yet.' });
    return;
  }

  const name = field(req.body, 'name', 120);
  const email = field(req.body, 'email', 200);
  const message = field(req.body, 'message', 5000);
  const website = field(req.body, 'website', 200);

  if (website) {
    res.json({ ok: true });
    return;
  }
  if (!name || !email || !message || !EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: 'Please fill in your name, a valid email address and a message.' });
    return;
  }
  if (rateLimited(req.ip || 'unknown')) {
    res.status(429).json({ error: 'Too many messages. Please try again later.' });
    return;
  }

  const safeName = name.replace(/[\r\n"]+/g, ' ');
  try {
    await transport.sendMail({
      from: { name: 'SHIN website', address: SMTP_USER },
      to: CONTACT_TO,
      replyTo: { name: safeName, address: email },
      subject: 'A new message from SHIN website!',
      text: `Name: ${safeName}\nEmail: ${email}\n\n${message}\n`,
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Contact form email failed:', error?.message || error);
    res.status(502).json({ error: 'Your message could not be sent. Please try again later.' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const longCache = { maxAge: '30d', fallthrough: false };
app.use('/media', express.static(path.join(PUBLIC_DIR, 'media'), longCache));
app.use('/brand', express.static(path.join(PUBLIC_DIR, 'brand'), longCache));
app.use('/content', express.static(path.join(PUBLIC_DIR, 'content'), { maxAge: '5m', fallthrough: false }));
app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      if (/-[A-Z0-9]{8}\.(?:js|css)$/.test(filePath)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/\.(?:txt|xml)$/.test(filePath)) {
        res.set('Cache-Control', 'public, max-age=3600');
      }
    },
  }),
);

// Pages are prerendered to <path>/index.html. Routes rendered in the browser (search) and unknown
// addresses get the client-side shell; unknown addresses also get a 404 status.
const CLIENT_ROUTES = new Set(['/search']);
const shellFile = existsSync(path.join(PUBLIC_DIR, 'index.csr.html'))
  ? path.join(PUBLIC_DIR, 'index.csr.html')
  : path.join(PUBLIC_DIR, 'index.html');

app.get('/{*path}', (req, res) => {
  if (req.path.length > 1 && req.path.endsWith('/')) {
    res.redirect(301, req.path.replace(/\/+$/, '') + req.url.slice(req.path.length));
    return;
  }
  let pagePath;
  try {
    pagePath = decodeURIComponent(req.path);
  } catch {
    res.status(400).end();
    return;
  }
  const prerendered = path.join(PUBLIC_DIR, pagePath, 'index.html');
  const insidePublic = prerendered.startsWith(PUBLIC_DIR + path.sep);
  res.set('Cache-Control', 'no-cache');
  if (insidePublic && existsSync(prerendered)) {
    res.sendFile(prerendered);
    return;
  }
  res.status(CLIENT_ROUTES.has(pagePath) ? 200 : 404).sendFile(shellFile);
});

if (!existsSync(path.join(PUBLIC_DIR, 'index.html'))) {
  console.warn(`index.html not found in ${PUBLIC_DIR}`);
}

app.listen(PORT, () => {
  console.log(`SHIN site listening on port ${PORT}. Contact form email ${mailEnabled ? 'enabled' : 'disabled'}.`);
});
