// Deep-crawl one site and extract a design snapshot per page.
// Usage: node tools/extract.mjs --site seaform [--only /,/the-brand] [--force]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sites, siteBySlug } from './sites.mjs';
import { extractInPage } from './extract-in-page.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const siteSlug = opt('site');
const force = args.includes('--force');
const noShots = args.includes('--no-shots');
const only = (opt('only') || '').split(',').filter(Boolean);
const DPR = 1;

const site = siteBySlug(siteSlug);
if (!site) {
  console.error('Unknown site. Use one of:', sites.map((s) => s.slug).join(', '));
  process.exit(1);
}

const pages = only.length ? site.pages.filter((p) => only.includes(p.path)) : site.pages;
const siteDir = path.join(ROOT, 'sites', site.slug);
const rawDir = path.join(siteDir, 'raw');
await fs.mkdir(rawDir, { recursive: true });

const slugifyPath = (p) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- CSS text analysis ----------------
function scanCss(css, out) {
  // strip comments (safe enough for analysis)
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  let buf = '';
  let i = 0;
  const quote = { '"': true, "'": true };
  while (i < css.length) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      while (j < css.length) {
        if (css[j] === '\\') { j += 2; continue; }
        if (css[j] === q) break;
        j++;
      }
      buf += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      const sel = stack.pop() || '';
      const decls = buf;
      handleRule(sel, decls, out);
      buf = '';
    } else {
      buf += ch;
    }
    i++;
  }
  return out;
}

function splitDecls(decls) {
  const out = [];
  let cur = '';
  let depth = 0;
  for (const ch of decls) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const inc = (obj, key, n = 1) => { if (key) obj[key] = (obj[key] || 0) + n; };

function handleRule(sel, decls, out) {
  const s = sel.trim().slice(0, 600);
  if (!s) return;
  if (/@font-face/i.test(s)) {
    const d = {};
    for (const dec of splitDecls(decls)) {
      const idx = dec.indexOf(':');
      if (idx < 0) continue;
      const k = dec.slice(0, idx).trim().toLowerCase();
      const v = dec.slice(idx + 1).trim();
      d[k] = v;
    }
    const family = (d['font-family'] || '').replace(/['"]/g, '').trim();
    if (family) {
      out.fontFaces.push({
        family,
        weight: d['font-weight'] || '400',
        style: d['font-style'] || 'normal',
        display: d['font-display'] || '',
        src: (d['src'] || '').replace(/\s+/g, ' ').slice(0, 200),
        unicodeRange: (d['unicode-range'] || '').slice(0, 80),
      });
    }
    return;
  }
  const kf = s.match(/@(?:-\w+-)?keyframes\s+([\w-]+)/i);
  if (kf) { out.keyframes.push(kf[1]); return; }
  const media = s.match(/@media[^{]*/i);
  if (media) {
    const mt = media[0];
    for (const m of mt.matchAll(/(min|max)-width:\s*([\d.]+)(px|em|rem)/g)) {
      let v = parseFloat(m[2]);
      if (m[3] !== 'px') v = v * 16;
      out.mediaQueries.push({ kind: m[1], width: Math.round(v) });
    }
    if (/prefers-reduced-motion/i.test(mt)) out.reducedMotionRules++;
    if (/print/i.test(mt)) out.printRules++;
    return;
  }
  if (/@supports/i.test(s)) { out.supportsRules++; return; }
  if (/@layer/i.test(s)) { out.layerRules++; }

  // selector features
  if (/:focus-visible/.test(s)) out.focusVisibleSelectors++;
  else if (/:focus/.test(s)) out.focusSelectors++;
  if (/::?(before|after)/.test(s)) out.pseudoElements++;
  if (/:hover/.test(s)) out.hoverSelectors++;
  if (/prefers-color-scheme/.test(s)) out.darkModeRules++;
  if (/:is\(|:where\(|:has\(/.test(s)) out.modernSelectors++;

  const props = {};
  for (const dec of splitDecls(decls)) {
    const idx = dec.indexOf(':');
    if (idx < 0) continue;
    const k = dec.slice(0, idx).trim().toLowerCase();
    const v = dec.slice(idx + 1).trim();
    if (!k) continue;
    props[k] = v;
    if (k.startsWith('--')) {
      const entry = out.vars.find((x) => x.name === k);
      if (entry) { entry.values.push(v); entry.selectors.push(s); }
      else out.vars.push({ name: k, values: [v], selectors: [s] });
    }
    if (k === 'color' || k.endsWith('-color') || k === 'background' || k === 'border' || k === 'fill' || k === 'stroke' || k === 'box-shadow' || k === 'outline') {
      for (const m of v.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g)) inc(out.colorLiterals, m[0].toLowerCase());
    }
    if (k === 'font-family') inc(out.fontStacks, v.replace(/\s+/g, ' '));
    if (k === 'font-size') inc(out.fontSizes, v);
    if (k === 'border-radius') inc(out.radii, v);
    if (k === 'box-shadow') inc(out.shadows, v.replace(/\s+/g, ' ').slice(0, 140));
    if (k === 'transition' || k === 'transition-duration') {
      for (const m of v.matchAll(/([\d.]+m?s)\b/g)) inc(out.durations, m[1]);
      for (const m of v.matchAll(/(cubic-bezier\([^)]*\)|ease(?:-in-out|-in|-out)?|linear|steps\([^)]*\))/g)) inc(out.easings, m[1]);
    }
    if (k === 'animation-duration') inc(out.durations, v);
    if (k === 'gap') inc(out.gaps, v);
    if (k === 'letter-spacing') inc(out.letterSpacings, v);
    if (k === 'line-height') inc(out.lineHeights, v);
    if (k === 'padding' || k.startsWith('padding-')) inc(out.paddings, v);
    if (k === 'aspect-ratio') inc(out.aspectRatios, v);
    if (k === 'max-width') inc(out.maxWidths, v);
    if (k === 'backdrop-filter') inc(out.backdrops, v);
    if (k === 'filter') inc(out.filters, v);
    if (k === 'clip-path') inc(out.clipPaths, v);
    if (k === 'background-image' && v.includes('gradient')) inc(out.gradients, v.replace(/\s+/g, ' ').slice(0, 160));
    if (k === 'background-image' && v.includes('url(')) out.bgImageRefs++;
  }
  // semantic variable role hints
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('--') && /(color|bg|background|surface|text|accent|primary|brand|foreground|border)/i.test(k)) {
      inc(out.roleVars, `${k}: ${v}`.slice(0, 160));
    }
  }
  if (props['font-size'] && /clamp\(|vw|rem/.test(props['font-size'])) inc(out.fluidTypeDecls, props['font-size']);
}

function analyzeCss(css) {
  const out = {
    bytes: css.length,
    fontFaces: [], keyframes: [], mediaQueries: [], vars: [],
    colorLiterals: {}, fontStacks: {}, fontSizes: {}, radii: {}, shadows: {},
    durations: {}, easings: {}, gaps: {}, letterSpacings: {}, lineHeights: {}, paddings: {},
    aspectRatios: {}, maxWidths: {}, backdrops: {}, filters: {}, clipPaths: {}, gradients: {},
    roleVars: {}, fluidTypeDecls: {},
    focusVisibleSelectors: 0, focusSelectors: 0, pseudoElements: 0, hoverSelectors: 0,
    darkModeRules: 0, reducedMotionRules: 0, printRules: 0, supportsRules: 0, layerRules: 0,
    modernSelectors: 0, bgImageRefs: 0,
  };
  scanCss(css, out);
  // dedupe vars, pick last value
  out.vars = out.vars.map((v) => ({ name: v.name, value: v.values[v.values.length - 1], scopes: [...new Set(v.selectors)].slice(0, 6) }));
  out.keyframes = [...new Set(out.keyframes)];
  const uniqMedia = new Map();
  for (const m of out.mediaQueries) uniqMedia.set(`${m.kind}:${m.width}`, m);
  out.mediaQueries = [...uniqMedia.values()].sort((a, b) => a.width - b.width);
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));
  for (const k of ['colorLiterals', 'fontStacks', 'fontSizes', 'radii', 'shadows', 'durations', 'easings', 'gaps', 'letterSpacings', 'lineHeights', 'paddings', 'aspectRatios', 'maxWidths', 'backdrops', 'filters', 'clipPaths', 'gradients', 'roleVars', 'fluidTypeDecls']) {
    out[k] = top(out[k], 60);
  }
  out.fontFaces = out.fontFaces.slice(0, 40);
  return out;
}

async function fetchCss(hrefs, inline) {
  const parts = [inline || ''];
  const fetched = [];
  for (const href of hrefs.slice(0, 18)) {
    try {
      const res = await fetch(href, {
        headers: { 'User-Agent': UA, Accept: 'text/css,*/*;q=0.1' },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) continue;
      const txt = (await res.text()).slice(0, 4_000_000);
      parts.push(txt);
      fetched.push({ href, bytes: txt.length });
    } catch {}
  }
  return { css: parts.join('\n'), fetched };
}

// ---------------- screenshots ----------------
async function acceptCookies(page) {
  const candidates = [
    '#onetrust-accept-btn-handler',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    'button[data-testid="uc-accept-all-button"]',
    'button#cookie-accept',
    '.cm-btn-accept-all',
    '#SgCookieOptin .sg-cookie-optin-box-button button',
    '[class*="cookie"] button[class*="accept"]',
  ];
  for (const sel of candidates) {
    try {
      const el = await page.$(sel);
      if (el && (await el.isVisible())) { await el.click({ timeout: 2500 }); await page.waitForTimeout(800); return `selector:${sel}`; }
    } catch {}
  }
  for (const label of ['Accept all', 'Alle akzeptieren', 'Accept All', 'Allow all', 'Accept', 'Agree', 'Got it', 'OK']) {
    try {
      const btn = page.getByRole('button', { name: label, exact: false }).first();
      if (await btn.isVisible({ timeout: 700 })) { await btn.click({ timeout: 2000 }); await page.waitForTimeout(800); return `text:${label}`; }
    } catch {}
  }
  return null;
}

// Detect promo / newsletter / cookie overlays, record them as a design pattern,
// then clear them so the underlying page can be measured and screenshotted.
async function handleOverlays(page, outDir) {
  const overlaySelectors = ['[role="dialog"]', 'dialog', '[class*="modal"]', '[class*="popup"]', '[id*="popup"]', '[class*="lightbox"]', '[class*="newsletter"]', '[class*="overlay"]', '[class*="cookie"]'];
  const overlays = await page.evaluate((sels) => {
    const out = [];
    const seen = new Set();
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        if (seen.has(el)) continue;
        seen.add(el);
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        if (r.width < 200 || r.height < 120) continue;
        if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) continue;
        if (s.position !== 'fixed' && s.position !== 'absolute') continue;
        if (el.closest('header, nav, main, footer')) continue;
        const txt = (el.innerText || '').replace(/\s+/g, ' ').trim();
        out.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          cls: String(el.className || '').slice(0, 140),
          w: Math.round(r.width), h: Math.round(r.height),
          top: Math.round(r.top), left: Math.round(r.left),
          bg: s.backgroundColor, zIndex: s.zIndex, radius: s.borderRadius,
          text: txt.slice(0, 240),
          buttons: Array.from(el.querySelectorAll('button, a[role="button"], a[class*="btn"]')).slice(0, 6).map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean),
        });
        if (out.length >= 8) return out;
      }
    }
    return out;
  }, overlaySelectors);

  // capture the dominant overlay as a design artifact
  let shot = null;
  if (overlays.length) {
    try {
      const biggest = overlays.slice().sort((a, b) => b.w * b.h - a.w * a.h)[0];
      const handles = await page.$$('[role="dialog"], dialog, [class*="modal"], [class*="popup"], [class*="newsletter"]');
      for (const h of handles) {
        const box = await h.boundingBox();
        if (!box || Math.abs(box.width - biggest.w) > 8 || Math.abs(box.height - biggest.h) > 8) continue;
        await fs.mkdir(path.join(outDir, 'components'), { recursive: true });
        await h.screenshot({ path: path.join(outDir, 'components', 'overlay-popup.jpg'), type: 'jpeg', quality: 82, timeout: 12000 });
        shot = 'overlay-popup.jpg';
        break;
      }
    } catch {}
  }

  // dismiss
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);
  const removed = await page.evaluate((sels) => {
    const isVisible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width >= 120 && r.height >= 80 && s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.04;
    };
    let n = 0;
    const seen = new Set();
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (!isVisible(el)) continue;
        const s = getComputedStyle(el);
        if (s.position !== 'fixed' && s.position !== 'absolute') continue;
        if (el.closest('header, nav, main, footer')) continue;
        // skip things that are part of normal page flow (absolute sections)
        if (s.position === 'absolute' && el.getBoundingClientRect().width > window.innerWidth * 0.95) continue;
        el.remove();
        n++;
      }
    }
    // un-lock scrolling left behind by modals
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.documentElement.classList.remove('no-scroll', 'modal-open', 'overflow-hidden', 'lenis-stopped');
    document.body.classList.remove('no-scroll', 'modal-open', 'overflow-hidden', 'lenis-stopped');
    return n;
  }, overlaySelectors).catch(() => 0);
  await page.waitForTimeout(400);
  return { overlays, removed, shot };
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let y = 0, guard = 0;
    while (guard++ < 60) {
      const step = Math.round(window.innerHeight * 0.9);
      window.scrollTo(0, y);
      await sleep(110);
      y += step;
      if (y > document.documentElement.scrollHeight + step) break;
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await sleep(500);
    window.scrollTo(0, 0);
    await sleep(500);
  });
  // settle lazy images
  await page.evaluate(() => {
    const pending = [...document.images].filter((i) => !i.complete);
    return Promise.race([
      Promise.all(pending.map((i) => new Promise((res) => { i.onload = i.onerror = res; }))),
      new Promise((r) => setTimeout(r, 3500)),
    ]);
  }).catch(() => {});
  await page.waitForTimeout(700);
}

async function cropSections(page, dir) {
  await fs.mkdir(dir, { recursive: true });
  const handles = await page.$$('section, header, footer, article, main > div');
  const picked = [];
  const seenTops = new Set();
  for (const h of handles) {
    if (picked.length >= 8) break;
    try {
      const box = await h.boundingBox();
      const tag = await h.evaluate((e) => e.tagName.toLowerCase());
      if (!box || box.height < 140 || box.width < 700) continue;
      const top = Math.round(box.y / 50) * 50;
      if (seenTops.has(top)) continue;
      if (picked.some((p) => Math.abs(p.box.y - box.y) < 40)) continue;
      seenTops.add(top);
      const label = await h.evaluate((e) => {
        const hd = e.querySelector('h1,h2,h3');
        const t = hd ? hd.innerText : (e.id || '');
        return (t || '').replace(/\s+/g, ' ').trim().slice(0, 50);
      });
      const slug = `${String(picked.length + 1).padStart(2, '0')}-${(tag + '-' + label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || tag}`;
      await h.screenshot({ path: path.join(dir, `${slug}.jpg`), type: 'jpeg', quality: 78, timeout: 15000 });
      picked.push({ box, slug });
    } catch {}
  }
  return picked.length;
}

async function cropComponents(page, dir) {
  await fs.mkdir(dir, { recursive: true });
  const specs = [];
  const header = await page.$('header');
  if (header) specs.push({ el: header, name: 'header' });
  const candidates = [
    { sel: 'button, a[role="button"], a[class*="btn"], a[class*="button"], input[type="submit"]', name: 'button', max: 2 },
    { sel: 'article, [class*="card"], [class*="tile"]', name: 'card', max: 2 },
    { sel: 'footer', name: 'footer', max: 1 },
  ];
  for (const c of candidates) {
    try {
      const handles = await page.$$(c.sel);
      let n = 0;
      for (const h of handles) {
        if (n >= c.max) break;
        const box = await h.boundingBox();
        if (!box || box.width < 40 || box.height < 24 || box.height > 900 || box.width > 1100) continue;
        if (!(await h.isVisible())) continue;
        const txt = (await h.innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 30);
        specs.push({ el: h, name: `${c.name}-${n + 1}${txt ? '-' + txt.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20) : ''}` });
        n++;
      }
    } catch {}
  }
  let made = 0;
  for (const s of specs) {
    try {
      const clean = s.name.replace(/[^a-z0-9-]/gi, '').slice(0, 50);
      await s.el.screenshot({ path: path.join(dir, `${clean}.jpg`), type: 'jpeg', quality: 82, timeout: 12000 });
      made++;
    } catch {}
  }
  return made;
}

// ---------------- crawl ----------------
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-dev-shm-usage', '--force-color-profile=srgb', '--hide-scrollbars'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: DPR,
  userAgent: UA,
  locale: 'en-US',
  timezoneId: 'Asia/Dhaka',
  colorScheme: 'light',
  reducedMotion: 'no-preference',
});
context.setDefaultTimeout(30000);

const started = new Date().toISOString();
const report = { site: site.slug, started, pages: [] };

for (const p of pages) {
  const url = new URL(p.path, site.base).href;
  const slug = slugifyPath(p.path);
  const outDir = path.join(rawDir, slug);
  await fs.mkdir(outDir, { recursive: true });
  if (!force && (await fs.stat(path.join(outDir, 'page.json')).catch(() => null))) {
    console.log(`↷ skip ${slug} (exists)`);
    continue;
  }
  const page = await context.newPage();
  const t0 = Date.now();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
  try {
    console.log(`→ ${site.slug} ${p.path}`);
    let res;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        break;
      } catch (e) {
        if (attempt === 1) throw e;
        await page.waitForTimeout(2000);
      }
    }
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900);

    const cookie = await acceptCookies(page);
    await page.waitForTimeout(500);
    const overlayInfo = await handleOverlays(page, outDir);
    await autoScroll(page);

    // viewport back to top for measurement consistency
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const data = await page.evaluate(extractInPage, {});
    data.pageLabel = p.label;
    data.requestedUrl = url;
    data.httpStatus = res ? res.status() : null;
    data.cookieConsent = cookie;
    data.overlays = overlayInfo.overlays;
    data.overlaysRemoved = overlayInfo.removed;
    data.overlayShot = overlayInfo.shot;
    data.pageErrors = errors;

    // CSS analysis
    const { css, fetched } = await fetchCss(data.stylesheetHrefs, data.inlineStyleText);
    const cssAnalysis = analyzeCss(css);
    cssAnalysis.externalSheets = fetched;
    data.css = cssAnalysis;
    delete data.inlineStyleText;

    await fs.writeFile(path.join(outDir, 'page.json'), JSON.stringify(data, null, 2));
    await fs.writeFile(path.join(outDir, 'page.html'), await page.content());

    if (!noShots) {
      // freeze animation end-states for stable screenshots
      await page.addStyleTag({
        content: `*,*::before,*::after{animation-duration:0.001s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important}html{scroll-behavior:auto!important}`,
      });
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, 'viewport-1440.png') });
      await page.screenshot({ path: path.join(outDir, 'full-1440.jpg'), fullPage: true, type: 'jpeg', quality: 80, timeout: 60000 });
      await cropSections(page, path.join(outDir, 'sections'));
      await cropComponents(page, path.join(outDir, 'components'));

      await page.setViewportSize({ width: 768, height: 1024 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, 'viewport-768.png') });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, 'viewport-390.png') });
      if (slug === 'home') await page.screenshot({ path: path.join(outDir, 'mobile-390.jpg'), fullPage: true, type: 'jpeg', quality: 80, timeout: 60000 });
      await page.setViewportSize({ width: 1440, height: 900 });
    }

    report.pages.push({ path: p.path, label: p.label, status: data.httpStatus, ms: Date.now() - t0, title: data.title, sections: data.sections.length, elements: data.counts.elements, cssBytes: cssAnalysis.bytes });
    console.log(`  ✓ ${data.title} | ${data.counts.elements} els | ${data.sections.length} sections | ${Math.round((Date.now() - t0) / 1000)}s`);
  } catch (e) {
    console.error(`  ✗ ${p.path}: ${e.message}`);
    report.pages.push({ path: p.path, label: p.label, error: e.message });
  } finally {
    await page.close();
    await sleep(site.delay);
  }
}

await browser.close();
report.finished = new Date().toISOString();
await fs.writeFile(path.join(siteDir, 'crawl-meta.json'), JSON.stringify({ ...report, ua: UA, viewports: [1440, 768, 390] }, null, 2));
console.log(`Done ${site.slug}: ${report.pages.filter((p) => !p.error).length}/${pages.length} pages`);
