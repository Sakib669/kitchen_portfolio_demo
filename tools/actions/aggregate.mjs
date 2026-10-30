// Rebuild per-site functional summary + facts from all recorded flow evidence.
// Idempotent: safe to run after any subset of flows.
import fs from 'node:fs/promises';
import path from 'node:path';
import { siteConfigs } from './sites.mjs';
import { KNOWN_TP } from './core.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const only = process.argv.includes('--site') ? process.argv[process.argv.indexOf('--site') + 1] : null;

async function readJson(p, fallback = null) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return fallback; }
}
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

const SITE_HOSTS = {
  'mykitchen-bd': ['mykitchen-bd.com'],
  'haecker-kuechen': ['haecker-kuechen.com'],
  seaform: ['seaform.com'],
};

for (const site of siteConfigs) {
  if (only && only !== site.slug) continue;
  const dir = path.join(ROOT, 'functional', 'actions', site.slug);
  if (!(await exists(dir))) continue;
  const baseline = await readJson(path.join(dir, 'baseline.json'), null);
  const flowFiles = (await fs.readdir(path.join(dir, 'flows')).catch(() => [])).filter((f) => f.endsWith('.json') && !f.endsWith('.network.json'));
  const flows = [];
  const domainCounts = new Map();
  const blockedWrites = [];
  const flowNetwork = [];
  for (const file of flowFiles.sort()) {
    const rec = await readJson(path.join(dir, 'flows', file));
    if (!rec) continue;
    flows.push({
      id: rec.id,
      error: rec.error || null,
      steps: rec.steps?.length || 0,
      requests: rec.requests?.length || 0,
      durationMs: rec.durationMs || 0,
      shots: rec.shots || [],
      blockedWrites: rec.blockedWrites?.length || 0,
    });
    for (const w of rec.blockedWrites || []) blockedWrites.push(w);
    for (const d of rec.network?.byDomain || []) domainCounts.set(d.domain, (domainCounts.get(d.domain) || 0) + d.count);
    flowNetwork.push({ id: rec.id, network: rec.network || null, requests: rec.requests || [] });
  }
  // load-time domains from baseline
  for (const d of baseline?.network?.byDomain || []) domainCounts.set(d.domain, (domainCounts.get(d.domain) || 0) + d.count);
  const storage = (await readJson(path.join(dir, 'storage-final.json'))) || baseline?.storage || { cookies: [], local: {}, session: {} };
  const formFiles = (await fs.readdir(dir).catch(() => [])).filter((f) => f.startsWith('form-') && f.endsWith('.json'));
  const forms = [];
  for (const f of formFiles) {
    const spec = await readJson(path.join(dir, f));
    if (spec) forms.push({ name: f.replace(/^form-|\.json$/g, ''), ...spec });
  }
  const ownHosts = SITE_HOSTS[site.slug] || [];
  const isOwn = (d) => ownHosts.some((h) => d === h || d.endsWith('.' + h));
  const domains = [...domainCounts.entries()].map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count);
  const thirdParties = domains.filter((d) => !isOwn(d.domain) && KNOWN_TP[d.domain]).map((d) => ({ provider: KNOWN_TP[d.domain], domain: d.domain, count: d.count }));
  const unknownExternal = domains.filter((d) => !isOwn(d.domain) && !KNOWN_TP[d.domain]);
  const interactions = flows.reduce((a, f) => a + f.requests, 0);

  // assets/downloads captured by detailProbes + linksAssets
  const assets = [];
  const heads = [];
  const details = [];
  for (const file of flowFiles) {
    const rec = await readJson(path.join(dir, 'flows', file));
    if (!rec) continue;
    for (const st of rec.steps || []) {
      if (/downloadHeads$/.test(st.name)) heads.push(...(st.data || []));
      if (/assetLinks$/.test(st.name)) assets.push(...(st.data || []));
      if (/detail|dialog/.test(st.name) && st.data?.details) details.push({ flow: rec.id, step: st.name, ...st.data.details });
    }
  }

  const summary = {
    site: site.slug, name: site.name, base: site.base,
    generatedAt: new Date().toISOString(),
    flows,
    totals: { flows: flows.length, flowsOk: flows.filter((f) => !f.error).length, requests: interactions },
    blockedWrites,
    forms,
    storage,
    domains,
    thirdParties,
    unknownExternal,
    assets: [...new Set(assets)],
    downloadHeads: heads,
    details,
    baselineCounts: baseline?.env?.counts || null,
    baselineInteractiveCats: baseline?.env ? baseline.env.interactives.reduce((a, i) => { a[i.cat] = (a[i.cat] || 0) + 1; return a; }, {}) : null,
    baselineLinks: baseline?.env?.links || [],
  };
  await fs.writeFile(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));

  // facts sheet
  const md = [];
  md.push(`# ${site.name} — functional evidence`, '');
  md.push(`Observed ${summary.totals.flowsOk}/${summary.totals.flows} flows in a real Chromium session at 1440×900 (+390×844 for mobile probes). Form writes were blocked client-side and recorded, never sent.`);
  md.push('', '## Session totals', '');
  md.push(`- Requests captured: ${interactions}`);
  md.push(`- Cookies: ${(storage.cookies || []).map((c) => c.name).join(', ') || 'none'}`);
  md.push(`- localStorage: ${Object.keys(storage.local || {}).join(', ') || 'none'}`);
  md.push(`- sessionStorage: ${Object.keys(storage.session || {}).join(', ') || 'none'}`);
  md.push(`- Blocked writes: ${blockedWrites.length}`);
  md.push(`- Third parties: ${thirdParties.map((t) => `${t.provider} (${t.count})`).join(', ') || 'none detected'}`);
  md.push(`- Unknown external domains: ${unknownExternal.slice(0, 12).map((d) => d.domain).join(', ') || 'none'}`);
  md.push('', '## Flows', '');
  md.push('| Flow | Result | Steps | Requests | Blocked writes | Evidence |');
  md.push('| --- | --- | --- | --- | --- | --- |');
  for (const f of flows) md.push(`| ${f.id} | ${f.error ? 'ERROR: ' + f.error.replace(/\|/g, '/') : 'ok'} | ${f.steps} | ${f.requests} | ${f.blockedWrites} | flows/${f.id}.json |`);
  md.push('', '## Forms', '');
  for (const f of forms) {
    md.push(`### ${f.name}`, '');
    md.push(`- Page: ${f.page}`);
    md.push(`- Action: ${f.form.action} · method: ${f.form.method} · framework: ${f.form.framework} · file input: ${f.form.hasFile} · consent checkbox: ${f.form.hasConsent}`);
    md.push('', '| # | Field | Type | Required | Placeholder | Options |', '| --- | --- | --- | --- | --- | --- |');
    f.form.fields.forEach((x, i) => md.push(`| ${i + 1} | ${x.name || x.id} | ${x.type || x.tag} | ${x.required ? 'yes' : 'no'} | ${(x.placeholder || '').replace(/\|/g, '/')} | ${(x.options || []).length || ''} |`));
    md.push('');
  }
  md.push('## Downloads / assets', '');
  md.push(heads.length ? heads.map((h) => `- ${h.href} → ${h.status || h.error} ${h.type || ''} ${h.size || ''}`).join('\n') : '- none captured');
  md.push('', '## Blocked writes', '');
  md.push(blockedWrites.length ? blockedWrites.map((w) => `- ${w.method} ${w.url}`).join('\n') : '- none');
  md.push('', '## Domain inventory', '');
  md.push(domains.slice(0, 30).map((d) => `- ${d.domain} (${d.count})`).join('\n'));
  await fs.writeFile(path.join(dir, 'facts.md'), md.join('\n'));
  await fs.writeFile(path.join(dir, 'flows-index.json'), JSON.stringify(flows, null, 2));

  console.log(`${site.slug}: ${flows.length} flows, ${interactions} interaction requests, ${forms.length} forms, ${thirdParties.length} third parties, ${blockedWrites.length} blocked writes`);
}
