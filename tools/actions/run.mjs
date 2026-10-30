// Functional reverse-engineering runner.
// Usage: node tools/actions/run.mjs --site seaform [--flows baseline,navDesktop,...]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { siteBySlug, siteConfigs } from './sites.mjs';
import { flows, FLOW_ORDER } from './flows.mjs';
import {
  attachNetwork, guardWrites, ensureDir, sleep, summariseNetwork, collectStorage, KNOWN_TP,
} from './core.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const slug = opt('site');
const only = (opt('flows') || '').split(',').map((s) => s.trim()).filter(Boolean);
const headed = args.includes('--headed');
const site = siteBySlug(slug);
if (!site) { console.error('sites:', siteConfigs.map((s) => s.slug).join(', ')); process.exit(1); }

const dir = path.join(ROOT, 'functional', 'actions', site.slug);
await ensureDir(path.join(dir, 'shots'));
await ensureDir(path.join(dir, 'flows'));

const state = {
  startedAt: Date.now(), currentFlow: 'init', requests: [], reqSeq: 1,
  blockedWrites: [], reqIndex: new Map(),
};
const diagnostics = { consoleErrors: [], pageErrors: [], dialogs: [], popups: [], failedRequests: [] };

const browser = await chromium.launch({ headless: !headed, args: ['--disable-dev-shm-usage', '--hide-scrollbars'] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: false,
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  locale: 'en-US', timezoneId: 'Asia/Dhaka', colorScheme: 'light',
});
context.setDefaultTimeout(30000);
await guardWrites(context, state);
attachNetwork(context, state);

// capture stray popups (new tabs) and chat/consent dialogs without blocking flows
context.on('page', async (p) => {
  if (p === context.pages()[0] && diagnostics.popups.length === 0) return;
  await sleep(300);
  try { diagnostics.popups.push({ flow: state.currentFlow, url: p.url() }); } catch {}
});

const page = await context.newPage();
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') diagnostics.consoleErrors.push({ flow: state.currentFlow, type: m.type(), text: m.text().slice(0, 240) });
});
page.on('pageerror', (e) => diagnostics.pageErrors.push({ flow: state.currentFlow, text: String(e.message).slice(0, 240) }));
page.on('dialog', async (d) => {
  diagnostics.dialogs.push({ flow: state.currentFlow, type: d.type(), message: d.message().slice(0, 200) });
  await d.dismiss().catch(() => {});
});
page.on('requestfailed', (r) => {
  if (state.blockedWrites.some((w) => w.url === r.url())) return;
  diagnostics.failedRequests.push({ flow: state.currentFlow, url: r.url().slice(0, 200), error: r.failure()?.errorText || '' });
});

const ctx = {
  page, context, slug, dir, site, state,
  shots: [], rec: null, done: [],
  step(name, data = {}) { ctx.rec.steps.push({ name, at: Date.now() - state.startedAt, data }); },
  async write(name, data) { await fs.writeFile(path.join(dir, name), JSON.stringify(data, null, 2)); },
};

async function runFlow(id, fn) {
  state.currentFlow = id;
  const start = state.reqSeq;
  const t0 = Date.now();
  ctx.rec = { id, startedAt: new Date().toISOString(), steps: [] };
  ctx.shots = [];
  console.log(`\n▶ [${site.slug}] ${id}`);
  try {
    await fn(ctx);
  } catch (e) {
    ctx.rec.error = String(e.message || e).slice(0, 500);
    console.error(`  ✗ ${id}: ${ctx.rec.error}`);
    await page.screenshot({ path: path.join(dir, 'shots', `ERROR-${id}.png`) }).catch(() => {});
  }
  // always restore desktop viewport so a failing mobile flow cannot poison later flows
  await page.setViewportSize({ width: 1440, height: 900 }).catch(() => {});
  const reqs = state.requests.filter((r) => r.id >= start);
  ctx.rec.durationMs = Date.now() - t0;
  ctx.rec.finishedAt = new Date().toISOString();
  ctx.rec.requests = reqs.slice(0, 400);
  ctx.rec.network = summariseNetwork(reqs);
  ctx.rec.shots = ctx.shots.slice();
  ctx.rec.blockedWrites = state.blockedWrites.filter((w) => w.flow === id);
  await fs.writeFile(path.join(dir, 'flows', `${id}.json`), JSON.stringify(ctx.rec, null, 2));
  await fs.writeFile(path.join(dir, 'flows', `${id}.network.json`), JSON.stringify({ requests: reqs, summary: ctx.rec.network }, null, 2));
  ctx.done.push({ id, error: ctx.rec.error || null, steps: ctx.rec.steps.length, requests: reqs.length, shots: ctx.shots.length, durationMs: ctx.rec.durationMs });
  console.log(`  ${ctx.rec.error ? '✗' : '✓'} ${id} · ${ctx.rec.steps.length} steps · ${reqs.length} reqs · ${ctx.shots.length} shots · ${Math.round(ctx.rec.durationMs / 1000)}s`);
}

const list = (only.length ? FLOW_ORDER.filter((f) => only.includes(f)) : FLOW_ORDER).filter((f) => flows[f]);
for (const id of list) await runFlow(id, flows[id]);

// final environment evidence
let analytics = null;
try {
  analytics = await page.evaluate(() => ({
    dataLayer: !!window.dataLayer, gtag: typeof window.gtag, fbq: typeof window.fbq, hj: typeof window.hj,
    clarity: typeof window.clarity, matomo: typeof window.Matomo || typeof window._paq, gtm: typeof window.google_tag_manager,
    recaptcha: typeof window.grecaptcha, turnstile: typeof window.turnstile, shopify: typeof window.Shopify,
    woocommerce: !!window.woocommerce_params, elementorFrontend: !!window.elementorFrontend, jquery: typeof window.jQuery,
    swiper: typeof window.Swiper, gsap: !!window.gsap, lenis: !!window.Lenis,
    cookiesEnabled: navigator.cookieEnabled, doNotTrack: navigator.doNotTrack,
  })).catch(() => null);
} catch {}
const storage = await collectStorage(context, page).catch(() => ({ cookies: [], local: {}, session: {} }));
const network = summariseNetwork(state.requests);
const tp = network.byDomain.filter((d) => KNOWN_TP[d.domain]).map((d) => ({ provider: KNOWN_TP[d.domain], domain: d.domain, count: d.count }));
const summary = {
  site: site.slug, name: site.name, base: site.base, startedAt: new Date().toISOString(),
  flows: ctx.done, network, thirdParties: tp, analytics, storage,
  blockedWrites: state.blockedWrites, diagnostics,
};
await fs.writeFile(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));

// quick facts sheet for report writing
const baseline = await fs.readFile(path.join(dir, 'baseline.json'), 'utf8').then(JSON.parse).catch(() => null);
const md = [];
md.push(`# ${site.name} — functional observation facts`, '');
md.push(`Observed ${ctx.done.length} flows. Every action below was executed in a real browser; form writes were blocked client-side and recorded, never sent.`, '');
md.push('## Interactives (home)', '');
if (baseline?.env) {
  const e = baseline.env;
  md.push(`- URL: ${e.url}`);
  md.push(`- Header: ${JSON.stringify(e.header)}`);
  md.push(`- Counts: ${Object.entries(e.counts).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  md.push(`- Interactives by category: ${Object.entries(e.interactives.reduce((a, i) => { a[i.cat] = (a[i.cat] || 0) + 1; return a; }, {})).map(([k, v]) => `${k}:${v}`).join(', ')}`);
  md.push(`- Forms: ${e.forms.length} (${e.forms.map((f) => `${f.framework}/${f.fields.length} fields`).join(', ') || 'none'})`);
  md.push(`- Embeds: ${e.iframes.length} iframes, ${e.videos.length} videos`);
  md.push('');
  md.push('### Top interactive elements', '');
  md.push('| Cat | Element | Text | Target |');
  md.push('| --- | --- | --- | --- |');
  for (const i of e.interactives.slice(0, 45)) md.push(`| ${i.cat} | ${i.tag}${i.id ? '#' + i.id : ''} | ${(i.text || '').replace(/\|/g, '/').slice(0, 60)} | ${(i.href || '').replace(site.base, '').slice(0, 60)} |`);
  md.push('');
  md.push(`### External domains (load)`);
  md.push(baseline.network?.byDomain?.filter((d) => !d.domain.includes(site.base.replace('https://', ''))).slice(0, 25).map((d) => `${d.domain} (${d.count})`).join(', '));
}
md.push('', '## Flow outcomes', '');
md.push('| Flow | Result | Steps | Requests | Evidence |');
md.push('| --- | --- | --- | --- | --- |');
for (const d of ctx.done) md.push(`| ${d.id} | ${d.error ? 'ERROR: ' + d.error.replace(/\|/g, '/') : 'ok'} | ${d.steps} | ${d.requests} | flows/${d.id}.json |`);
md.push('', '## Third parties', '');
md.push(tp.map((t) => `- ${t.provider} — ${t.domain} (${t.count})`).join('\n') || 'none detected');
md.push('', '## Storage', '');
md.push(`- Cookies: ${storage.cookies.map((c) => c.name).join(', ') || 'none'}`);
md.push(`- localStorage: ${Object.keys(storage.local || {}).join(', ') || 'none'}`);
md.push(`- sessionStorage: ${Object.keys(storage.session || {}).join(', ') || 'none'}`);
md.push('', '## Analytics / globals', '');
md.push('```json', JSON.stringify(analytics, null, 2), '```');
md.push('', '## Blocked writes (never sent)', '');
md.push(state.blockedWrites.length ? state.blockedWrites.map((w) => `- ${w.method} ${w.url} · payload: ${(w.postData || '').slice(0, 300)}`).join('\n') : 'none');
md.push('', '## Diagnostics', '');
md.push(`- console errors/warnings: ${diagnostics.consoleErrors.length}`);
md.push(`- page errors: ${diagnostics.pageErrors.length}${diagnostics.pageErrors.slice(0, 5).map((p) => ` · ${p.text}`).join('')}`);
md.push(`- failed requests: ${diagnostics.failedRequests.length}`);
md.push(`- dialogs: ${diagnostics.dialogs.length}${diagnostics.dialogs.slice(0, 5).map((d) => ` · ${d.type}: ${d.message}`).join('')}`);
await fs.writeFile(path.join(dir, 'facts.md'), md.join('\n'));

await browser.close();
console.log(`\nDone ${site.slug}: ${ctx.done.filter((d) => !d.error).length}/${ctx.done.length} flows ok → ${dir}`);
