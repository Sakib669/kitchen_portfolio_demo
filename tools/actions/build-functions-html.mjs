// Build functional evidence gallery (functional/functions.html) from recorded flows.
import fs from 'node:fs/promises';
import path from 'node:path';
import { siteConfigs } from './sites.mjs';
import { KNOWN_TP } from './core.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const OUT = path.join(ROOT, 'functional', 'functions.html');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
async function readJson(p, f = null) { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return f; } }

const ORDER = ['baseline', 'cookie', 'scroll', 'keyboard', 'navDesktop', 'navMobile', 'search', 'carousel', 'accordions', 'tabsFilters', 'forms', 'modal', 'language', 'pageProbe', 'detailProbes', 'chat', 'videoLightbox', 'hoverStates', 'linksAssets', 'notFound', 'mobileUi', 'finalise'];

const data = [];
for (const site of siteConfigs) {
  const dir = path.join(ROOT, 'functional', 'actions', site.slug);
  const summary = await readJson(path.join(dir, 'summary.json'));
  if (!summary) continue;
  const flowDir = path.join(dir, 'flows');
  const files = (await fs.readdir(flowDir).catch(() => [])).filter((f) => f.endsWith('.json') && !f.endsWith('.network.json'));
  const flows = [];
  for (const f of files) {
    const rec = await readJson(path.join(flowDir, f));
    if (!rec) continue;
    flows.push({ ...rec, relShots: (rec.shots || []).map((s) => path.relative(path.dirname(OUT), s).replace(/^functional\//, '')) });
  }
  flows.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  data.push({ site, summary, flows });
}

const css = `
:root{--bg:#0c0e0f;--panel:#141719;--panel2:#191d20;--line:#2b3235;--ink:#e9e6e2;--muted:#9aa3a6;--dim:#6c767a;--gold:#c9a227;--ok:#5fbf8f;--bad:#e06b5c;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--serif:"Iowan Old Style",Palatino,Georgia,serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1400px;margin:0 auto;padding:0 28px}
header.top{padding:80px 0 42px;border-bottom:1px solid var(--line);background:radial-gradient(80% 130% at 12% -20%,#1b2426 0%,transparent 60%)}
.kicker{font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--dim)}
h1{font-family:var(--serif);font-weight:400;font-size:clamp(38px,5.6vw,68px);line-height:1.02;margin:16px 0 18px;letter-spacing:-.02em}
h1 em{font-style:italic;color:var(--gold)}
.lede{max-width:900px;color:var(--muted);font-size:16px}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.stat{border:1px solid var(--line);background:#121516;border-radius:6px;padding:10px 14px;font-family:var(--mono);font-size:11px;color:var(--muted)}
.stat b{display:block;color:var(--ink);font-size:20px;font-family:var(--serif);font-weight:400;margin-top:3px}
nav.sites{position:sticky;top:0;z-index:30;background:rgba(12,14,15,.94);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
nav.sites .wrap{display:flex;gap:6px;align-items:center;height:56px;overflow:auto}
nav.sites a{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding:7px 13px;border:1px solid transparent;border-radius:999px;white-space:nowrap}
nav.sites a:hover{color:var(--ink);border-color:var(--line)}
nav.sites a::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--d);margin-right:8px;vertical-align:1px}
section.site{padding:64px 0 24px;border-bottom:1px solid var(--line)}
.sitehead{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:28px}
.sitehead h2{font-family:var(--serif);font-weight:400;font-size:clamp(30px,4.2vw,50px);line-height:1;margin:0;letter-spacing:-.02em}
.sitehead h2 span{color:var(--accent)}
.sitehead .url{font-family:var(--mono);font-size:12px;color:var(--muted);border-bottom:1px solid var(--line)}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chip{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);border-radius:3px;padding:4px 8px;background:#121516}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:22px;margin-bottom:18px}
.panel h3{font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin:0 0 16px;font-weight:500}
.flowgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:16px}
.flow{background:var(--panel2);border:1px solid var(--line);border-radius:8px;overflow:hidden;display:flex;flex-direction:column}
.flow .fh{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}
.flow .fh .id{font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--ink)}
.flow .fh .meta{margin-left:auto;font-family:var(--mono);font-size:9.5px;color:var(--dim);white-space:nowrap}
.badge{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;border-radius:3px;padding:2px 6px}
.badge.ok{background:rgba(95,191,143,.12);color:var(--ok);border:1px solid rgba(95,191,143,.25)}
.badge.err{background:rgba(224,107,92,.12);color:var(--bad);border:1px solid rgba(224,107,92,.3)}
.flow .shots{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line)}
.flow .shots img{width:100%;height:150px;object-fit:cover;object-position:top center;display:block;background:#000}
.flow .shots.single img{grid-column:span 2;height:190px}
.flow .body{padding:12px 14px;font-size:12px;color:var(--muted);flex:1}
.flow .body ul{margin:6px 0 0;padding-left:16px}
.flow .body li{margin:2px 0}
.flow .foot{padding:8px 14px;border-top:1px solid var(--line);font-family:var(--mono);font-size:9.5px;color:var(--dim);display:flex;gap:14px;flex-wrap:wrap}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{text-align:left;padding:7px 9px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);font-weight:500}
td.k{font-family:var(--mono);font-size:10px;color:var(--muted);white-space:nowrap}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.notes{font-size:11px;color:var(--dim);font-family:var(--mono);line-height:1.7}
.notes b{color:var(--muted);font-weight:500}
details.steps{margin-top:8px}
details.steps summary{font-family:var(--mono);font-size:9.5px;color:var(--dim);cursor:pointer;letter-spacing:.06em}
details.steps pre{font-family:var(--mono);font-size:10px;color:var(--muted);background:#0e1112;border:1px solid var(--line);border-radius:4px;padding:10px;max-height:260px;overflow:auto;white-space:pre-wrap}
@media(max-width:1000px){.grid2,.grid3{grid-template-columns:1fr}.flowgrid{grid-template-columns:1fr}}
footer{padding:54px 0 90px;color:var(--dim);font-family:var(--mono);font-size:11px}
`;

function flowCard(f, accent) {
  const imgs = (f.relShots || []).slice(0, 2);
  const steps = (f.steps || []).slice(0, 6).map((s) => {
    const str = JSON.stringify(s.data);
    return `${s.name}: ${str.length > 160 ? str.slice(0, 157) + '…' : str}`;
  });
  return `<div class="flow">
  <div class="fh"><span class="id">${esc(f.id)}</span><span class="badge ${f.error ? 'err' : 'ok'}">${f.error ? 'error' : 'ok'}</span><span class="meta">${f.steps?.length || 0} steps · ${f.requests?.length || 0} req</span></div>
  ${imgs.length ? `<div class="shots ${imgs.length === 1 ? 'single' : ''}">${imgs.map((i) => `<a href="${esc(i)}" target="_blank"><img loading="lazy" src="${esc(i)}" alt="${esc(f.id)} evidence"></a>`).join('')}</div>` : ''}
  <div class="body">
    ${f.error ? `<div style="color:var(--bad)">${esc(f.error)}</div>` : ''}
    <ul>${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <details class="steps"><summary>raw steps JSON</summary><pre>${esc(JSON.stringify((f.steps || []).map((s) => ({ name: s.name, data: s.data })), null, 1).slice(0, 4000))}</pre></details>
  </div>
  <div class="foot"><span>flows/${esc(f.id)}.json</span>${f.blockedWrites?.length ? `<span>${f.blockedWrites.length} blocked write(s)</span>` : ''}</div>
</div>`;
}

function siteSection({ site, summary, flows }) {
  const accent = { 'mykitchen-bd': '#e84538', 'haecker-kuechen': '#c9a227', seaform: '#c9b195' }[site.slug] || '#c9a227';
  const cats = summary.baselineInteractiveCats || {};
  const stor = summary.storage || {};
  return `<section class="site" id="${site.slug}" style="--accent:${accent}">
  <div class="sitehead">
    <div><div class="kicker">Functional observation · ${esc(site.slug)}</div><h2><span>${esc(summary.name || site.name)}</span></h2><a class="url" href="${site.base}" target="_blank" rel="noopener">${esc(site.base)}</a></div>
    <div class="chips">
      <span class="chip">${summary.flows.length} flows</span>
      <span class="chip">${summary.totals?.requests || 0} requests</span>
      <span class="chip">${summary.forms?.length || 0} forms</span>
      <span class="chip">${summary.thirdParties?.length || 0} third parties</span>
      <span class="chip">${summary.blockedWrites?.length || 0} blocked writes</span>
    </div>
  </div>

  <div class="grid3">
    <div class="panel"><h3>Interactive inventory (home)</h3>
      <div class="notes"><b>${summary.baselineCounts?.interactives ?? '—'}</b> interactive elements · <b>${summary.baselineCounts?.links ?? '—'}</b> links · <b>${summary.baselineCounts?.buttons ?? '—'}</b> buttons · <b>${summary.baselineCounts?.forms ?? 0}</b> forms · <b>${summary.baselineCounts?.iframes ?? 0}</b> iframes · <b>${summary.baselineCounts?.videos ?? 0}</b> videos<br><br>By category: ${Object.entries(cats).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}</div>
    </div>
    <div class="panel"><h3>State &amp; storage</h3>
      <table><tr><td class="k">cookies</td><td>${esc((stor.cookies || []).slice(0, 10).map((c) => `${c.name}${c.domain ? '@' + c.domain.replace(/^\./, '') : ''}`).join(', ') || 'none')}${(stor.cookies || []).length > 10 ? ` … +${stor.cookies.length - 10} more` : ''}</td></tr>
      <tr><td class="k">localStorage</td><td>${esc(Object.keys(stor.local || {}).join(', ') || 'none')}</td></tr>
      <tr><td class="k">sessionStorage</td><td>${esc(Object.keys(stor.session || {}).join(', ') || 'none')}</td></tr></table>
    </div>
    <div class="panel"><h3>Third parties</h3>
      <div class="notes">${summary.thirdParties?.length ? summary.thirdParties.map((t) => `<b>${esc(t.provider)}</b> — ${esc(t.domain)} (${t.count})`).join('<br>') : 'none detected'}</div>
    </div>
  </div>

  <div class="panel"><h3>Forms &amp; submit contracts</h3>
    ${(summary.forms || []).length ? `<table><thead><tr><th>Form</th><th>Action</th><th>Method</th><th>Framework</th><th>Fields</th><th>Required</th><th>Consent</th></tr></thead><tbody>
      ${(summary.forms || []).map((f) => `<tr><td>${esc(f.name)}</td><td style="word-break:break-all">${esc(f.form.action)}</td><td>${esc(f.form.method)}</td><td>${esc(f.form.framework)}</td><td>${f.form.fields.length}</td><td>${f.form.fields.filter((x) => x.required).length}</td><td>${f.form.hasConsent ? 'yes' : 'no'}</td></tr>`).join('')}
    </tbody></table>` : '<div class="notes">No forms captured in a form flow.</div>'}
    <div class="notes" style="margin-top:10px">No submission was ever sent: POST/PUT/PATCH requests were aborted at the browser boundary and recorded; validation probes used native constraint APIs and synthetic submit events.</div>
  </div>

  <div class="panel"><h3>Flow evidence · ${flows.length} recorded flows</h3>
    <div class="flowgrid">${flows.map((f) => flowCard(f, accent)).join('')}</div>
  </div>

  <div class="panel"><h3>Domain inventory</h3>
    <table><thead><tr><th>Domain</th><th>Requests</th><th>Class</th></tr></thead><tbody>
    ${(summary.domains || []).slice(0, 30).map((d) => `<tr><td>${esc(d.domain)}</td><td>${d.count}</td><td>${KNOWN_TP[d.domain] ? esc(KNOWN_TP[d.domain]) : (d.domain.includes(site.slug.split('-')[0]) ? 'own' : 'unknown external')}</td></tr>`).join('')}
    </tbody></table>
    ${(summary.blockedWrites || []).length ? `<h3 style="margin-top:18px">Blocked writes (never sent)</h3><div class="notes">${summary.blockedWrites.map((w) => `${esc(w.method)} ${esc(w.url)}`).join('<br>')}</div>` : ''}
  </div>
</section>`;
}

const nav = data.map(({ site, summary }) => `<a style="--d:${{ 'mykitchen-bd': '#e84538', 'haecker-kuechen': '#c9a227', seaform: '#c9b195' }[site.slug] || '#ccc'}" href="#${site.slug}">${esc(summary.name || site.name)}</a>`).join('');

const totalFlows = data.reduce((a, d) => a + d.flows.length, 0);
const totalShots = data.reduce((a, d) => a + d.flows.reduce((x, f) => x + (f.shots || []).length, 0), 0);
const totalReq = data.reduce((a, d) => a + (d.summary.totals?.requests || 0), 0);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kitchen sites — functional evidence</title><style>${css}</style></head><body>
<header class="top"><div class="wrap">
  <div class="kicker">Functional reverse engineering · runtime observation · ${new Date().toISOString().slice(0, 10)}</div>
  <h1>Every action,<br><em>observed</em></h1>
  <p class="lede">The interaction layer of the same three kitchen sites: menus, search, sliders, accordions, forms, modals, chat, catalogue downloads, language switching, storage and third-party calls. Each flow was executed in a real Chromium session; screenshots and step logs are retained. Form writes were blocked and recorded, never sent.</p>
  <div class="stats">
    <div class="stat">Sites<b>${data.length}</b></div>
    <div class="stat">Flows<b>${totalFlows}</b></div>
    <div class="stat">Screenshots<b>${totalShots}</b></div>
    <div class="stat">Network requests<b>${totalReq}</b></div>
    <div class="stat">Blocked writes<b>${data.reduce((a, d) => a + (d.summary.blockedWrites?.length || 0), 0)}</b></div>
  </div>
</div></header>
<nav class="sites"><div class="wrap">${nav}</div></nav>
<main class="wrap">${data.map(siteSection).join('\n')}</main>
<footer><div class="wrap">Evidence root: <code>functional/actions/&lt;site&gt;/</code> — flows/*.json, shots/*.png, summary.json, facts.md. Companion: <a href="../compare.html" style="border-bottom:1px solid #333">compare.html</a> (design), <code>shared/design-patterns.md</code>. No form submission was transmitted.</div></footer>
</body></html>`;

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, html);
console.log(`wrote ${OUT} (${(html.length / 1024).toFixed(0)} KB) sites=${data.length} flows=${totalFlows} shots=${totalShots}`);
