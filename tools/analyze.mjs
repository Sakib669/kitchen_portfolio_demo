// Aggregate raw page snapshots into design tokens, component specs and a facts sheet.
// Usage: node tools/analyze.mjs [--site slug]
import fs from 'node:fs/promises';
import path from 'node:path';
import { sites } from './sites.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const onlySite = args.includes('--site') ? args[args.indexOf('--site') + 1] : null;

// ---------------- color helpers ----------------
const parseColor = (str) => {
  if (!str) return null;
  const s = String(str).trim().toLowerCase();
  if (s === 'transparent') return null;
  let m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (m) return `#${[m[1], m[2], m[3]].map((n) => Math.round(parseFloat(n)).toString(16).padStart(2, '0')).join('')}`;
  m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
    else h = h.slice(0, 6);
    if (h.length === 6) return '#' + h;
  }
  return null;
};

const hexToRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const rgbToHsl = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};
const colorName = (hex) => {
  const { h, s, l } = rgbToHsl(hex);
  if (l >= 98) return 'white';
  if (l <= 4) return 'black';
  if (s <= 18) return l < 8 ? 'black' : l < 25 ? 'ink' : l < 55 ? 'slate' : l < 86 ? 'grey' : l < 98 ? 'mist' : 'white';
  const hue = h < 15 || h >= 345 ? 'red' : h < 45 ? 'orange' : h < 68 ? 'amber' : h < 90 ? 'lime' : h < 155 ? 'green' : h < 190 ? 'teal' : h < 215 ? 'cyan' : h < 255 ? 'blue' : h < 290 ? 'violet' : h < 330 ? 'magenta' : 'rose';
  return `${hue}${l < 25 ? '-dark' : l > 82 ? '-light' : ''}`;
};
const lum = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const l1 = lum(a), l2 = lum(b);
  return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
};

const pxv = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
};
const inc = (map, key, n = 1) => { if (key === null || key === undefined || key === '') return; map.set(key, (map.get(key) || 0) + n); };
const topEntries = (map, n = 30) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));

async function listPageDirs(siteDir) {
  const raw = path.join(siteDir, 'raw');
  const entries = await fs.readdir(raw, { withFileTypes: true }).catch(() => []);
  const pages = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const f = path.join(raw, e.name, 'page.json');
    try {
      const data = JSON.parse(await fs.readFile(f, 'utf8'));
      pages.push({ dir: e.name, ...data });
    } catch {}
  }
  pages.sort((a, b) => (a.requestedUrl || '').localeCompare(b.requestedUrl || ''));
  return pages;
}

function mergeColors(pages) {
  const map = new Map();
  const touch = (hex) => {
    if (!hex) return null;
    let e = map.get(hex);
    if (!e) { e = { hex, rgb: hexToRgb(hex), hsl: rgbToHsl(hex), bgArea: 0, textChars: 0, borderWeight: 0, cssDecls: 0, pages: new Set(), samples: [], tags: {} }; map.set(hex, e); }
    return e;
  };
  for (const p of pages) {
    for (const c of p.colors?.bg || []) {
      const e = touch(c.key); if (!e) continue;
      e.bgArea += c.weight || 0; e.pages.add(p.pageLabel || p.dir);
      for (const [t, n] of Object.entries(c.tags || {})) e.tags[t] = (e.tags[t] || 0) + n;
      if (c.samples?.length && e.samples.length < 3) e.samples.push(...c.samples.slice(0, 2));
    }
    for (const c of p.colors?.text || []) {
      const e = touch(c.key); if (!e) continue;
      e.textChars += c.weight || 0; e.pages.add(p.pageLabel || p.dir);
      if (c.samples?.length && e.samples.length < 3) e.samples.push(...c.samples.slice(0, 1));
    }
    for (const c of p.colors?.border || []) { const e = touch(c.key); if (e) e.borderWeight += c.weight || 0; }
    for (const c of p.css?.colorLiterals || []) {
      const hex = parseColor(c.value) || (String(c.value).startsWith('hsl') ? null : null);
      if (!hex) continue;
      const e = touch(hex); if (e) e.cssDecls += c.count || 1;
    }
  }
  return map;
}

function paletteReport(map, minImportance = 12000) {
  const list = [...map.values()].map((e) => {
    const imp = e.bgArea + e.textChars * 60 + e.cssDecls * 9000;
    return {
      hex: e.hex, rgb: e.rgb, hsl: e.hsl, name: colorName(e.hex),
      bgArea: Math.round(e.bgArea), textChars: e.textChars, cssDecls: e.cssDecls,
      pagesCount: e.pages.size, pages: [...e.pages].slice(0, 8), samples: [...new Set(e.samples)].slice(0, 3),
      tags: Object.entries(e.tags).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k),
      importance: Math.round(imp),
    };
  }).filter((e) => e.importance >= minImportance).sort((a, b) => b.importance - a.importance);
  return list;
}

function assignRoles(palette, roleVars = []) {
  // A color is only a *used* brand color when it is actually painted on the page,
  // or named as brand/primary and rendered somewhere. Defined-but-unused tokens are
  // reported separately so the palette reads as the design, not the token file.
  const defined = [];
  const seen = new Set();
  for (const v of roleVars) {
    if (!/brand|accent|primary|secondary/i.test(v.var)) continue;
    const hex = parseColor(v.value);
    if (!hex) continue;
    const key = v.var + hex;
    if (seen.has(key)) continue;
    seen.add(key);
    const painted = palette.find((c) => c.hex === hex);
    defined.push({ var: v.var, hex, name: colorName(hex), used: !!(painted && (painted.bgArea > 2000 || painted.textChars > 20)), painter: painted ? { bgArea: painted.bgArea, textChars: painted.textChars } : null });
  }
  // brand = painted at scale, or used as a recurring text accent.
  // small fixed UI (chat FABs, social icons) is routed to "utility" instead.
  const rendered = (c) => (c.bgArea > 40000 && (c.cssDecls > 0 || c.textChars > 0)) || c.textChars > 100;
  const isNeutral = (c) => c.hsl.s <= 12 || c.hsl.l <= 10 || c.hsl.l >= 96;
  const sat = palette.filter((c) => !isNeutral(c) && c.hsl.s >= 18 && c.hsl.l >= 8 && c.hsl.l <= 92 && rendered(c));
  const brand = [];
  const ordered = [...sat].sort((a, b) => b.importance - a.importance);
  for (const c of ordered) {
    if (brand.some((b) => Math.abs(b.hsl.h - c.hsl.h) < 22 && Math.abs(b.hsl.l - c.hsl.l) < 18)) continue;
    brand.push(c);
    if (brand.length >= 4) break;
  }
  const neutralCands = palette.filter((c) => isNeutral(c) && (c.bgArea + c.textChars > 0)).sort((a, b) => a.hsl.l - b.hsl.l);
  const neutrals = [];
  for (const c of neutralCands) {
    const prev = neutrals[neutrals.length - 1];
    const essential = c.hex === '#ffffff' || c.hex === '#000000';
    if (prev && Math.abs(prev.hsl.l - c.hsl.l) < 6 && !essential) continue; // collapse near-identical steps
    neutrals.push(c);
  }
  neutrals.splice(14);
  const utility = palette.filter((c) => !rendered(c) && c.cssDecls > 0).slice(0, 14);
  return { brand, neutrals, tinted: [], utility, defined };
}

function typographyReport(pages) {
  const scale = new Map();
  const families = new Map();
  const faces = new Map();
  const display = new Map();
  for (const p of pages) {
    for (const t of p.textStyles || []) {
      const key = `${t.size}|${t.weight}|${t.family}|${t.transform}|${t.ls}`;
      let e = scale.get(key);
      if (!e) {
        e = { size: t.size, weight: t.weight, family: t.family, lineHeight: t.lh, letterSpacing: t.ls, transform: t.transform, color: t.color, count: 0, tags: {}, samples: [] };
        scale.set(key, e);
      }
      e.count += t.count || 1;
      for (const [tag, n] of Object.entries(t.tags || {})) e.tags[tag] = (e.tags[tag] || 0) + n;
      if (t.sample && e.samples.length < 4 && t.sample.length > 1) e.samples.push(t.sample);
    }
    for (const d of p.displayHeads || []) {
      const key = `${d.size}|${d.weight}|${d.family}`;
      let e = display.get(key);
      if (!e) { e = { size: d.size, weight: d.weight, family: d.family, lineHeight: d.lh, letterSpacing: d.ls, transform: d.transform, count: 0, samples: [] }; display.set(key, e); }
      e.count++;
      if (d.text && e.samples.length < 4) e.samples.push(d.text.slice(0, 90));
    }
    for (const f of p.css?.fontStacks || []) inc(families, f.value, f.count);
    for (const ff of p.css?.fontFaces || []) {
      const key = `${ff.family}|${ff.weight}|${ff.style}`;
      if (!faces.has(key)) faces.set(key, { family: ff.family, weight: ff.weight, style: ff.style, display: ff.display, src: ff.src });
    }
    for (const f of p.fonts || []) inc(families, f.family, 1);
  }
  const fluid = new Map();
  for (const p of pages) for (const f of p.css?.fluidTypeDecls || []) inc(fluid, f.value, f.count);
  const scaleArr = [...scale.values()];
  for (const d of display.values()) {
    if (!scaleArr.some((s) => Math.abs(s.size - d.size) < 0.6 && String(s.weight) === String(d.weight))) {
      scaleArr.push({ ...d, tags: { display: d.count }, lineHeight: d.lineHeight, letterSpacing: d.letterSpacing });
    }
  }
  const weights = new Map();
  for (const s of scaleArr) inc(weights, String(s.weight), s.count);
  const renderedByFamily = new Map();
  for (const st of scaleArr) {
    const first = String(st.family || '').split(',')[0].replace(/['"]/g, '').trim();
    if (first) inc(renderedByFamily, first, (st.count || 1) * Math.pow(Math.max(0.75, (st.size || 16) / 16), 2));
  }
  return {
    families: topEntries(families, 14),
    renderedFamilies: topEntries(renderedByFamily, 10),
    fontFaces: [...faces.values()].slice(0, 30),
    scale: scaleArr.sort((a, b) => b.size - a.size || b.count - a.count).slice(0, 46),
    display: [...display.values()].sort((a, b) => b.size - a.size).slice(0, 14),
    weights: topEntries(weights, 8),
    fluid: topEntries(fluid, 10),
  };
}

function spacingReport(pages) {
  const sectionPadY = new Map(), sectionPadX = new Map(), cssPads = new Map(), gaps = new Map(), letterSpacing = new Map();
  const sectionHeights = new Map();
  for (const p of pages) {
    for (const s of p.sections || []) {
      if (s.type === 'header') continue;
      const [pt, pb] = String(s.padding || '').split(' ').map(pxv);
      if (pt !== null) inc(sectionPadY, `${pt}/${pb ?? pt}`);
      const [pl, pr] = String(s.paddingX || '').split(' ').map(pxv);
      if (pl !== null && (pl || pr)) inc(sectionPadX, `${pl}/${pr ?? pl}`);
      if (s.type === 'section' && s.height > 200) inc(sectionHeights, Math.round(s.height / 50) * 50);
    }
    for (const q of p.css?.paddings || []) { if (q.value !== '0' && q.value !== '0px' && q.value !== '0 0') inc(cssPads, q.value, q.count); }
    for (const g of p.css?.gaps || []) { if (g.value !== '0' && g.value !== '0px') inc(gaps, g.value, g.count); }
    for (const l of p.css?.letterSpacings || []) inc(letterSpacing, l.value, l.count);
  }
  return { sectionPadY: topEntries(sectionPadY, 20), sectionPadX: topEntries(sectionPadX, 12), cssPaddings: topEntries(cssPads, 24), gaps: topEntries(gaps, 16), sectionHeights: topEntries(sectionHeights, 16), letterSpacing: topEntries(letterSpacing, 12) };
}

function radiusShadowReport(pages) {
  const radii = new Map(), shadows = new Map(), borders = new Map(), durations = new Map(), easings = new Map(), transitions = new Map();
  const keyframes = new Map(), libs = {}, dataAttrs = {}; const scrollHints = new Map();
  for (const p of pages) {
    for (const r of p.css?.radii || []) inc(radii, r.value, r.count);
    for (const s of p.css?.shadows || []) inc(shadows, s.value, s.count);
    for (const d of p.css?.durations || []) inc(durations, d.value, d.count);
    for (const e of p.css?.easings || []) inc(easings, e.value, e.count);
    for (const t of p.css?.gradients || []) inc(transitions, t.value, t.count);
    for (const k of p.css?.keyframes || []) inc(keyframes, k);
    for (const [k, v] of Object.entries(p.motion?.libs || {})) if (v) libs[k] = (libs[k] || 0) + 1;
    for (const [k, v] of Object.entries(p.motion?.dataAttrs || {})) dataAttrs[k] = (dataAttrs[k] || 0) + v;
    for (const t of p.motion?.transitions || []) inc(scrollHints, `${t.duration} ${t.timing}`, t.count);
    for (const b of p.components?.badges || []) inc(borders, `${b.size}px/${b.weight}/${b.letterSpacing}/${b.transform}`);
    for (const c of p.components?.cards || []) inc(shadows, c.shadow);
  }
  return { radii: topEntries(radii, 20), shadows: topEntries(shadows, 12), durations: topEntries(durations, 12), easings: topEntries(easings, 12), keyframes: topEntries(keyframes, 20), libs, dataAttrs, componentTransitions: topEntries(scrollHints, 12), badgeSpecs: topEntries(borders, 10), gradients: topEntries(transitions, 10) };
}

function breakpointReport(pages) {
  const map = new Map();
  for (const p of pages) {
    for (const m of p.css?.mediaQueries || []) {
      if (m.width < 320 || m.width > 2200) continue;
      const k = `${m.kind}-width:${m.width}`;
      inc(map, k);
    }
  }
  return topEntries(map, 20);
}

function layoutReport(pages) {
  const containers = new Map(), gridCols = new Map(), maxWidths = new Map(), align = new Map(), counts = { flex: 0, grid: 0, block: 0 }, sheets = new Map();
  for (const p of pages) {
    for (const c of p.containers || []) inc(containers, `${c.maxWidth}px / pad ${c.padX ?? '?'}px`, c.count);
    for (const [k, v] of Object.entries(p.layout?.gridCols || {})) inc(gridCols, k, v);
    for (const [k, v] of Object.entries(p.layout?.textAlign || {})) inc(align, k, v);
    for (const m of p.css?.maxWidths || []) inc(maxWidths, m.value, m.count);
    counts.flex += p.layout?.flex || 0; counts.grid += p.layout?.grid || 0; counts.block += p.layout?.block || 0;
    for (const f of p.css?.externalSheets || []) inc(sheets, f.href);
  }
  return { containers: topEntries(containers, 12), gridCols: topEntries(gridCols, 10), maxWidths: topEntries(maxWidths, 12), align: topEntries(align, 6), counts, stylesheets: topEntries(sheets, 6) };
}

function componentReport(pages) {
  const buttons = new Map(), cards = new Map(), navs = new Map(), badges = new Map(), links = new Map(), inputs = new Map();
  for (const p of pages) {
    const navLabels = new Set((p.ia?.nav || []).map((x) => String(x).trim().toLowerCase()));
    for (const b of p.components?.buttons || []) {
      const sampleLc = (b.samples?.[0] || b.text || '').trim().toLowerCase();
      const isNavItem = navLabels.has(sampleLc) && (b.rect?.top || 0) < 220;
      if (isNavItem) continue;
      const key = `${b.variant}|${b.shape}|${b.size}px|${b.weight}|${b.radius}|${b.bg}|${b.color}|${b.padding}|${b.border}`;
      const e = buttons.get(key) || { variant: b.variant, shape: b.shape, size: b.size, weight: b.weight, family: b.family, radius: b.radius, bg: b.bg, color: b.color, border: b.border, padding: b.padding, shadow: b.shadow, transform: b.transform, count: 0, samples: [], pages: new Set() };
      e.count += b.count || 1; e.pages.add(p.pageLabel);
      for (const s of b.samples || []) if (e.samples.length < 4 && !e.samples.includes(s)) e.samples.push(s);
      buttons.set(key, e);
    }
    for (const c of p.components?.cards || []) {
      const key = `${c.bg}|${c.radius}|${c.shadow}|${c.padding}`;
      const e = cards.get(key) || { bg: c.bg, radius: c.radius, shadow: c.shadow, border: c.border, padding: c.padding, width: c.width, hasImg: c.hasImg, count: 0, sample: c.text, pages: new Set() };
      e.count += c.count || 1; e.pages.add(p.pageLabel); cards.set(key, e);
    }
    for (const n of p.components?.navs || []) {
      const e = navs.get(n.tag) || { tag: n.tag, heights: new Map(), bgs: new Map(), positions: new Map(), sticky: 0, count: 0, links: [], features: {} };
      e.count++; e.heights.set(n.height, (e.heights.get(n.height) || 0) + 1);
      e.bgs.set(n.bg, (e.bgs.get(n.bg) || 0) + 1);
      e.positions.set(n.position, (e.positions.get(n.position) || 0) + 1);
      if (n.position === 'sticky' || n.position === 'fixed') e.sticky++;
      e.features = { hasLogo: n.hasLogo, hasSearch: n.hasSearch, hasLanguage: n.hasLanguage, hamburger: n.hamburger };
      if (!e.links.length) e.links = n.links_sample || [];
      navs.set(n.tag, e);
    }
    for (const b of p.components?.badges || []) {
      const key = `${b.size}px|${b.weight}|${b.letterSpacing}|${b.transform}|${b.color}`;
      const e = badges.get(key) || { size: b.size, weight: b.weight, letterSpacing: b.letterSpacing, transform: b.transform, color: b.color, family: b.family, count: 0, samples: [] };
      e.count += b.count; for (const s of b.samples || []) if (e.samples.length < 5) e.samples.push(s);
      badges.set(key, e);
    }
    for (const l of p.components?.links || []) {
      const key = `${l.color}|${l.decoration}|${l.weight}|${l.size}`;
      const e = links.get(key) || { color: l.color, decoration: l.decoration, weight: l.weight, size: l.size, transform: l.transform, count: 0, samples: [] };
      e.count += l.count; for (const s of l.samples || []) if (e.samples.length < 3) e.samples.push(s);
      links.set(key, e);
    }
    for (const i of p.components?.inputs || []) {
      const key = `${i.bg}|${i.border}|${i.radius}|${i.size}`;
      const e = inputs.get(key) || { bg: i.bg, border: i.border, radius: i.radius, size: i.size, padding: i.padding, count: 0 };
      e.count++; inputs.set(key, e);
    }
  }
  const navOut = [...navs.values()].map((n) => ({
    tag: n.tag, count: n.count, stickyPct: Math.round((n.sticky / n.count) * 100),
    heights: topEntries(n.heights, 4), bgs: topEntries(n.bgs, 4), positions: topEntries(n.positions, 4),
    links: n.links.slice(0, 25), features: n.features,
  }));
  return {
    buttons: [...buttons.values()].sort((a, b) => b.count - a.count).slice(0, 14).map((b) => ({ ...b, pages: [...b.pages].slice(0, 5) })),
    cards: [...cards.values()].sort((a, b) => b.count - a.count).slice(0, 10).map((c) => ({ ...c, pages: [...c.pages].slice(0, 5) })),
    navs: navOut,
    badges: [...badges.values()].sort((a, b) => b.count - a.count).slice(0, 10),
    links: [...links.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    inputs: [...inputs.values()].sort((a, b) => b.count - a.count).slice(0, 5),
  };
}

function a11yReport(pages) {
  const pairs = new Map();
  let images = 0, missingAlt = 0, emptyLinks = 0, emptyButtons = 0, h1Total = 0, focusVisible = 0, reducedMotion = 0, mainCount = 0, skip = 0, aria = 0, tabbable = 0;
  const h1PerPage = [];
  for (const p of pages) {
    const c = p.a11y || {};
    for (const s of c.contrast || []) {
      const key = `${s.fg}|${s.bg}`;
      const e = pairs.get(key) || { fg: s.fg, bg: s.bg, ratio: s.ratio, count: 0, sizes: new Set(), samples: [], tags: new Set() };
      e.count++; e.ratio = Math.min(e.ratio, s.ratio); e.sizes.add(s.size); if (e.samples.length < 3) e.samples.push(s.text); e.tags.add(s.tag);
      pairs.set(key, e);
    }
    images += c.images || 0; missingAlt += c.altMissing || 0;
    emptyLinks += c.emptyLinks || 0; emptyButtons += c.emptyButtons || 0;
    h1Total += c.h1Count || 0;
    h1PerPage.push({ page: p.pageLabel, h1: c.h1Count || 0 });
    if (c.main) mainCount++;
    if (c.skipLink) skip++;
    aria += c.ariaCount || 0; tabbable += c.tabbable || 0;
    focusVisible += p.css?.focusVisibleSelectors || 0;
    reducedMotion += p.css?.reducedMotionRules || 0;
  }
  const worst = [...pairs.values()]
    .filter((e) => e.ratio >= 1.2 && e.fg !== e.bg)
    .map((e) => ({ fg: e.fg, bg: e.bg, ratio: e.ratio, count: e.count, sizes: [...e.sizes].sort((a, b) => a - b), samples: e.samples, tags: [...e.tags] }))
    .sort((a, b) => a.ratio - b.ratio).slice(0, 14);
  return {
    contrastWorst: worst,
    contrastSummary: (() => {
      const real = [...pairs.values()].filter((e) => e.ratio >= 1.2 && e.fg !== e.bg);
      return { pairs: real.length, failAA: real.filter((e) => e.ratio < 4.5).length, failAAA: real.filter((e) => e.ratio < 7).length };
    })(),
    images, missingAlt, altCoverage: images ? Math.round(((images - missingAlt) / images) * 100) : null,
    emptyLinks, emptyButtons, h1Total, h1PerPage, mainCount, skipLinks: skip, ariaAttributes: aria, tabbable,
    focusVisibleSelectorsPerPage: focusVisible, reducedMotionRulesPerPage: reducedMotion,
  };
}

function mediaReport(pages) {
  let img = 0, lazy = 0, srcset = 0, video = 0, bgImg = 0, gradients = 0, missingAlt = 0;
  const fits = new Map(), aspects = new Map(), formats = new Map();
  for (const p of pages) {
    const m = p.media || {};
    img += m.images?.count || 0; lazy += m.images?.lazy || 0; srcset += m.images?.withSrcset || 0;
    missingAlt += m.images?.missingAlt || 0;
    video += (m.videos?.length || 0) + (m.iframes?.length || 0);
    bgImg += m.bgImages?.count || 0; gradients += m.bgImages?.gradients || 0;
    for (const [k, v] of Object.entries(m.images?.objectFit || {})) inc(fits, k, v);
    for (const a of m.images?.aspect || []) inc(aspects, Number(a));
    for (const f of m.images?.formats || []) inc(formats, f);
  }
  const total = pages.length || 1;
  return { images: img, lazyPct: img ? Math.round((lazy / img) * 100) : 0, srcsetPct: img ? Math.round((srcset / img) * 100) : 0, missingAlt, videosPerPage: Math.round((video / total) * 10) / 10, bgImagesPerPage: Math.round((bgImg / total) * 10) / 10, gradientsPerPage: Math.round((gradients / total) * 10) / 10, objectFit: topEntries(fits, 6), aspectRatios: topEntries(aspects, 12), formats: topEntries(formats, 8) };
}

function pageFlows(pages) {
  return pages.map((p) => ({
    page: p.pageLabel,
    url: p.requestedUrl,
    title: p.title,
    h1: (p.headings || []).filter((h) => h.level === 'h1').map((h) => h.text),
    sections: (p.sections || []).map((s) => ({ type: s.type, top: s.top, height: s.height, bg: s.bg, bgImage: s.bgImage !== 'none', padding: s.padding, heading: s.heading, images: s.images, videos: s.videos, childCount: s.childCount })),
    displayHeads: (p.displayHeads || []).slice(0, 6).map((d) => ({ text: d.text, size: d.size, weight: d.weight, family: d.family })),
    framework: p.framework,
    overlays: p.overlays || [],
  }));
}

function htmlEscape(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function mdTable(headers, rows) {
  const line = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  return [line, sep, ...rows.map((r) => `| ${r.map((c) => String(c ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`)].join('\n');
}

function factsMarkdown(site, pages, t) {
  const L = [];
  L.push(`# ${site.name} — extraction facts`, '');
  L.push(`Crawled ${pages.length} pages on ${new Date().toISOString().slice(0, 10)}. Viewports: 1440 / 768 / 390.`, '');
  L.push('## Pages', '');
  L.push(mdTable(['Page', 'URL', 'Title', 'Elements', 'Sections', 'H1s'], pages.map((p) => [p.pageLabel, p.requestedUrl, p.title, p.counts?.elements, (p.sections || []).length, (p.headings || []).filter((h) => h.level === 'h1').length])));
  L.push('', '## Framework', '');
  const fw = new Set(); pages.forEach((p) => (p.framework || []).forEach((f) => fw.add(f)));
  L.push(`Detected: ${[...fw].join(', ') || 'n/a'}`);
  L.push(`Stylesheets per page (top): ${t.layout.stylesheets.map((s) => s.value).join(', ')}`, '');

  L.push('## Palette', '');
  L.push(mdTable(['Role', 'Hex', 'RGB', 'HSL', 'Bg area', 'Text chars', 'CSS decls', 'Pages', 'Samples'], t.palette.slice(0, 26).map((c) => [c.name, c.hex, c.rgb.join(','), `${c.hsl.h}° ${c.hsl.s}% ${c.hsl.l}%`, c.bgArea, c.textChars, c.cssDecls, c.pagesCount, (c.samples || []).join(' / ').slice(0, 46)])));
  L.push('', '### Brand candidates', '');
  L.push(t.roles.brand.map((c) => `${c.hex} (${c.name}, ${c.hsl.h}° sat ${c.hsl.s}%)`).join(' · ') || 'none');
  L.push('', '### Neutral ramp', '');
  L.push(t.roles.neutrals.map((c) => `${c.hex} L${c.hsl.l}`).join(' → ') || 'none');
  L.push('', '### Defined brand tokens (CSS custom properties, incl. unused)', '');
  L.push(mdTable(['Variable', 'Hex', 'Name', 'Painted'], (t.roles.defined || []).map((d) => [d.var, d.hex, d.name, d.used ? 'yes' : 'defined only'])));
  L.push('', '### Utility / library colors (not design-system brand)', '');
  L.push((t.roles.utility || []).map((c) => `${c.hex} (${c.name})`).join(' · ') || 'none');
  L.push('', '### CSS variable colors (role hints)', '');
  L.push(mdTable(['Variable', 'Value', 'Scopes'], (t.roleVars || []).slice(0, 24).map((v) => [v.var, v.value, v.scope])));

  L.push('', '## Typography', '');
  L.push('### Families', '');
  L.push(t.type.families.map((f) => `- ${f.value} — ${f.count}`).join('\n'));
  L.push('', '### @font-face', '');
  L.push(t.type.fontFaces.map((f) => `- ${f.family} ${f.weight} ${f.style} — ${f.src.split(',').slice(0, 2).join(', ').slice(0, 120)}`).join('\n') || 'none');
  L.push('', '### Type scale (rendered)', '');
  L.push(mdTable(['Size', 'Weight', 'LH', 'LS', 'Transform', 'Family', 'Uses', 'Sample'], t.type.scale.slice(0, 26).map((s) => [s.size + 'px', s.weight, s.lineHeight, s.letterSpacing, s.transform, (s.family || '').split(',')[0], s.count, (s.samples || []).join(' / ').slice(0, 54)])));
  L.push('', `Weights used: ${(t.type.weights || []).map((w) => w.value + '×' + w.count).join(', ')}`);
  L.push('', `Fluid/clamp declarations: ${(t.type.fluid || []).slice(0, 6).map((f) => f.value + '×' + f.count).join(' · ') || 'none'}`);
  L.push('', '### Display type (hero / split-text)', '');
  L.push(mdTable(['Text', 'Size', 'Weight', 'Family', 'Uses'], t.type.display.map((d) => [d.samples[0] || '', d.size + 'px', d.weight, (d.family || '').split(',')[0], d.count])));

  L.push('', '## Spacing & layout', '');
  L.push(`Section vertical padding: ${t.spacing.sectionPadY.map((p) => p.value + 'px×' + p.count).join(', ')}`);
  L.push(`Section horizontal padding: ${t.spacing.sectionPadX.map((p) => p.value).join(', ')}`);
  L.push(`CSS padding values: ${t.spacing.cssPaddings.slice(0, 16).map((p) => p.value + '×' + p.count).join(', ')}`);
  L.push(`Gaps: ${t.spacing.gaps.slice(0, 10).map((p) => p.value + '×' + p.count).join(', ')}`);
  L.push(`Section heights: ${t.spacing.sectionHeights.slice(0, 12).map((p) => p.value + '×' + p.count).join(', ')}`, '');
  L.push('### Containers', '');
  L.push(t.layout.containers.map((c) => `- ${c.value} (${c.count})`).join('\n'));
  L.push('', `Layout elements: flex ${t.layout.counts.flex}, grid ${t.layout.counts.grid}, block ${t.layout.counts.block}`);
  L.push(`Grid templates: ${t.layout.gridCols.slice(0, 6).map((g) => g.value + '×' + g.count).join(' · ')}`);
  L.push(`Max widths: ${t.layout.maxWidths.slice(0, 10).map((m) => m.value + '×' + m.count).join(', ')}`);

  L.push('', '## Shape & depth', '');
  L.push(`Radii: ${t.shape.radii.map((r) => r.value + '×' + r.count).join(', ')}`);
  L.push(`Shadows: ${t.shape.shadows.map((s) => s.value + '×' + s.count).join(', ')}`);
  L.push(`Gradients: ${(t.shape.gradients || []).slice(0, 6).map((g) => g.value.slice(0, 90)).join(' · ')}`);

  L.push('', '## Breakpoints', '');
  L.push(t.breakpoints.map((b) => `${b.value} (${b.count})`).join(' · ') || 'none');

  L.push('', '## Motion', '');
  L.push(`Durations: ${t.shape.durations.map((d) => d.value + '×' + d.count).join(', ')}`);
  L.push(`Easings: ${t.shape.easings.map((e) => e.value + '×' + e.count).join(', ')}`);
  L.push(`Keyframes: ${t.shape.keyframes.slice(0, 12).map((k) => k.value).join(', ')}`);
  L.push(`Libraries: ${Object.entries(t.shape.libs).map(([k, v]) => `${k}(${v})`).join(', ') || 'none detected'}`);
  L.push(`Data attributes: ${JSON.stringify(t.shape.dataAttrs)}`);
  L.push(`Component transitions: ${t.shape.componentTransitions.slice(0, 8).map((x) => x.value + '×' + x.count).join(', ')}`);

  L.push('', '## Components', '');
  L.push('### Buttons', '');
  L.push(mdTable(['Variant', 'Shape', 'Size', 'Weight', 'Bg', 'Color', 'Radius', 'Padding', 'Border', 'Count', 'Samples'], t.components.buttons.map((b) => [b.variant, b.shape, b.size, b.weight, b.bg, b.color, b.radius, b.padding, b.border.slice(0, 30), b.count, (b.samples || []).join(' / ').slice(0, 40)])));
  L.push('', '### Cards / surfaces', '');
  L.push(mdTable(['Bg', 'Radius', 'Shadow', 'Border', 'Padding', 'Width', 'Img', 'Count'], t.components.cards.map((c) => [c.bg, c.radius, (c.shadow || '').slice(0, 46), (c.border || '').slice(0, 30), c.padding, c.width, c.hasImg, c.count])));
  L.push('', '### Navigation', '');
  for (const n of t.components.navs) {
    L.push(`- <${n.tag}> ×${n.count}; sticky/fixed ${n.stickyPct}%; heights ${n.heights.map((h) => h.value).join('/')}; bg ${n.bgs.map((b) => b.value).join(' / ')}; position ${n.positions.map((p) => p.value).join('/')}; features ${JSON.stringify(n.features)}`);
    L.push(`  links: ${n.links.join(' · ')}`);
  }
  L.push('', '### Eyebrow / label styles', '');
  L.push(mdTable(['Size', 'Weight', 'LS', 'Transform', 'Color', 'Count', 'Samples'], t.components.badges.map((b) => [b.size, b.weight, b.letterSpacing, b.transform, b.color, b.count, (b.samples || []).join(' / ').slice(0, 50)])));
  L.push('', '### Link styles', '');
  L.push(mdTable(['Color', 'Decoration', 'Weight', 'Size', 'Count', 'Samples'], t.components.links.map((l) => [l.color, l.decoration, l.weight, l.size, l.count, (l.samples || []).join(' / ').slice(0, 40)])));

  L.push('', '## Media treatment', '');
  L.push(`Images/site ${t.media.images}; lazy ${t.media.lazyPct}%; srcset ${t.media.srcsetPct}%; alt coverage ${100 - Math.round(((t.media.missingAlt || 0) / Math.max(1, t.media.images)) * 100)}%`);
  L.push(`Object-fit: ${t.media.objectFit.map((f) => f.value + '×' + f.count).join(', ')}`);
  L.push(`Aspect ratios: ${t.media.aspectRatios.slice(0, 10).map((a) => a.value + '×' + a.count).join(', ')}`);
  L.push(`Video/iframe per page: ${t.media.videosPerPage}; CSS backgrounds per page: ${t.media.bgImagesPerPage}; gradients per page: ${t.media.gradientsPerPage}`);
  L.push(`Formats: ${t.media.formats.map((f) => f.value).join(', ')}`);

  L.push('', '## Accessibility', '');
  L.push(`Images ${t.a11y.images}, missing alt ${t.a11y.missingAlt}; empty links ${t.a11y.emptyLinks}, empty buttons ${t.a11y.emptyButtons}`);
  L.push(`H1 count total ${t.a11y.h1Total} across ${pages.length} pages; pages without main landmark ${pages.length - t.a11y.mainCount}; skip links ${t.a11y.skipLinks}`);
  L.push(`focus-visible selectors/page ${t.a11y.focusVisibleSelectorsPerPage}; reduced-motion rules/page ${t.a11y.reducedMotionRulesPerPage}`);
  L.push('', '### Contrast pairs (worst first)', '');
  L.push(mdTable(['FG', 'BG', 'Ratio', 'Uses', 'Sizes', 'Sample'], t.a11y.contrastWorst.map((c) => [c.fg, c.bg, c.ratio, c.count, c.sizes.join('/'), (c.samples[0] || '').slice(0, 40)])));

  L.push('', '## Homepage section flow', '');
  const home = pages.find((p) => p.pageLabel === 'Home') || pages[0];
  L.push(mdTable(['#', 'Type', 'Top', 'Height', 'BG', 'Pad', 'Heading'], (home?.sections || []).map((s, i) => [i + 1, s.type, s.top, s.height, s.bg + (s.bgImage !== 'none' ? ' +img' : ''), s.padding, (s.heading || '').slice(0, 70)])));
  return L.join('\n');
}

// ---------------- export writers ----------------
function slugName(s) { return s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase(); }

function buildTokens(site, t) {
  return {
    $generated: new Date().toISOString(), site: site.slug, name: site.name, url: site.base,
    color: {
      brand: t.roles.brand.map((c, i) => ({ name: `brand-${(i + 1) * 100}`, hex: c.hex, rgb: c.rgb, hsl: c.hsl, notes: c.name })),
      neutrals: t.roles.neutrals.map((c) => ({ name: c.name, hex: c.hex, hsl: c.hsl })),
      text: t.palette.filter((c) => c.textChars > 0).slice(0, 8).map((c) => ({ hex: c.hex, name: c.name, textChars: c.textChars })),
      backgrounds: t.palette.filter((c) => c.bgArea > 0).slice(0, 10).map((c) => ({ hex: c.hex, name: c.name, bgArea: c.bgArea })),
      all: t.palette.slice(0, 30),
      definedTokens: (t.roles.defined || []).slice(0, 30),
    },
    typography: {
      families: t.type.families,
      renderedFamilies: t.type.renderedFamilies,
      fontFaces: t.type.fontFaces,
      scale: t.type.scale.map((s) => ({ size: s.size, weight: s.weight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, transform: s.transform, family: s.family, color: s.color, count: s.count, samples: s.samples.slice(0, 3) })),
      display: t.type.display,
    },
    spacing: {
      sectionPaddingY: t.spacing.sectionPadY,
      sectionPaddingX: t.spacing.sectionPadX,
      paddings: t.spacing.cssPaddings.slice(0, 16),
      gaps: t.spacing.gaps,
    },
    radius: t.shape.radii,
    shadow: t.shape.shadows,
    breakpoints: t.breakpoints,
    layout: t.layout,
    motion: { durations: t.shape.durations, easings: t.shape.easings, keyframes: t.shape.keyframes, libs: t.shape.libs, dataAttrs: t.shape.dataAttrs },
    components: t.components,
    media: t.media,
    a11y: t.a11y,
  };
}

function writeCss(site, t) {
  const p = site.slug.replace(/[^a-z0-9]+/gi, '-');
  const L = [`/* ============================================================`, `   ${site.name} — design tokens (reverse-engineered)`, `   Source: ${site.base} · ${new Date().toISOString().slice(0, 10)}`, `   Values observed from computed styles + CSS custom properties.`, `   ============================================================ */`, '', ':root {', '  /* ---- brand & accents ---- */'];
  if (t.roles.brand.length) t.roles.brand.forEach((c, i) => L.push(`  --${p}-brand-${(i + 1) * 100}: ${c.hex}; /* ${c.name} */`));
  else {
    const ink = t.roles.neutrals.find((c) => c.hsl.l <= 15) || t.roles.neutrals[0];
    if (ink) L.push(`  --${p}-brand-ink: ${ink.hex}; /* monochrome system: photography carries the color */`);
  }
  L.push('', '  /* ---- neutrals ---- */');
  t.roles.neutrals.forEach((c, i) => L.push(`  --${p}-neutral-${i + 1}: ${c.hex}; /* L${c.hsl.l} */`));
  L.push('', '  /* ---- surfaces & text ---- */');
  const seenVar = new Set();
  const pushUnique = (prefix, c) => {
    let base = slugName(c.name) || 'color';
    let name = `${prefix}-${base}`;
    let i = 2;
    while (seenVar.has(name)) name = `${prefix}-${base}-${i++}`;
    seenVar.add(name);
    L.push(`  --${p}-${name}: ${c.hex};`);
  };
  t.palette.filter((c) => c.bgArea > 0).slice(0, 8).forEach((c) => pushUnique('surface', c));
  L.push('');
  t.palette.filter((c) => c.textChars > 0).slice(0, 6).forEach((c) => pushUnique('text', c));
  L.push('', '  /* ---- type scale ---- */');
  const seen = new Set();
  t.type.scale.forEach((s) => {
    const key = `${s.size}-${s.weight}`;
    if (seen.has(key) || s.size < 10) return;
    seen.add(key);
    L.push(`  --${p}-font-size-${s.size}: ${s.size}px; /* w${s.weight}, lh ${s.lineHeight} */`);
  });
  L.push('', '  /* ---- spacing ---- */');
  [...new Set(t.spacing.cssPaddings.concat(t.spacing.sectionPadY).map((x) => pxv(String(x.value).split('/')[0])).filter((v) => v && v >= 2 && v <= 200))].sort((a, b) => a - b).slice(0, 18).forEach((v) => L.push(`  --${p}-space-${v}: ${v}px;`));
  L.push('', '  /* ---- radius ---- */');
  t.shape.radii.slice(0, 10).forEach((r, i) => L.push(`  --${p}-radius-${i + 1}: ${r.value};`));
  L.push('', '  /* ---- shadow ---- */');
  t.shape.shadows.slice(0, 8).forEach((s, i) => L.push(`  --${p}-shadow-${i + 1}: ${s.value};`));
  L.push('', '  /* ---- motion ---- */');
  t.shape.durations.slice(0, 6).forEach((d, i) => L.push(`  --${p}-duration-${i + 1}: ${d.value};`));
  t.shape.easings.slice(0, 6).forEach((e, i) => L.push(`  --${p}-ease-${i + 1}: ${e.value};`));
  L.push('}', '', '/* ---- breakpoints (observed) ---- */');
  t.breakpoints.filter((b) => b.value.startsWith('min')).slice(0, 8).forEach((b) => L.push(`@media (${b.value}) { /* ${b.count} rules */ }`));
  return L.join('\n');
}

function writeTailwind(site, t) {
  const hexes = {};
  t.roles.brand.forEach((c, i) => (hexes[`brand-${(i + 1) * 100}`] = c.hex));
  t.roles.neutrals.forEach((c, i) => (hexes[`neutral-${i + 1}`] = c.hex));
  const sizes = {};
  t.type.scale.forEach((s) => { if (s.size >= 10) sizes[`${s.size}`] = `${s.size}px`; });
  const radius = {}; t.shape.radii.slice(0, 8).forEach((r, i) => (radius[i + 1] = r.value));
  const shadow = {}; t.shape.shadows.slice(0, 6).forEach((r, i) => (shadow[i + 1] = r.value));
  const screens = {}; t.breakpoints.filter((b) => b.value.startsWith('min')).forEach((b) => { const w = b.value.split(':')[1]; screens[`bp-${w}`] = `${w}px`; });
  const fam = {};
  const famSource = (t.type.renderedFamilies?.length ? t.type.renderedFamilies : t.type.families).slice(0, 4);
  famSource.forEach((f) => {
    const full = t.type.families.find((x) => String(x.value).split(',')[0].replace(/['"]/g, '').trim() === f.value);
    const stack = (full?.value || f.value).split(',').map((x) => x.trim());
    fam[f.value] = stack;
  });
  return `/** ${site.name} — Tailwind theme extracted from ${site.base} @ ${new Date().toISOString().slice(0, 10)} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: ${JSON.stringify(hexes, null, 6).replace(/\n}$/, '\n      }')},
      fontFamily: ${JSON.stringify(fam, null, 6).replace(/\n}$/, '\n      }')},
      fontSize: ${JSON.stringify(sizes, null, 6).replace(/\n}$/, '\n      }')},
      borderRadius: ${JSON.stringify(radius, null, 6).replace(/\n}$/, '\n      }')},
      boxShadow: ${JSON.stringify(shadow, null, 6).replace(/\n}$/, '\n      }')},
      screens: ${JSON.stringify(screens, null, 6).replace(/\n}$/, '\n      }')},
    }
  }
};
`;
}

// ---------------- main ----------------
for (const site of sites) {
  if (onlySite && onlySite !== site.slug) continue;
  const siteDir = path.join(ROOT, 'sites', site.slug);
  const pages = await listPageDirs(siteDir);
  if (!pages.length) { console.log(`- ${site.slug}: no pages`); continue; }
  console.log(`analyzing ${site.slug} (${pages.length} pages)`);

  const colorMap = mergeColors(pages);
  const palette = paletteReport(colorMap, 15000);

  // css variable → color mapping (before roles so named brand tokens can be trusted)
  const roleVars = [];
  const varSeen = new Set();
  for (const p of pages) {
    for (const v of p.css?.vars || []) {
      if (!/color|bg|background|surface|text|accent|primary|brand|foreground|border|line|ink|sand|stone|clay/i.test(v.name)) continue;
      if (varSeen.has(v.name)) continue;
      const hex = parseColor(v.value) || parseColor(String(v.value).trim().replace(/^hsl/i, ''));
      varSeen.add(v.name);
      roleVars.push({ var: v.name, value: hex || v.value, scope: (v.scopes?.[0] || '').slice(0, 60) });
      if (roleVars.length >= 40) break;
    }
    if (roleVars.length >= 40) break;
  }

  const roles = assignRoles(palette, roleVars);

  const t = {
    palette,
    roles,
    roleVars,
    type: typographyReport(pages),
    spacing: spacingReport(pages),
    shape: radiusShadowReport(pages),
    breakpoints: breakpointReport(pages),
    layout: layoutReport(pages),
    components: componentReport(pages),
    a11y: a11yReport(pages),
    media: mediaReport(pages),
  };

  const analysisDir = path.join(siteDir, 'analysis');
  await fs.mkdir(analysisDir, { recursive: true });
  await fs.writeFile(path.join(analysisDir, 'tokens.json'), JSON.stringify(buildTokens(site, t), null, 2));
  await fs.writeFile(path.join(analysisDir, 'raw-analysis.json'), JSON.stringify({ site: site.slug, pages: pageFlows(pages), ...t }, null, 2));
  await fs.writeFile(path.join(analysisDir, 'facts.md'), factsMarkdown(site, pages, t));
  await fs.writeFile(path.join(siteDir, 'tokens.css'), writeCss(site, t));
  await fs.writeFile(path.join(siteDir, 'tailwind.config.js'), writeTailwind(site, t));
  console.log(`  ✓ palette ${palette.length} · scale ${t.type.scale.length} · buttons ${t.components.buttons.length} · sections ${pages.reduce((a, p) => a + (p.sections?.length || 0), 0)}`);
}
console.log('done');
