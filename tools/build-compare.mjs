// Build a self-contained visual comparison gallery from the extracted data.
// Usage: node tools/build-compare.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { sites } from './sites.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'compare.html');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function readJson(p) { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return null; } }
async function list(dir, filter) {
  const out = [];
  try {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      if (e.isFile() && (!filter || filter(e.name))) out.push(e.name);
    }
  } catch {}
  return out.sort();
}
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

const data = [];
for (const site of sites) {
  const siteDir = path.join(ROOT, 'sites', site.slug);
  const tokens = await readJson(path.join(siteDir, 'analysis', 'tokens.json'));
  const raw = await readJson(path.join(siteDir, 'analysis', 'raw-analysis.json'));
  if (!tokens) continue;
  // the home snapshot directory is not always called "home" (Haecker uses /en)
  let homeDir = 'home';
  const rawDirs = await fs.readdir(path.join(siteDir, 'raw')).catch(() => []);
  for (const d of rawDirs) {
    if (await exists(path.join(siteDir, 'raw', d, 'viewport-1440.png'))) {
      if (d === 'home' || d === 'en' || d === 'index') { homeDir = d; break; }
      if (!homeDir || homeDir === 'home') homeDir = d;
    }
  }
  const homeRel = `sites/${site.slug}/raw/${homeDir}`;
  const shots = {
    desktop: (await exists(path.join(siteDir, 'raw', homeDir, 'viewport-1440.png'))) ? `${homeRel}/viewport-1440.png` : null,
    mobile: (await exists(path.join(siteDir, 'raw', homeDir, 'viewport-390.png'))) ? `${homeRel}/viewport-390.png` : null,
    full: (await exists(path.join(siteDir, 'raw', homeDir, 'full-1440.jpg'))) ? `${homeRel}/full-1440.jpg` : null,
    mobileFull: (await exists(path.join(siteDir, 'raw', homeDir, 'mobile-390.jpg'))) ? `${homeRel}/mobile-390.jpg` : null,
  };
  const components = await list(path.join(siteDir, 'raw', homeDir, 'components'), (f) => f.endsWith('.jpg'));
  const sections = await list(path.join(siteDir, 'raw', homeDir, 'sections'), (f) => f.endsWith('.jpg'));
  data.push({ site, tokens, raw, shots, components, sections, homeRel });
}

const css = `
:root{--bg:#0d0f10;--panel:#141718;--panel2:#1a1e20;--line:#2a3033;--ink:#e8e6e3;--muted:#9aa3a6;--dim:#6b7477;--serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:1380px;margin:0 auto;padding:0 28px}
header.top{padding:86px 0 46px;border-bottom:1px solid var(--line);background:radial-gradient(80% 120% at 15% -20%,#1c2426 0%,transparent 60%)}
.kicker{font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--dim)}
h1{font-family:var(--serif);font-weight:400;font-size:clamp(38px,6vw,74px);line-height:1.02;margin:18px 0 20px;letter-spacing:-.02em}
h1 em{font-style:italic;color:#c9a227}
.lede{max-width:820px;color:var(--muted);font-size:17px}
.meta{display:flex;flex-wrap:wrap;gap:14px 28px;margin-top:26px;font-family:var(--mono);font-size:11px;color:var(--dim);letter-spacing:.06em}
.sitesnav{position:sticky;top:0;z-index:20;background:rgba(13,15,16,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.sitesnav .wrap{display:flex;gap:6px;align-items:center;height:58px;overflow:auto}
.sitesnav a{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;color:var(--muted);padding:8px 14px;border:1px solid transparent;border-radius:999px;white-space:nowrap}
.sitesnav a:hover{color:var(--ink);border-color:var(--line)}
.sitesnav a.dot::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--d);margin-right:9px;vertical-align:1px}
section.site{padding:74px 0 30px;border-bottom:1px solid var(--line)}
.sitehead{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:34px}
.sitehead h2{font-family:var(--serif);font-weight:400;font-size:clamp(32px,4.6vw,54px);line-height:1;margin:0;letter-spacing:-.02em}
.sitehead h2 span{color:var(--accent)}
.sitehead .url{font-family:var(--mono);font-size:12px;color:var(--muted);text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:2px}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chip{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);border-radius:3px;padding:4px 8px;background:#121516}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:24px;margin-bottom:22px}
.panel h3{font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin:0 0 20px;font-weight:500}
.shots{display:grid;grid-template-columns:1.55fr .45fr 1fr;gap:16px;align-items:start}
.shot{border:1px solid var(--line);border-radius:6px;overflow:hidden;background:#000;position:relative}
.shot img{display:block;width:100%;height:auto}
.shot .tag{position:absolute;left:8px;top:8px;font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;background:rgba(0,0,0,.68);color:#cfd6d8;padding:3px 7px;border-radius:3px;border:1px solid rgba(255,255,255,.14)}
.fullscroll{max-height:640px;overflow:auto;border:1px solid var(--line);border-radius:6px;background:#000}
.fullscroll img{display:block;width:100%;height:auto}
.palette{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:10px}
.sw{border:1px solid var(--line);border-radius:6px;overflow:hidden;background:#121516}
.sw .c{height:74px}
.sw .m{padding:8px 9px;font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.5}
.sw .m b{display:block;color:var(--ink);font-weight:500;letter-spacing:.04em}
.typerow{display:grid;grid-template-columns:112px 1fr;gap:18px;padding:12px 0;border-top:1px solid var(--line);align-items:baseline}
.typerow:first-child{border-top:0}
.typerow .spec{font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:.04em;line-height:1.6}
.typerow .sample{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.gallery figure{margin:0;border:1px solid var(--line);border-radius:6px;overflow:hidden;background:#0a0c0d}
.gallery img{display:block;width:100%;height:auto}
.gallery figcaption{font-family:var(--mono);font-size:9px;color:var(--dim);padding:6px 8px;letter-spacing:.06em;border-top:1px solid var(--line);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);font-weight:500}
td.k{color:var(--muted);font-family:var(--mono);font-size:11px;white-space:nowrap}
td.num{font-family:var(--mono);font-size:11px}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
.metric{border:1px solid var(--line);border-radius:6px;padding:13px 14px;background:#121516}
.metric .k{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.metric .v{font-size:15px;margin-top:5px}
.metric .s{font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:3px}
.flow{display:flex;flex-direction:column;gap:0}
.flow .row{display:grid;grid-template-columns:28px 1fr 90px 74px 150px;gap:12px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12px;align-items:center}
.flow .row .n{font-family:var(--mono);font-size:9px;color:var(--dim)}
.flow .row .b{font-family:var(--mono);font-size:9px;color:var(--muted)}
.flow .row .bg{width:100%;height:14px;border-radius:2px;border:1px solid rgba(255,255,255,.1)}
@media(max-width:980px){.shots{grid-template-columns:1fr}.grid2,.grid3{grid-template-columns:1fr}}
footer{padding:60px 0 100px;color:var(--dim);font-family:var(--mono);font-size:11px}
.note{font-size:12px;color:var(--dim);margin-top:10px}
.big-compare{overflow:auto}
.big-compare table{min-width:900px}
.crossaxis td:first-child{color:var(--muted);font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.12em}
`;

function renderedFamilies(tokens) {
  const byFamily = new Map();
  for (const st of tokens.typography?.scale || []) {
    const f = String(st.family || '').split(',')[0].replace(/['"]/g, '').trim();
    if (!f) continue;
    byFamily.set(f, (byFamily.get(f) || 0) + (st.count || 1));
  }
  const ranked = [...byFamily.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
  return ranked.filter((f) => f && !/^(ui-|inherit|system-ui|sans-serif|serif|monospace|helvetica|arial|-apple-system|sfmono|noto|roboto mono|var\()|fallback|font awesome|fontawesome|simple-line|eicons/i.test(f));
}

function renderCount(tokens) {
  const rendered = (tokens.color.all || []).filter((c) => c.bgArea > 0 || c.textChars > 0);
  return rendered.length;
}

function swatches(tokens) {
  const rendered = (tokens.color.all || []).filter((c) => c.bgArea > 0 || c.textChars > 0);
  const all = (rendered.length >= 6 ? rendered : tokens.color.all || []).slice(0, 18);
  return `<div class="palette">${all.map((c) => `<div class="sw"><div class="c" style="background:${c.hex}"></div><div class="m"><b>${c.hex}</b>${esc(c.name)} · bg ${Math.round(c.bgArea / 1000)}k · txt ${c.textChars}</div></div>`).join('')}</div>`;
}

function typeSpecimen(tokens) {
  const scale = (tokens.typography.scale || []).filter((s) => s.size >= 11).slice(0, 12);
  return scale.map((s) => {
    const size = Math.min(64, Math.max(13, s.size));
    return `<div class="typerow"><div class="spec">${s.size}px / ${s.weight}<br>lh ${s.lineHeight}<br>${esc(String(s.family || '').split(',')[0])}</div><div class="sample" style="font-size:${size}px;font-weight:${s.weight};line-height:1.15;${s.transform === 'uppercase' ? 'text-transform:uppercase;letter-spacing:.04em;' : ''}${s.letterSpacing && s.letterSpacing !== 'normal' ? `letter-spacing:${s.letterSpacing};` : ''}">${esc((s.samples && s.samples.find((x) => x.length > 4)) || (s.samples && s.samples[0]) || 'The quick brown fox')}</div></div>`;
  }).join('');
}

function compGallery(components, sections, rel) {
  const all = [
    ...components.map((f) => ({ f, dir: 'components' })),
    ...sections.map((f) => ({ f, dir: 'sections' })),
  ];
  if (!all.length) return '<p class="note">No component crops captured.</p>';
  return `<div class="gallery">${all.map(({ f, dir }) => `<figure><a href="${rel}/${dir}/${f}" target="_blank"><img loading="lazy" src="${rel}/${dir}/${f}" alt=""></a><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')}</div>`;
}

function metrics(tokens, raw) {
  const t = tokens;
  const m = [
    ['Container', (t.layout.containers?.[0]?.value || '—').split(' / ')[0], t.layout.containers?.[0]?.value?.split(' / ')[1] || ''],
    ['Max font', Math.max(...(t.typography.scale || []).map((s) => s.size)) + 'px', 'rendered display'],
    ['Base font', (t.typography.scale || []).filter((s) => s.size === 16).map((s) => `w${s.weight}`).join(' ') || '—', 'body'],
    ['Breakpoints', (t.breakpoints || []).filter((b) => b.value.startsWith('min')).length + ' min-width', (t.breakpoints || []).filter((b) => b.value.startsWith('min')).slice(0, 4).map((b) => b.value.split(':')[1]).join(' · ')],
    ['Section pad', ((t.spacing.sectionPaddingY || []).find((p) => p.value !== '0/0')?.value || '—') + 'px', 'most common non-zero top/bottom'],
    ['Radius', (t.radius?.[0]?.value || '—'), 'dominant'],
    ['Shadow', (t.shadow?.[0]?.value || '—').slice(0, 34), 'dominant'],
    ['Motion', (t.motion.durations?.[0]?.value || '—') + ' ' + (t.motion.easings?.[0]?.value || ''), Object.keys(t.motion.libs || {}).filter((k) => t.motion.libs[k]).join(', ') || 'CSS only'],
    ['Sections', String(raw?.pages?.[0]?.sections?.length || '—'), 'homepage bands'],
    ['Images', String(t.media.images || '—'), `${t.media.lazyPct || 0}% lazy · alt ${100 - Math.round((t.media.missingAlt / Math.max(1, t.media.images)) * 100)}%`],
    ['Contrast', String(t.a11y.contrastSummary?.failAA || 0), 'pairs below 4.5:1'],
    ['H1', String(t.a11y.h1Total || 0), `across ${raw?.pages?.length || 0} pages`],
  ];
  return `<div class="metrics">${m.map(([k, v, s]) => `<div class="metric"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div><div class="s">${esc(s)}</div></div>`).join('')}</div>`;
}

function flow(tokens, raw) {
  const sections = raw?.pages?.[0]?.sections || [];
  if (!sections.length) return '<p class="note">No section flow captured.</p>';
  return `<div class="flow">${sections.map((s, i) => {
    const bg = /^rgb/.test(s.bg) ? s.bg : 'transparent';
    return `<div class="row"><div class="n">${String(i + 1).padStart(2, '0')}</div><div>${esc((s.heading || s.type).slice(0, 78))}</div><div class="b">${s.type}</div><div class="b">${s.height}px</div><div class="bg" style="background:${esc(bg)}" title="${esc(s.bg)}"></div></div>`;
  }).join('')}</div>`;
}

function siteNav(site, accent) {
  return site;
}

function siteSection({ site, tokens, raw, shots, components, sections, homeRel }, idx) {
  const accent = tokens.color.brand?.[0]?.hex || '#c9a227';
  const fontFamilies = renderedFamilies(tokens).slice(0, 4);
  return `
<section class="site" id="${site.slug}" style="--accent:${accent}">
  <div class="sitehead">
    <div>
      <div class="kicker">Site ${String(idx + 1).padStart(2, '0')} · ${esc((raw?.pages?.[0]?.framework || []).join(' · ') || 'unknown stack')}</div>
      <h2><span>${esc(site.name)}</span></h2>
      <a class="url" href="${site.base}" target="_blank" rel="noopener">${esc(site.base)}</a>
    </div>
    <div class="chips">
      ${fontFamilies.map((f) => `<span class="chip">${esc(f)}</span>`).join('')}
      ${(tokens.breakpoints || []).filter((b) => b.value.startsWith('min')).slice(0, 4).map((b) => `<span class="chip">${esc(b.value.split(':')[1])}</span>`).join('')}
      <span class="chip">${renderCount(tokens)} colors</span>
    </div>
  </div>

  <div class="panel">
    <h3>First impression · desktop 1440 · mobile 390 · full page</h3>
    <div class="shots">
      <div class="shot">${shots.desktop ? `<img src="${shots.desktop}" alt="desktop viewport"><span class="tag">1440 viewport</span>` : ''}</div>
      <div class="shot">${shots.mobile ? `<img src="${shots.mobile}" alt="mobile viewport"><span class="tag">390</span>` : ''}</div>
      <div class="fullscroll">${shots.full ? `<a href="${shots.full}" target="_blank"><img src="${shots.full}" alt="full page"></a>` : ''}</div>
    </div>
  </div>

  <div class="grid2">
    <div class="panel">
      <h3>Palette from rendered pixels</h3>
      ${swatches(tokens)}
    </div>
    <div class="panel">
      <h3>Type scale as rendered</h3>
      ${typeSpecimen(tokens)}
    </div>
  </div>

  <div class="panel">
    <h3>System metrics</h3>
    ${metrics(tokens, raw)}
  </div>

  <div class="grid2">
    <div class="panel">
      <h3>Homepage section rhythm</h3>
      ${flow(tokens, raw)}
    </div>
    <div class="panel">
      <h3>Sample of tokens</h3>
      <table>
        <tr><td class="k">brand</td><td>${(tokens.color.brand || []).map((b) => `<span style="display:inline-block;width:12px;height:12px;background:${b.hex};border:1px solid #333;border-radius:2px;vertical-align:-2px;margin-right:5px"></span>${b.hex}`).join(' ')}</td></tr>
        <tr><td class="k">neutrals</td><td class="num">${(tokens.color.neutrals || []).map((n) => n.hex).join(' · ')}</td></tr>
        <tr><td class="k">containers</td><td class="num">${(tokens.layout.containers || []).slice(0, 4).map((c) => esc(c.value)).join('<br>')}</td></tr>
        <tr><td class="k">grid</td><td class="num">${(tokens.layout.gridCols || []).slice(0, 3).map((g) => esc(g.value)).join('<br>') || '—'}</td></tr>
        <tr><td class="k">radii</td><td class="num">${(tokens.radius || []).slice(0, 6).map((r) => esc(r.value)).join(' · ')}</td></tr>
        <tr><td class="k">shadows</td><td class="num">${(tokens.shadow || []).slice(0, 3).map((r) => esc(String(r.value).slice(0, 52))).join('<br>') || '—'}</td></tr>
        <tr><td class="k">durations</td><td class="num">${(tokens.motion.durations || []).slice(0, 5).map((d) => esc(d.value)).join(' · ')}</td></tr>
        <tr><td class="k">easings</td><td class="num">${(tokens.motion.easings || []).slice(0, 4).map((d) => esc(d.value)).join('<br>')}</td></tr>
      </table>
    </div>
  </div>

  <div class="panel">
    <h3>Component & section crops</h3>
    ${compGallery(components, sections, homeRel)}
  </div>
</section>`;
}

function crossAxis(data) {
  const rows = [
    ['Stack', (d) => (d.raw?.pages?.[0]?.framework || []).join(' · ') || '—'],
    ['Font families', (d) => renderedFamilies(d.tokens).slice(0, 2).join(' / ')],
    ['Brand', (d) => (d.tokens.color.brand || []).map((b) => b.hex).join(' ')],
    ['Display size', (d) => Math.max(...(d.tokens.typography.scale || [{ size: 0 }]).map((s) => s.size)) + 'px'],
    ['Body size', (d) => ((d.tokens.typography.scale || []).find((s) => s.size === 16) ? '16px' : '—')],
    ['Container', (d) => (d.tokens.layout.containers?.[0]?.value || '—')],
    ['Min-width breakpoints', (d) => (d.tokens.breakpoints || []).filter((b) => b.value.startsWith('min')).length],
    ['Section padding', (d) => (d.tokens.spacing.sectionPaddingY?.[0]?.value || '—') + 'px'],
    ['Dominant radius', (d) => d.tokens.radius?.[0]?.value || '—'],
    ['Motion libs', (d) => Object.keys(d.tokens.motion.libs || {}).filter((k) => d.tokens.motion.libs[k]).join(', ') || 'CSS only'],
    ['Homepage sections', (d) => d.raw?.pages?.[0]?.sections?.length ?? '—'],
    ['H1 across pages', (d) => d.tokens.a11y.h1Total],
    ['Missing alt', (d) => `${d.tokens.a11y.missingAlt} / ${d.tokens.a11y.images}`],
    ['Sticky header', (d) => (d.tokens.components.navs?.[0]?.stickyPct ?? '—') + '%'],
  ];
  return `<div class="panel big-compare"><h3>Cross-site axis</h3><table class="crossaxis"><thead><tr><th>Axis</th>${data.map((d) => `<th><span style="color:${d.tokens.color.brand?.[0]?.hex || '#ccc'}">${esc(d.site.name)}</span></th>`).join('')}</tr></thead><tbody>
  ${rows.map(([label, fn]) => `<tr><td>${esc(label)}</td>${data.map((d) => `<td>${esc(fn(d))}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>`;
}

const nav = data.map(({ site, tokens }) => `<a class="dot" style="--d:${tokens.color.brand?.[0]?.hex || '#c9a227'}" href="#${site.slug}">${esc(site.name)}</a>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kitchen websites — design reverse engineering</title>
<style>${css}</style></head>
<body>
<header class="top"><div class="wrap">
  <div class="kicker">Design reverse engineering · ${new Date().toISOString().slice(0, 10)}</div>
  <h1>Three kitchens,<br><em>three design languages</em></h1>
  <p class="lede">A rendered-DOM and CSS teardown of three kitchen brands: a Bangladeshi modular-cabinet manufacturer, a German premium kitchen group, and an Australian/German luxury kitchen house. Palettes, type scales, spacing rhythm, components and motion were extracted from computed styles at 1440 / 768 / 390, then cross-checked against the sites' own CSS custom properties.</p>
  <div class="meta">
    <span>${data.length} sites</span><span>${data.reduce((a, d) => a + (d.raw?.pages?.length || 0), 0)} pages</span>
    <span>${data.reduce((a, d) => a + (d.raw?.pages?.reduce((x, p) => x + (p.sections?.length || 0), 0) || 0), 0)} sections measured</span>
    <span>Playwright · computed styles · no downloaded brand assets</span>
  </div>
</div></header>
<nav class="sitesnav"><div class="wrap">${nav}</div></nav>
<main class="wrap">
  ${data.map(siteSection).join('\n')}
  ${crossAxis(data)}
</main>
<footer><div class="wrap">Generated from <code>tools/extract.mjs</code> → <code>tools/analyze.mjs</code> → <code>tools/build-compare.mjs</code>. Screenshots are local evidence files; fonts and imagery belong to their owners.</div></footer>
</body></html>`;

await fs.writeFile(OUT, html);
console.log(`wrote ${OUT} (${(html.length / 1024).toFixed(0)} KB), sites: ${data.length}`);
