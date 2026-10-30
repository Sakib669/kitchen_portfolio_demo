// Runs inside the page (Playwright evaluate). Must be fully self-contained:
// no references to module scope. Returns a JSON-serializable design snapshot.

export function extractInPage(cfg) {
  const CAP = cfg || {};
  const VW = window.innerWidth;
  const VH = window.innerHeight;
  const SCROLL_Y = window.scrollY;

  // ---------- color helpers ----------
  const parseColor = (str) => {
    if (!str) return null;
    const s = String(str).trim().toLowerCase();
    if (s === 'transparent' || s === 'none') return { hex: null, a: 0 };
    let m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/);
    if (m) {
      const a = m[4] === undefined ? 1 : parseFloat(m[4]);
      const hex = '#' + [m[1], m[2], m[3]].map((n) => Math.round(parseFloat(n)).toString(16).padStart(2, '0')).join('');
      return { hex, a };
    }
    m = s.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/);
    if (m) {
      const a = m[4] === undefined ? 1 : parseFloat(m[4]);
      const hex = '#' + [m[1], m[2], m[3]].map((n) => Math.round(parseFloat(n) * 255).toString(16).padStart(2, '0')).join('');
      return { hex, a };
    }
    m = s.match(/^#([0-9a-f]{3,8})$/);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      if (h.length === 4) h = h.split('').map((c) => c + c).join('');
      const a = h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1;
      return { hex: '#' + h.slice(0, 6), a };
    }
    return null;
  };

  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const lum = (hex) => {
    const [r, g, b] = hexToRgb(hex).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrastRatio = (h1, h2) => {
    const l1 = lum(h1), l2 = lum(h2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  // ---------- element helpers ----------
  const style = (el) => getComputedStyle(el);
  const rect = (el) => el.getBoundingClientRect();
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') return false;
    if (parseFloat(s.opacity) < 0.03) return false;
    return true;
  };
  const px = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  };
  const clip = (s, n) => (s ? String(s).replace(/\s+/g, ' ').trim().slice(0, n) : '');
  const directText = (el) => {
    let t = '';
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent;
    return clip(t, 300);
  };
  const textLen = (el) => (el.innerText || '').replace(/\s+/g, ' ').trim().length;

  const allEls = Array.from(document.querySelectorAll('*'));
  const scanEls = allEls.slice(0, 12000);

  // ---------- pass A: colors / backgrounds / surfaces ----------
  const bgMap = new Map();
  const textMap = new Map();
  const borderMap = new Map();
  const gradMap = new Map();
  const varColorMap = new Map();

  const bump = (map, key, w, meta) => {
    if (!key) return;
    const cur = map.get(key) || { key, weight: 0, count: 0, tags: {}, samples: [] };
    cur.weight += w;
    cur.count += 1;
    for (const t of meta.tags || []) cur.tags[t] = (cur.tags[t] || 0) + 1;
    if (meta.sample && cur.samples.length < 3 && !cur.samples.includes(meta.sample)) cur.samples.push(meta.sample);
    map.set(key, cur);
  };

  for (const el of scanEls) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') continue;
    if (parseFloat(s.opacity) < 0.03) continue;
    const area = Math.round(r.width * r.height);
    const tag = el.tagName.toLowerCase();
    const sample = clip(el.getAttribute('class') || el.id || tag, 80);

    const bg = parseColor(s.backgroundColor);
    if (bg && bg.hex && bg.a > 0.03) {
      bump(bgMap, bg.hex, area * bg.a, { tags: [tag], sample: sample ? `${tag}.${sample}` : tag });
    }
    const fg = parseColor(s.color);
    if (fg && fg.hex) {
      const chars = directText(el).length;
      if (chars > 0) bump(textMap, fg.hex, chars, { tags: [tag + ':' + Math.round(parseFloat(s.fontSize) || 0)], sample: directText(el).slice(0, 60) });
      else if (el.innerText && el.innerText.trim().length && el.children.length === 0) bump(textMap, fg.hex, 1, { tags: [tag], sample: clip(el.innerText, 40) });
    }
    // borders (only when there is a visible border)
    const bws = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'].map((p) => px(s[p]) || 0);
    if (Math.max(...bws) >= 1) {
      const bc = parseColor(s.borderTopColor) || parseColor(s.borderRightColor);
      if (bc && bc.hex && bc.a > 0.05) bump(borderMap, bc.hex, Math.max(...bws), { tags: [tag], sample: sample });
    }
    // gradients
    if (s.backgroundImage && s.backgroundImage.includes('gradient')) {
      const val = clip(s.backgroundImage, 220);
      bump(gradMap, val, area, { tags: [tag], sample: sample });
    }
    // CSS variables that hold colors
    if (el.hasAttribute('style') && String(el.getAttribute('style')).includes('--')) {
      const decls = String(el.getAttribute('style')).split(';');
      for (const d of decls) {
        const m = d.match(/(--[\w-]+)\s*:\s*(.+)/);
        if (m) {
          const c = parseColor(m[2]) || (m[2].trim().match(/^#?[0-9a-f]{3,8}$/i) ? parseColor('#' + m[2].replace('#', '')) : null);
          if (c && c.hex) bump(varColorMap, `${m[1]}=${c.hex}`, 1, { sample: tag });
        }
      }
    }
  }

  // ---------- pass B: curated deep styles ----------
  const DEEP = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      text: clip(el.innerText || '', 160),
      cls: clip(el.getAttribute('class') || '', 140),
      rect: { top: Math.round(r.top + window.scrollY), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) },
      family: s.fontFamily,
      size: px(s.fontSize),
      weight: s.fontWeight,
      lh: s.lineHeight === 'normal' ? 'normal' : px(s.lineHeight),
      ls: s.letterSpacing === 'normal' ? 'normal' : s.letterSpacing,
      transform: s.textTransform,
      color: s.color,
      bg: s.backgroundColor,
      bgImage: s.backgroundImage === 'none' ? 'none' : clip(s.backgroundImage, 160),
      border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      radius: s.borderRadius,
      shadow: s.boxShadow === 'none' ? 'none' : clip(s.boxShadow, 160),
      padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
      margin: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
      display: s.display,
      gap: s.gap,
      gridCols: s.gridTemplateColumns === 'none' ? 'none' : clip(s.gridTemplateColumns, 120),
      flexDir: s.flexDirection,
      align: s.alignItems,
      justify: s.justifyContent,
      textAlign: s.textAlign,
      maxWidth: s.maxWidth,
      width: s.width,
      height: s.height,
      position: s.position,
      zIndex: s.zIndex,
      overflow: s.overflow,
      backdrop: s.backdropFilter,
      transition: s.transition === 'all 0s ease 0s' ? 'none' : clip(s.transition, 160),
      opacity: s.opacity,
      decoration: s.textDecorationLine,
    };
  };

  const pickAll = (sel, filter, cap) => {
    const out = [];
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (out.length >= cap) break;
      if (!isVisible(el)) continue;
      if (filter && !filter(el)) continue;
      out.push(el);
    }
    return out;
  };

  // split-text headings: animated letter/word spans (common on Next.js/GSAP sites).
  // Also mark their word-parts so the per-character spans don't pollute the type scale.
  const splitContainers = [];
  const splitChildSet = new Set();
  for (const el of Array.from(document.querySelectorAll('h1,h2,h3,h4,div,span,p')).slice(0, 6000)) {
    const kids = Array.from(el.children);
    if (kids.length < 4) continue;
    let tiny = 0, spanish = 0;
    for (const k of kids) {
      const t = (k.textContent || '').trim();
      if (k.tagName === 'SPAN' || k.tagName === 'I' || k.tagName === 'EM') spanish++;
      if (t.length <= 3) tiny++;
    }
    if (spanish >= 4 && tiny >= Math.max(4, Math.floor(kids.length * 0.75))) {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      splitContainers.push({
        text: clip(el.innerText, 140), size: px(s.fontSize), weight: s.fontWeight, family: s.fontFamily,
        lh: s.lineHeight, ls: s.letterSpacing, transform: s.textTransform, color: s.color,
        tag: el.tagName.toLowerCase(), parts: kids.length, top: Math.round(r.top + window.scrollY),
        cls: clip(el.getAttribute('class') || '', 120),
      });
      for (const k of kids) splitChildSet.add(k);
    }
  }

  // text style inventory
  const tsMap = new Map();
  const textScope = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,button,span,label,strong,em,blockquote,figcaption,td,th,input,textarea,select')).slice(0, 4000);
  for (const el of textScope) {
    if (!isVisible(el)) continue;
    if (splitChildSet.has(el)) continue;
    const t = directText(el) || (el.children.length === 0 ? clip(el.innerText, 120) : '');
    if (!t || t.length < 1) continue;
    const s = getComputedStyle(el);
    const key = [s.fontFamily, Math.round(parseFloat(s.fontSize)), s.fontWeight, s.lineHeight, s.letterSpacing, s.textTransform, parseColor(s.color)?.hex].join('|');
    const cur = tsMap.get(key) || {
      family: s.fontFamily, size: px(s.fontSize), weight: s.fontWeight,
      lh: s.lineHeight, ls: s.letterSpacing, transform: s.textTransform,
      color: s.color, count: 0, tags: {}, sample: t.slice(0, 80),
    };
    cur.count += 1;
    cur.tags[el.tagName.toLowerCase()] = (cur.tags[el.tagName.toLowerCase()] || 0) + 1;
    tsMap.set(key, cur);
  }

  // headings
  const headings = pickAll('h1,h2,h3,h4,h5,h6', null, 200).map((el) => {
    const d = DEEP(el);
    return { level: el.tagName.toLowerCase(), text: clip(el.innerText, 180), family: d.family, size: d.size, weight: d.weight, lh: d.lh, ls: d.ls, transform: d.transform, color: d.color, top: d.rect.top, cls: d.cls };
  });

  // fallback display-type detection: biggest text on the page even when split/animated
  const bigText = [];
  for (const el of scanEls) {
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize) || 0;
    if (fs < 28) continue;
    if (!isVisible(el)) continue;
    const t = el.children.length === 0 ? clip(el.innerText, 120) : directText(el);
    if (!t || t.length < 4) continue;
    const key = `${Math.round(fs)}|${s.fontWeight}|${s.fontFamily}|${t.slice(0, 30)}`;
    if (bigText.some((x) => x.key === key)) continue;
    if (bigText.some((x) => x.text.includes(t) || t.includes(x.text))) continue;
    bigText.push({ key, text: t, size: px(s.fontSize), weight: s.fontWeight, family: s.fontFamily, lh: s.lineHeight, ls: s.letterSpacing, transform: s.textTransform, color: s.color, tag: el.tagName.toLowerCase(), top: Math.round(el.getBoundingClientRect().top + window.scrollY), cls: clip(el.getAttribute('class') || '', 120), parts: 0 });
    if (bigText.length >= 20) break;
  }
  const displayHeads = [...splitContainers, ...bigText]
    .filter((x, i, arr) => arr.findIndex((y) => y.text === x.text) === i)
    .sort((a, b) => b.size - a.size)
    .slice(0, 24);

  // sections: unwrap layout wrappers, then take the content container's visual bands
  const bands = (() => {
    const bigChild = (el, minH) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.height < minH || r.width < VW * 0.55) return false;
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
      if (s.position === 'fixed') return false;
      return true;
    };
    const unwrap = (node) => {
      let cur = node;
      for (let i = 0; i < 12; i++) {
        const kids = Array.from(cur.children).filter((k) => bigChild(k, 40));
        if (kids.length === 1) {
          const kr = kids[0].getBoundingClientRect();
          const cr = cur.getBoundingClientRect();
          if (kr.height >= cr.height * 0.7 || kids[0].children.length > 0) { cur = kids[0]; continue; }
        }
        break;
      }
      return cur;
    };
    const contentRoot = document.querySelector('main, [role="main"]') || document.body;
    let node = unwrap(contentRoot);
    // a single big child that fills the wrapper is still a wrapper
    for (let i = 0; i < 8; i++) {
      const kids = Array.from(node.children).filter((k) => bigChild(k, 60));
      if (kids.length === 1 && kids[0].getBoundingClientRect().height > node.getBoundingClientRect().height * 0.85) {
        node = unwrap(kids[0]);
        continue;
      }
      break;
    }
    const expandOne = (el) => {
      let cur = el;
      for (let i = 0; i < 10; i++) {
        const kids = Array.from(cur.children).filter((k) => bigChild(k, 60));
        if (kids.length === 1) { cur = kids[0]; continue; }
        break;
      }
      return cur;
    };
    const hasDirectText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);

    let list = Array.from(node.children).filter((k) => bigChild(k, 110)).map(expandOne);
    if (list.length < 2) {
      // fall back to landmark / class candidate scan
      const candSel = 'section, header, footer, article, main > *, [class*="section"], [class*="hero"], [class*="banner"], .e-con, .elementor-section';
      list = Array.from(document.querySelectorAll(candSel)).filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width >= VW * 0.55 && r.height >= 110 && s.display !== 'none' && s.visibility !== 'hidden' && s.position !== 'fixed';
      });
    }
    // one level of "wrapper -> bands" expansion: a text-less container whose children
    // are themselves full-width blocks is a layout wrapper, not a designed band.
    const expanded = [];
    for (const item of list) {
      const kids = Array.from(item.children).filter((k) => bigChild(k, 150));
      if (kids.length >= 2 && kids.length <= 40 && !hasDirectText(item)) expanded.push(...kids.map(expandOne));
      else expanded.push(item);
    }
    list = expanded;
    // dedupe nested
    list = list.filter((el, i) => !list.some((other, j) => j !== i && other !== el && other.contains(el) && other.getBoundingClientRect().height > el.getBoundingClientRect().height * 1.02));
    // header + footer as explicit bands
    const header = document.querySelector('header, [class*="site-header"], #main-header') || document.querySelector('body > div > header');
    const footer = document.querySelector('footer, [class*="site-footer"], .elementor-location-footer, [role="contentinfo"]');
    const out = [];
    if (header && isVisible(header) && header.getBoundingClientRect().height < 420) out.push({ el: header, type: 'header' });
    for (const el of list) {
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const isFooterish = footer && (footer.contains(el) || el.contains(footer));
      const type = top < 160 && r.height < 320 ? 'header' : isFooterish || top > document.documentElement.scrollHeight * 0.82 ? 'footer' : 'section';
      out.push({ el, type });
    }
    if (footer && isVisible(footer)) out.push({ el: footer, type: 'footer' });
    // hero / banner stage that often sits outside <main> (TYPO3 banner, Elementor hero)
    const heroSels = ['#banner', '[class*="hero"]', '[class*="banner"]', '[class*="masthead"]', '[class*="stage"]', '[class*="keyvisual"]', '[class*="key-visual"]'];
    const heroEls = [];
    for (const sel of heroSels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.height < 200 || r.height > 2000 || r.width < VW * 0.55) continue;
        const top = r.top + window.scrollY;
        if (top > 1700) continue;
        if (getComputedStyle(el).position === 'fixed') continue;
        if (out.some((b) => b.el === el || b.el.contains(el) || el.contains(b.el))) continue;
        heroEls.push({ el, top, h: r.height, area: r.width * r.height });
      }
    }
    if (heroEls.length) {
      heroEls.sort((a, b) => b.area - a.area);
      const pick = heroEls.find((h) => !out.some((b) => b.el.contains(h.el) || h.el.contains(b.el)));
      if (pick) out.push({ el: pick.el, type: 'hero' });
    }
    // sort by document position; drop fixed/hidden and duplicate tops
    return out
      .map((b) => ({ ...b, top: Math.round(b.el.getBoundingClientRect().top + window.scrollY), h: Math.round(b.el.getBoundingClientRect().height) }))
      .filter((b) => b.h > 30 && getComputedStyle(b.el).position !== 'fixed')
      .sort((a, b) => a.top - b.top || b.h - a.h)
      .filter((b, i, arr) => i === 0 || Math.abs(b.top - arr[i - 1].top) > 20);
  })();

  const sections = bands.slice(0, 70).map((band, i) => {
    const el = band.el;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const h = el.querySelector('h1,h2,h3,h4');
    const bandTop = Math.round(r.top + window.scrollY);
    const split = splitContainers.find((x) => x.top >= bandTop - 5 && x.top < bandTop + r.height);
    const bigInBand = bigText.filter((x) => x.top >= bandTop - 5 && x.top < bandTop + r.height).sort((a, b) => b.size - a.size)[0];
    return {
      index: i,
      type: band.type,
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: clip(el.getAttribute('class') || '', 140),
      top: Math.round(r.top + window.scrollY),
      height: Math.round(r.height),
      width: Math.round(r.width),
      bg: s.backgroundColor,
      bgImage: s.backgroundImage === 'none' ? 'none' : clip(s.backgroundImage, 140),
      color: s.color,
      padding: `${s.paddingTop} ${s.paddingBottom}`,
      paddingX: `${s.paddingLeft} ${s.paddingRight}`,
      margin: `${s.marginTop} ${s.marginBottom}`,
      display: s.display,
      gridCols: s.gridTemplateColumns,
      gap: s.gap,
      maxWidth: s.maxWidth,
      textAlign: s.textAlign,
      radius: s.borderRadius,
      overflow: s.overflow,
      sticky: s.position === 'sticky' || s.position === 'fixed',
      childCount: el.children.length,
      heading: h ? `${h.tagName.toLowerCase()}: ${clip(h.innerText, 140)}` : (split ? `split: ${split.text}` : (bigInBand ? `display: ${bigInBand.text}` : '')),
      images: el.querySelectorAll('img').length,
      svgs: el.querySelectorAll('svg').length,
      buttons: el.querySelectorAll('button, a[class*="btn"], a[class*="button"], [role="button"]').length,
      links: el.querySelectorAll('a[href]').length,
      videos: el.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
      dataAttrs: Array.from(el.attributes).filter((a) => a.name.startsWith('data-')).map((a) => a.name).slice(0, 8),
    };
  });

  // containers / page gutters
  const contMap = new Map();
  for (const el of scanEls) {
    const s = getComputedStyle(el);
    const mw = parseFloat(s.maxWidth);
    if (!Number.isFinite(mw) || mw < 640 || mw > 2000) continue;
    const r = el.getBoundingClientRect();
    if (r.width < VW * 0.55 || r.height < 30) continue;
    const pl = px(s.paddingLeft), pr = px(s.paddingRight);
    const key = `${Math.round(mw)}|${pl === pr ? pl : 'x'}`;
    const cur = contMap.get(key) || { maxWidth: Math.round(mw), padX: pl === pr ? pl : null, count: 0, sample: clip(el.getAttribute('class') || '', 80) };
    cur.count++;
    contMap.set(key, cur);
  }

  // buttons (semantic + role + styled anchors)
  const btnCandidates = pickAll('button, [role="button"], input[type="submit"], .btn, a[class*="btn"], a[class*="button"]', null, 300);
  const btnMap = new Map();
  for (const el of btnCandidates) {
    const d = DEEP(el);
    if (d.rect.h > 120 || d.rect.w > 500 || d.rect.w < 12) continue;
    if (!d.text && !el.querySelector('svg,img')) continue;
    const bg = parseColor(d.bg);
    const variant = bg && bg.a > 0.2 ? 'filled' : (parseFloat(d.border.split(' ')[0]) > 0 ? 'outline' : 'text');
    const radiusPx = parseFloat(d.radius) || 0;
    const shape = radiusPx >= d.rect.h / 2 - 1 ? 'pill' : radiusPx > 0 ? 'rounded' : 'square';
    const key = `${variant}|${d.bg}|${d.color}|${d.radius}|${d.size}|${d.weight}|${shape}`;
    const cur = btnMap.get(key) || { variant, shape, ...d, count: 0, samples: [] };
    cur.count++;
    if (cur.samples.length < 3 && d.text) cur.samples.push(d.text.slice(0, 50));
    btnMap.set(key, cur);
  }

  // cards / surfaces
  const cardMap = new Map();
  for (const el of scanEls) {
    const r = el.getBoundingClientRect();
    if (r.width < 180 || r.width > 1000 || r.height < 120 || r.height > 1200) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const bg = parseColor(s.backgroundColor);
    const hasBg = bg && bg.hex && bg.a > 0.5;
    const shadow = s.boxShadow !== 'none';
    const bwidth = parseFloat(s.borderTopWidth) || 0;
    const radius = parseFloat(s.borderRadius) || 0;
    if (!(hasBg || shadow) || (radius < 2 && bwidth < 1 && !shadow)) continue;
    const txt = textLen(el);
    if (txt < 10) continue;
    if (el.children.length === 0) continue;
    const d = DEEP(el);
    const key = `${d.bg}|${d.radius}|${d.shadow}|${d.padding}|${Math.round(r.width / 20) * 20}`;
    const cur = cardMap.get(key) || { ...d, width: Math.round(r.width), height: Math.round(r.height), hasImg: !!el.querySelector('img'), count: 0 };
    cur.count++;
    cardMap.set(key, cur);
  }

  // navigation
  const navEls = pickAll('header, nav', (el) => getComputedStyle(el).display !== 'none', 12);
  const navs = navEls.map((el) => {
    const d = DEEP(el);
    const s = getComputedStyle(el);
    return {
      tag: d.tag, cls: d.cls, height: d.rect.h, bg: d.bg, color: d.color, position: d.position,
      backdrop: d.backdrop, shadow: d.shadow, border: d.border, padding: d.padding, maxWidth: d.maxWidth,
      display: d.display, justify: d.justify, gap: d.gap,
      links: el.querySelectorAll('a[href]').length,
      hasLogo: !!(el.querySelector('img, svg, [class*="logo"]')),
      hasSearch: !!el.querySelector('input[type="search"], [class*="search"], button[aria-label*="earch"]'),
      hasLanguage: !!el.querySelector('[class*="lang"], [hreflang]'),
      hamburger: !!el.querySelector('button[aria-label*="enu"], [class*="hamburger"], [class*="burger"], [class*="toggle"]'),
      links_sample: Array.from(el.querySelectorAll('a[href]')).slice(0, 25).map((a) => clip(a.innerText, 40)).filter(Boolean),
    };
  });

  // badges / eyebrows / small caps labels
  const badgeSeen = new Map();
  for (const el of textScope) {
    if (!isVisible(el)) continue;
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize) || 0;
    if (fs > 15 || fs < 8) continue;
    const ls = parseFloat(s.letterSpacing) || 0;
    const upper = s.textTransform === 'uppercase';
    if (!upper && ls < 0.6) continue;
    const t = clip(el.innerText, 70);
    if (!t || t.length > 70) continue;
    const key = `${Math.round(fs)}|${s.fontWeight}|${ls}|${upper}|${s.color}|${s.fontFamily}`;
    const cur = badgeSeen.get(key) || { size: fs, weight: s.fontWeight, letterSpacing: s.letterSpacing, transform: s.textTransform, color: s.color, family: s.fontFamily, count: 0, samples: [] };
    cur.count++;
    if (cur.samples.length < 4) cur.samples.push(t);
    badgeSeen.set(key, cur);
  }

  // inputs
  const inputs = pickAll('input:not([type="hidden"]), select, textarea', null, 40).map(DEEP);

  // links
  const linkStyles = (() => {
    const map = new Map();
    for (const el of pickAll('a[href]', null, 600)) {
      if (!el.innerText || !el.innerText.trim()) continue;
      const s = getComputedStyle(el);
      const key = [s.color, s.textDecorationLine, s.fontWeight, Math.round(parseFloat(s.fontSize)), s.textTransform].join('|');
      const cur = map.get(key) || { color: s.color, decoration: s.textDecorationLine, weight: s.fontWeight, size: px(s.fontSize), transform: s.textTransform, count: 0, samples: [] };
      cur.count++;
      if (cur.samples.length < 3) cur.samples.push(clip(el.innerText, 40));
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 12);
  })();

  // ---------- media ----------
  const imgs = Array.from(document.images);
  const media = {
    images: {
      count: imgs.length,
      missingAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
      emptyAlt: imgs.filter((i) => i.getAttribute('alt') === '').length,
      lazy: imgs.filter((i) => i.loading === 'lazy').length,
      withSrcset: imgs.filter((i) => i.getAttribute('srcset')).length,
      objectFit: imgs.reduce((acc, i) => { const f = getComputedStyle(i).objectFit; acc[f] = (acc[f] || 0) + 1; return acc; }, {}),
      formats: [...new Set(imgs.map((i) => (i.currentSrc || i.src || '').split('?')[0].split('.').pop().toLowerCase()).filter((x) => x && x.length < 6))].slice(0, 10),
      aspect: imgs.slice(0, 60).map((i) => { const r = i.getBoundingClientRect(); return r.height > 0 ? (r.width / r.height).toFixed(2) : null; }).filter(Boolean),
      avgBox: imgs.length ? Math.round(imgs.reduce((a, i) => { const r = i.getBoundingClientRect(); return a + r.width * r.height; }, 0) / imgs.length) : 0,
    },
    videos: Array.from(document.querySelectorAll('video')).map((v) => ({ autoplay: v.autoplay, muted: v.muted, loop: v.loop, poster: !!v.poster })),
    iframes: Array.from(document.querySelectorAll('iframe')).map((f) => clip(f.src, 100)),
    bgImages: (() => {
      let count = 0, gradients = 0;
      const urls = [];
      for (const el of scanEls) {
        const bi = getComputedStyle(el).backgroundImage;
        if (!bi || bi === 'none') continue;
        if (bi.includes('gradient')) gradients++;
        if (bi.includes('url(')) {
          count++;
          if (urls.length < 8) urls.push(clip(bi.match(/url\(["']?([^"')]+)/)?.[1] || '', 120));
        }
      }
      return { count, gradients, urls };
    })(),
  };

  // ---------- layout ----------
  const layout = { flex: 0, grid: 0, block: 0, gridCols: {}, gaps: {}, textAlign: {}, sticky: 0, fixed: 0, overflowHiddenX: 0, borderRadiusZero: 0 };
  for (const el of scanEls) {
    const s = getComputedStyle(el);
    if (s.display === 'flex' || s.display === 'inline-flex') layout.flex++;
    else if (s.display === 'grid') {
      layout.grid++;
      const gc = s.gridTemplateColumns;
      if (gc && gc !== 'none') layout.gridCols[clip(gc, 80)] = (layout.gridCols[clip(gc, 80)] || 0) + 1;
    } else layout.block++;
    if (s.gap && s.gap !== 'normal' && s.gap !== '0px') layout.gaps[s.gap] = (layout.gaps[s.gap] || 0) + 1;
    if (s.textAlign && s.textAlign !== 'start') layout.textAlign[s.textAlign] = (layout.textAlign[s.textAlign] || 0) + 1;
    if (s.position === 'sticky') layout.sticky++;
    if (s.position === 'fixed') layout.fixed++;
    if (s.overflowX === 'hidden' && el === document.body) layout.overflowHiddenX++;
  }

  // ---------- motion ----------
  const motionMap = new Map();
  const animList = [];
  for (const el of scanEls) {
    const s = getComputedStyle(el);
    const dur = s.transitionDuration;
    if (dur && dur !== '0s' && dur.split(',').some((d) => parseFloat(d) > 0)) {
      const key = `${dur.trim()}|${s.transitionTimingFunction}|${clip(s.transitionProperty, 60)}`;
      motionMap.set(key, (motionMap.get(key) || 0) + 1);
    }
    if (s.animationName && s.animationName !== 'none') {
      animList.push({ name: s.animationName, duration: s.animationDuration, timing: s.animationTimingFunction, iter: s.animationIterationCount });
    }
  }
  const w = window;
  const libs = {
    gsap: !!(w.gsap || w.ScrollTrigger), lenis: !!w.Lenis, swiper: !!w.Swiper, aos: !!w.AOS,
    jquery: !!w.jQuery, framer: !!w.__framer, three: !!w.THREE, barba: !!w.barba,
    locomotive: !!w.LocomotiveScroll, anime: !!w.anime, splide: !!w.Splide, embla: !!w.EmblaCarousel,
    elementor: !!w.elementorFrontend, wow: !!w.WOW,
  };
  const dataAttrs = {};
  for (const attr of ['data-aos', 'data-scroll', 'data-reveal', 'data-parallax', 'data-animation', 'data-sal', 'data-lenis-prevent', 'data-cursor']) {
    const n = document.querySelectorAll(`[${attr}]`).length;
    if (n) dataAttrs[attr] = n;
  }

  // ---------- a11y ----------
  const a11y = {
    lang: document.documentElement.lang || '',
    h1Count: document.querySelectorAll('h1').length,
    headingOutline: Array.from(document.querySelectorAll('h1,h2,h3')).slice(0, 40).map((h) => h.tagName.toLowerCase() + ': ' + clip(h.innerText, 70)),
    altMissing: imgs.filter((i) => !i.hasAttribute('alt')).length,
    altEmpty: imgs.filter((i) => i.getAttribute('alt') === '').length,
    images: imgs.length,
    emptyLinks: Array.from(document.querySelectorAll('a[href]')).filter((a) => !(a.innerText || '').trim() && !a.querySelector('img[alt]:not([alt=""])') && !a.getAttribute('aria-label')).length,
    emptyButtons: Array.from(document.querySelectorAll('button')).filter((b) => !(b.innerText || '').trim() && !b.getAttribute('aria-label') && !b.querySelector('img[alt],svg title')).length,
    landmarks: document.querySelectorAll('main, nav, header, footer, aside, [role="main"], [role="navigation"]').length,
    main: !!document.querySelector('main, [role="main"]'),
    skipLink: !!document.querySelector('a[href^="#main"], a[href^="#content"], .skip-link, [class*="skip"]'),
    ariaCount: document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]').length,
    labelledInputs: Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea')).filter((i) => i.getAttribute('aria-label') || i.id && document.querySelector(`label[for="${i.id}"]`)).length,
    inputs: document.querySelectorAll('input:not([type="hidden"]),select,textarea').length,
    tabbable: document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
  };

  // contrast (text vs effective background)
  const contrastSamples = [];
  const effBg = (el) => {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const s = getComputedStyle(cur);
      if (s.backgroundImage && s.backgroundImage.includes('gradient')) return null;
      const c = parseColor(s.backgroundColor);
      if (c && c.hex && c.a >= 0.85) return c;
      cur = cur.parentElement;
    }
    const body = parseColor(getComputedStyle(document.body).backgroundColor);
    if (body && body.hex && body.a >= 0.85) return body;
    return { hex: '#ffffff', a: 1 };
  };
  for (const el of textScope.slice(0, 1200)) {
    if (contrastSamples.length >= 120) break;
    if (!isVisible(el)) continue;
    const t = directText(el);
    if (!t || t.length < 3) continue;
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize) || 16;
    if (fs < 11) continue;
    const fg = parseColor(s.color);
    if (!fg || !fg.hex || fg.a < 0.6) continue;
    const bg = effBg(el);
    if (!bg || !bg.hex) continue;
    const ratio = Math.round(contrastRatio(fg.hex, bg.hex) * 100) / 100;
    contrastSamples.push({ fg: fg.hex, bg: bg.hex, ratio, size: Math.round(fs), weight: s.fontWeight, tag: el.tagName.toLowerCase(), text: t.slice(0, 50) });
  }

  // ---------- interaction / feature detection ----------
  const interactions = {
    details: document.querySelectorAll('details').length,
    roleTabs: document.querySelectorAll('[role="tab"]').length,
    roleDialogs: document.querySelectorAll('[role="dialog"], dialog').length,
    accordions: document.querySelectorAll('[class*="accordion"], [class*="faq"]').length,
    sliders: document.querySelectorAll('[class*="swiper"], [class*="slick"], [class*="slider"], [class*="carousel"], [class*="splide"]').length,
    searchInputs: document.querySelectorAll('input[type="search"], form[role="search"], [class*="search-form"]').length,
    navLinks: document.querySelectorAll('header a[href], nav a[href]').length,
    dropdowns: document.querySelectorAll('[aria-haspopup], [class*="dropdown"], [class*="sub-menu"], [class*="mega"]').length,
    floatingCta: (() => {
      const fixed = Array.from(document.querySelectorAll('body *')).filter((el) => {
        const s = getComputedStyle(el);
        return s.position === 'fixed' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().width < 320 && el.getBoundingClientRect().height > 20;
      });
      return fixed.slice(0, 8).map((el) => ({ tag: el.tagName.toLowerCase(), cls: clip(el.getAttribute('class') || '', 90), text: clip(el.innerText, 40), href: el.closest('a')?.href || '' }));
    })(),
    cookiePlatform: (() => {
      const html = document.documentElement.outerHTML.slice(0, 200000).toLowerCase();
      const checks = { onetrust: 'onetrust', cookiebot: 'cookiebot', usercentrics: 'usercentrics', borlabs: 'borlabs', complianz: 'complianz', cookieyes: 'cookieyes', elementor: 'elementor', hubspot: 'hs-script' };
      return Object.entries(checks).filter(([, v]) => html.includes(v)).map(([k]) => k);
    })(),
  };

  // ---------- infra / framework ----------
  const scriptSrcs = Array.from(document.scripts).map((s) => s.src).filter(Boolean);
  const stylesheetHrefs = Array.from(document.styleSheets).map((s) => s.href).filter(Boolean);
  const generator = document.querySelector('meta[name="generator"]')?.content || '';
  const framework = (() => {
    const s = scriptSrcs.join(' ').toLowerCase();
    const bodyCls = (document.body.className || '').toLowerCase();
    const f = [];
    if (s.includes('/_next/') || document.querySelector('#__next')) f.push('Next.js');
    if (s.includes('/_nuxt/')) f.push('Nuxt');
    if (bodyCls.includes('wp-') || s.includes('/wp-content/') || s.includes('/wp-includes/')) f.push('WordPress');
    if (s.includes('elementor') || bodyCls.includes('elementor')) f.push('Elementor');
    if (s.includes('typo3') || generator.toLowerCase().includes('typo3') || document.documentElement.innerHTML.slice(0, 4000).includes('typo3')) f.push('TYPO3');
    if (s.includes('shopify')) f.push('Shopify');
    if (s.includes('webflow')) f.push('Webflow');
    if (document.querySelector('[data-reactroot], #root') && !f.length) f.push('React SPA');
    return f;
  })();

  // ---------- IA ----------
  const navScope = document.querySelector('header, nav');
  const ia = {
    nav: navScope ? Array.from(navScope.querySelectorAll('a[href]')).slice(0, 40).map((a) => clip(a.innerText, 60)).filter(Boolean) : [],
    footer: (() => {
      const f = document.querySelector('footer');
      return f ? Array.from(f.querySelectorAll('a[href]')).slice(0, 40).map((a) => clip(a.innerText, 60)).filter(Boolean) : [];
    })(),
    h2s: Array.from(document.querySelectorAll('h2')).slice(0, 30).map((h) => clip(h.innerText, 120)),
  };

  const inlineStyleText = Array.from(document.querySelectorAll('style')).map((s) => s.textContent || '').join('\n').slice(0, 600000);

  const bodyStyle = getComputedStyle(document.body);
  const htmlStyle = getComputedStyle(document.documentElement);

  return {
    url: location.href,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    lang: document.documentElement.lang || '',
    viewportMeta: document.querySelector('meta[name="viewport"]')?.content || '',
    themeColor: document.querySelector('meta[name="theme-color"]')?.content || '',
    generator,
    ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
    doc: {
      width: VW, height: VH, scrollHeight: document.documentElement.scrollHeight, scrollY: SCROLL_Y,
      bodyBg: bodyStyle.backgroundColor, bodyColor: bodyStyle.color, bodyFont: bodyStyle.fontFamily, bodyFontSize: bodyStyle.fontSize,
      htmlFontSize: htmlStyle.fontSize, scrollBehavior: htmlStyle.scrollBehavior,
      bodyMaxWidth: bodyStyle.maxWidth, overflowX: bodyStyle.overflowX,
    },
    counts: {
      elements: allEls.length, images: imgs.length, svgs: document.querySelectorAll('svg').length,
      videos: document.querySelectorAll('video').length, iframes: document.querySelectorAll('iframe').length,
      buttons: document.querySelectorAll('button').length, links: document.querySelectorAll('a[href]').length,
      forms: document.querySelectorAll('form').length, sections: sections.length,
      divs: document.querySelectorAll('div').length,
    },
    fonts: (() => {
      try { return Array.from(document.fonts).map((f) => ({ family: f.family, weight: f.weight, style: f.style, status: f.status })); } catch (e) { return []; }
    })(),
    colors: {
      bg: Array.from(bgMap.values()).sort((a, b) => b.weight - a.weight).slice(0, 40),
      text: Array.from(textMap.values()).sort((a, b) => b.weight - a.weight).slice(0, 30),
      border: Array.from(borderMap.values()).sort((a, b) => b.weight - a.weight).slice(0, 25),
      gradient: Array.from(gradMap.values()).sort((a, b) => b.weight - a.weight).slice(0, 15),
      varColors: Array.from(varColorMap.values()).slice(0, 60),
    },
    textStyles: Array.from(tsMap.values()).sort((a, b) => b.count - a.count).slice(0, 120),
    displayHeads,
    headings,
    sections,
    containers: Array.from(contMap.values()).sort((a, b) => b.count - a.count).slice(0, 14),
    components: {
      buttons: Array.from(btnMap.values()).sort((a, b) => b.count - a.count).slice(0, 25),
      cards: Array.from(cardMap.values()).sort((a, b) => b.count - a.count).slice(0, 20),
      navs,
      badges: Array.from(badgeSeen.values()).sort((a, b) => b.count - a.count).slice(0, 15),
      inputs,
      links: linkStyles,
    },
    layout,
    motion: {
      transitions: Array.from(motionMap.entries()).map(([k, count]) => {
        const [duration, timing, property] = k.split('|');
        return { duration, timing, property, count };
      }).sort((a, b) => b.count - a.count).slice(0, 20),
      animations: animList.slice(0, 25),
      libs,
      dataAttrs,
    },
    media,
    a11y: { ...a11y, contrast: contrastSamples },
    interactions,
    // api
    framework,
    scripts: { total: scriptSrcs.length, srcs: scriptSrcs.slice(0, 120) },
    stylesheetHrefs,
    inlineStyleText,
    ia,
  };
}
