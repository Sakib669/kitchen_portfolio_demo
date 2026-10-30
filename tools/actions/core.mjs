// Core runtime-observation helpers for functional reverse engineering.
// Evidence classes used throughout: OBSERVED (executed/screenshot/network),
// INFERRED (from markup/CSS/behaviour pattern), UNKNOWN (not exercised).
import fs from 'node:fs/promises';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// ---------------------------------------------------------------- network
export function attachNetwork(context, state) {
  context.on('request', (req) => {
    const rec = {
      id: state.reqSeq++,
      flow: state.currentFlow,
      ts: Date.now() - state.startedAt,
      url: req.url(),
      method: req.method(),
      type: req.resourceType(),
      status: null,
      postData: null,
    };
    if (rec.method !== 'GET' && rec.method !== 'HEAD') {
      try { rec.postData = (req.postData() || '').slice(0, 400); } catch {}
    }
    state.requests.push(rec);
    state.reqIndex.set(req, rec);
    if (state.requests.length > 6000) state.requests.splice(0, 1000);
  });
  context.on('response', (res) => {
    const rec = state.reqIndex.get(res.request());
    if (rec) rec.status = res.status();
  });
  context.on('requestfailed', (req) => {
    const rec = state.reqIndex.get(req);
    if (rec) { rec.status = 'FAILED'; rec.failure = req.failure()?.errorText || ''; }
  });
}

export function requestsSince(ctx, sinceId) {
  return ctx.state.requests.filter((r) => r.id >= sinceId);
}

export function xhrSince(ctx, sinceId) {
  return requestsSince(ctx, sinceId).filter((r) => ['xhr', 'fetch', 'document', 'websocket', 'eventsource'].includes(r.type) || r.method !== 'GET');
}

// Block actual writes (form submissions) while still recording the attempted payload.
export async function guardWrites(context, state) {
  await context.route('**/*', async (route) => {
    const req = route.request();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method())) {
      state.blockedWrites.push({
        flow: state.currentFlow,
        url: req.url(),
        method: req.method(),
        postData: (() => { try { return (req.postData() || '').slice(0, 800); } catch { return null; } })(),
      });
      await route.abort('blockedbyclient').catch(() => {});
      return;
    }
    await route.continue().catch(() => {});
  });
}

// ---------------------------------------------------------------- page env
export async function collectEnv(page) {
  return page.evaluate(() => {
    const vis = (el) => {
      try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); }
    };
    const nameOf = (el) => (
      el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.value || el.alt || el.getAttribute('placeholder') || el.id || ''
    ).replace(/\s+/g, ' ').trim().slice(0, 120);

    const hiddenAncestor = (el) => {
      let cur = el.parentElement;
      while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return true;
        if (cur.getAttribute('aria-hidden') === 'true' || cur.hasAttribute('inert')) return true;
        if (cs.pointerEvents === 'none' && cur !== document.documentElement) {
          // closed mega-menu panels are often pointer-events:none while still painted
          const r = cur.getBoundingClientRect();
          if (r.height > 50) return true;
        }
        cur = cur.parentElement;
      }
      return false;
    };
    const sels = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="switch"], [aria-haspopup], [aria-expanded], [onclick], video, audio, iframe';
    const interactives = [];
    const seen = new Set();
    for (const el of document.querySelectorAll(sels)) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (!vis(el)) continue;
      if (hiddenAncestor(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || '';
      const type = el.getAttribute('type') || '';
      let cat = 'other';
      if (tag === 'a' || role === 'link') cat = 'link';
      else if (tag === 'button' || role === 'button') cat = 'button';
      else if (tag === 'input' && ['submit', 'button', 'reset', 'image'].includes(type)) cat = 'button';
      else if (tag === 'input' || tag === 'select' || tag === 'textarea') cat = 'field';
      else if (tag === 'summary') cat = 'disclosure';
      else if (['tab', 'menuitem', 'switch'].includes(role)) cat = role;
      else if (tag === 'video' || tag === 'audio') cat = 'media';
      else if (tag === 'iframe') cat = 'iframe';
      interactives.push({
        cat,
        tag,
        role,
        type,
        text: nameOf(el).slice(0, 100),
        href: tag === 'a' ? el.href : '',
        id: el.id || '',
        name: el.getAttribute('name') || '',
        cls: String(el.className || '').slice(0, 120),
        ariaExpanded: el.getAttribute('aria-expanded'),
        ariaHaspopup: el.getAttribute('aria-haspopup'),
        ariaControls: el.getAttribute('aria-controls'),
        disabled: !!(el.disabled || el.getAttribute('aria-disabled') === 'true'),
        inHeader: !!el.closest('header, nav, [class*="header" i]'),
        inFooter: !!el.closest('footer, [class*="footer" i]'),
        box: { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      });
      if (interactives.length >= 900) break;
    }

    // forms
    const forms = [...document.forms].map((f) => ({
      action: f.getAttribute('action') || location.href,
      method: (f.getAttribute('method') || 'get').toUpperCase(),
      id: f.id || '',
      cls: String(f.className || '').slice(0, 140),
      framework: (() => {
        const h = f.outerHTML.slice(0, 3000);
        if (/elementor/i.test(h + f.className)) return 'Elementor Form';
        if (/wpcf7/.test(h)) return 'Contact Form 7';
        if (/wpforms/.test(h)) return 'WPForms';
        if (/gform/.test(h)) return 'Gravity Forms';
        if (/hs-form/.test(h)) return 'HubSpot';
        if (/mktoForm/.test(h)) return 'Marketo';
        return 'custom/unknown';
      })(),
      fields: [...f.elements].filter((el) => el.tagName && !['FIELDSET', 'BUTTON'].includes(el.tagName)).map((el) => {
        const label = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
        return {
          tag: el.tagName.toLowerCase(),
          type: el.type || '',
          name: el.name || '',
          id: el.id || '',
          placeholder: el.getAttribute('placeholder') || '',
          required: !!el.required,
          pattern: el.getAttribute('pattern') || '',
          minLength: el.getAttribute('minlength') || '',
          maxLength: el.getAttribute('maxlength') || '',
          autocomplete: el.getAttribute('autocomplete') || '',
          label: (label?.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          options: el.tagName === 'SELECT' ? [...el.options].map((o) => `${o.value}:${o.text}`.slice(0, 60)) : undefined,
          disabled: !!el.disabled,
        };
      }),
      submits: [...f.querySelectorAll('button, input[type="submit"]')].map((b) => ({
        text: nameOf(b), type: b.type || '', name: b.name || '', disabled: !!b.disabled,
      })),
      hidden: [...f.querySelectorAll('input[type="hidden"]')].map((i) => ({ name: i.name, value: (i.value || '').slice(0, 120) })),
      hasFile: !!f.querySelector('input[type="file"]'),
      hasConsent: !!f.querySelector('input[type="checkbox"]'),
    }));

    // link graph
    const links = new Map();
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.href;
      if (!href || href.startsWith('javascript:')) continue;
      const key = href;
      const e = links.get(key) || { href, text: nameOf(a).slice(0, 90), count: 0, internal: href.startsWith(location.origin), kind: 'page' };
      e.count++;
      if (/\.pdf($|\?)/i.test(href)) e.kind = 'pdf';
      else if (/\.(zip|docx?|xlsx?|pptx?)($|\?)/i.test(href)) e.kind = 'download';
      else if (href.startsWith('mailto:')) e.kind = 'mailto';
      else if (href.startsWith('tel:')) e.kind = 'tel';
      else if (!href.startsWith(location.origin) && !href.startsWith('mailto:') && !href.startsWith('tel:')) e.kind = 'external';
      links.set(key, e);
    }

    const iframes = [...document.querySelectorAll('iframe')].map((f) => ({ src: f.src, title: f.title || '', id: f.id || '', allow: (f.getAttribute('allow') || '').slice(0, 120) }));
    const videos = [...document.querySelectorAll('video')].map((v) => ({
      src: v.currentSrc || v.src, poster: !!v.poster, autoplay: v.autoplay, muted: v.muted, loop: v.loop, controls: v.controls,
      sources: [...v.querySelectorAll('source')].map((s) => s.src),
    }));
    const scripts = [...document.scripts].map((s) => s.src).filter(Boolean);
    const stylesheets = [...document.styleSheets].map((s) => s.href).filter(Boolean);

    const largeVisible = [...document.querySelectorAll('[class*="menu" i], [class*="dropdown" i], [class*="megamenu" i], [class*="mega" i], [role="menu"]')]
      .filter(vis).length;

    const sticky = [...document.querySelectorAll('*')].filter((el) => {
      const s = getComputedStyle(el);
      return (s.position === 'sticky' || s.position === 'fixed') && el.getBoundingClientRect().width > 200;
    }).slice(0, 20).map((el) => ({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 90), pos: getComputedStyle(el).position, h: Math.round(el.getBoundingClientRect().height) }));

    return {
      url: location.href,
      title: document.title,
      lang: document.documentElement.lang,
      viewport: { w: innerWidth, h: innerHeight },
      header: (() => {
        const cands = [...document.querySelectorAll('header, [class*="header" i], [class*="navbar" i], nav')].filter(vis);
        const scored = cands.map((el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          const navLinks = el.querySelectorAll('a[href], button').length;
          return { el, r, s, navLinks, score: (r.width > innerWidth * 0.6 ? 100 : 0) + (r.top < 120 ? 60 : 0) + Math.min(navLinks, 20) * 2 + (r.height < 300 ? 20 : 0) };
        }).filter((x) => x.r.height >= 30 && x.r.width >= innerWidth * 0.4 && x.r.top < 200)
          .sort((a, b) => b.score - a.score);
        const best = scored[0];
        if (!best) return null;
        return { tag: best.el.tagName.toLowerCase(), h: Math.round(best.r.height), pos: best.s.position, bg: best.s.backgroundColor, top: Math.round(best.r.top), cls: String(best.el.className || '').slice(0, 90), navLinks: best.navLinks };
      })(),
      sticky,
      counts: {
        interactives: interactives.length,
        links: document.querySelectorAll('a[href]').length,
        uniqueLinks: links.size,
        buttons: document.querySelectorAll('button, [role="button"]').length,
        forms: forms.length,
        fields: document.querySelectorAll('input,select,textarea').length,
        iframes: iframes.length,
        videos: videos.length,
        svgs: document.querySelectorAll('svg').length,
        ariaExpanded: document.querySelectorAll('[aria-expanded]').length,
        ariaHaspopup: document.querySelectorAll('[aria-haspopup]').length,
        details: document.querySelectorAll('details').length,
        roleTab: document.querySelectorAll('[role="tab"]').length,
        dialogs: document.querySelectorAll('[role="dialog"], dialog').length,
        scripts: document.scripts.length,
      },
      interactives,
      forms,
      links: [...links.values()].sort((a, b) => b.count - a.count).slice(0, 500),
      iframes,
      videos,
      scripts: scripts.slice(0, 200),
      stylesheets: stylesheets.slice(0, 40),
      largeVisibleMenuEls: largeVisible,
      htmlSnippet: document.documentElement.outerHTML.length,
    };
  });
}

export async function collectStorage(context, page) {
  const cookies = await context.cookies().catch(() => []);
  const web = await page.evaluate(async () => {
    const dump = (store) => {
      const out = {};
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        const v = store.getItem(k) ?? '';
        out[k] = v.slice(0, 400);
      }
      return out;
    };
    let idb = [];
    try { idb = (await indexedDB.databases?.())?.map((d) => d.name) || []; } catch {}
    return { local: dump(localStorage), session: dump(sessionStorage), indexedDB: idb };
  }).catch(() => ({ local: {}, session: {}, indexedDB: [] }));
  return {
    cookies: cookies.map((c) => ({ name: c.name, domain: c.domain, path: c.path, expires: c.expires, httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite, value: String(c.value).slice(0, 120) })),
    ...web,
  };
}

// ---------------------------------------------------------------- state + shots
export async function snapshot(page) {
  return page.evaluate(() => {
    const vis = (el) => {
      try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); }
    };
    const txt = (el, n = 120) => (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, n);
    const overlays = [];
    for (const el of document.querySelectorAll('[role="dialog"], dialog, [class*="modal" i], [class*="popup" i], [class*="lightbox" i], [class*="overlay" i], [class*="drawer" i], [class*="offcanvas" i], [id*="mmenu"]')) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 200 || r.height < 120) continue;
      const st = getComputedStyle(el);
      const isLayer = el.tagName === 'DIALOG' || el.getAttribute('role') === 'dialog' || ['fixed', 'absolute'].includes(st.position);
      if (!isLayer) continue;
      if (st.pointerEvents === 'none') continue;
      overlays.push({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 100), w: Math.round(r.width), h: Math.round(r.height), text: txt(el, 160) });
    }
    const expanded = [];
    for (const el of document.querySelectorAll('[aria-expanded]')) {
      if (!vis(el)) continue;
      expanded.push({ text: txt(el, 70), state: el.getAttribute('aria-expanded'), controls: el.getAttribute('aria-controls') || '' });
    }
    const panels = [];
    for (const el of document.querySelectorAll('[class*="megamenu" i], [class*="mega-menu" i], [class*="dropdown" i], [class*="submenu" i], [role="menu"], .mm-panel, .elementor-nav-menu--dropdown')) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 60 || r.width < 150) continue;
      panels.push({ cls: String(el.className || '').slice(0, 90), w: Math.round(r.width), h: Math.round(r.height), links: el.querySelectorAll('a[href]').length, text: txt(el, 120) });
    }
    const active = document.activeElement;
    const focusStyle = active && active !== document.body ? (() => {
      const s = getComputedStyle(active);
      return { tag: active.tagName.toLowerCase(), name: txt(active, 60), outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor, boxShadow: s.boxShadow.slice(0, 80) };
    })() : null;
    return {
      url: location.href,
      title: document.title,
      scrollY: Math.round(scrollY),
      bodyOverflow: getComputedStyle(document.body).overflow,
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      bodyClass: String(document.body.className || '').slice(0, 160),
      overlays,
      expanded: expanded.slice(0, 25),
      panels,
      focus: focusStyle,
      dialogs: document.querySelectorAll('[role="dialog"], dialog').length,
      visibleTextStart: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 260),
    };
  }).catch((e) => ({ error: e.message }));
}

export async function shot(ctx, name, opts = {}) {
  const file = path.join(ctx.dir, 'shots', `${ctx.state.currentFlow}-${name}.${opts.jpg ? 'jpg' : 'png'}`);
  await ensureDir(path.dirname(file));
  try {
    await ctx.page.screenshot({ path: file, fullPage: !!opts.fullPage, type: opts.jpg ? 'jpeg' : 'png', quality: opts.jpg ? 82 : undefined, timeout: 20000 });
    ctx.shots.push(file);
    return path.relative(path.dirname(path.dirname(ctx.dir)), file);
  } catch (e) {
    ctx.shots.push(file + ' (failed)');
    return null;
  }
}

// ---------------------------------------------------------------- interactions
export async function visibleElements(page, selector, limit = 40) {
  const out = [];
  for (const h of await page.$$(selector)) {
    if (out.length >= limit) break;
    try {
      if (!(await h.isVisible())) continue;
      const box = await h.boundingBox();
      if (!box || box.width < 8 || box.height < 8) continue;
      const meta = await h.evaluate((el) => ({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 90),
        id: el.id || '',
        cls: String(el.className || '').slice(0, 100),
        ariaExpanded: el.getAttribute('aria-expanded'),
        href: el.tagName === 'A' ? el.href : '',
      }));
      out.push({ handle: h, box, ...meta });
    } catch {}
  }
  return out;
}

export async function safeClick(h, opts = {}) {
  try { await h.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {}); } catch {}
  try { await h.click({ timeout: opts.timeout || 4000, force: !!opts.force }); return true; } catch {
    try { await h.evaluate((el) => el.click()); return true; } catch { return false; }
  }
}

export async function safeHover(h, opts = {}) {
  try { await h.hover({ timeout: opts.timeout || 4000, force: !!opts.force }); return true; } catch { return false; }
}

export async function pressEscape(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(350);
}

export async function clickBody(page) {
  await page.mouse.click(5, 5).catch(() => {});
  await sleep(300);
}

export async function visibleDialogInfo(page) {
  return page.evaluate(() => {
    const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
    const d = [...document.querySelectorAll('[role="dialog"], dialog, [class*="modal" i], [class*="popup" i], [class*="lightbox" i]')]
      .filter((el) => vis(el) && el.getBoundingClientRect().width > 200 && el.getBoundingClientRect().height > 100)
      .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))[0];
    if (!d) return null;
    return { cls: String(d.className || '').slice(0, 100), w: Math.round(d.getBoundingClientRect().width), h: Math.round(d.getBoundingClientRect().height), text: (d.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120) };
  }).catch(() => null);
}

// Close marketing popups so a flow can exercise the page underneath.
// Consent banners are left alone (flows that need them pass keepOverlays).
export async function closePromo(page) {
  for (let i = 0; i < 2; i++) {
    const dlg = await visibleDialogInfo(page);
    if (!dlg) break;
    if (/cookie|consent|privacy|akzept|zustimm/i.test(dlg.text + dlg.cls)) break;
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(600);
    if (await visibleDialogInfo(page)) {
      const btn = await page.$('[role="dialog"] button[aria-label*="close" i], [role="dialog"] button[class*="close" i], [class*="modal" i] button[class*="close" i], [class*="popup" i] button[class*="close" i], button[aria-label="Close"]');
      if (btn && (await btn.isVisible().catch(() => false))) { await btn.click({ timeout: 2000 }).catch(() => {}); await sleep(700); }
    }
  }
  await page.evaluate(() => { document.body.style.overflow = ''; document.documentElement.style.overflow = ''; }).catch(() => {});
}

export async function goHome(ctx, opts = {}) {
  await ctx.page.goto(ctx.site.base + (ctx.site.homePath || '/'), { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await ctx.page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
  await sleep(ctx.site.settle || 1200);
  if (!opts.keepOverlays) await closePromo(ctx.page);
}

export async function go(ctx, url, settle = 1200, opts = {}) {
  await ctx.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await ctx.page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
  await sleep(settle);
  if (!opts.keepOverlays) await closePromo(ctx.page);
}

export async function acceptCookies(page, selectors = []) {
  const candidates = [
    ...selectors,
    '#onetrust-accept-btn-handler',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    '#SgCookieOptin .sg-cookie-optin-box-button button',
    'button[data-testid="uc-accept-all-button"]',
    '.cm-btn-accept-all',
    'button[class*="accept" i]',
    '[class*="cookie" i] button[class*="accept" i]',
  ];
  for (const sel of candidates) {
    try {
      const el = await page.$(sel);
      if (el && (await el.isVisible())) { await el.click({ timeout: 2500 }); await sleep(900); return { clicked: sel }; }
    } catch {}
  }
  for (const label of ['Accept all', 'ACCEPT', 'Accept', 'Allow all', 'Alle akzeptieren', 'I agree', 'Got it', 'OK', 'Close']) {
    try {
      const btn = page.getByRole('button', { name: label, exact: false }).first();
      if (await btn.isVisible({ timeout: 500 })) { await btn.click({ timeout: 2000 }); await sleep(900); return { clicked: `text:${label}` }; }
    } catch {}
  }
  return { clicked: null };
}

export async function dismissOverlays(page) {
  await pressEscape(page);
  const removed = await page.evaluate(() => {
    const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
    let n = 0;
    for (const sel of ['[role="dialog"]', 'dialog', '[class*="modal" i]', '[class*="popup" i]', '[class*="overlay" i]', '[class*="lightbox" i]']) {
      for (const el of document.querySelectorAll(sel)) {
        if (!vis(el)) continue;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (s.position !== 'fixed' && s.position !== 'absolute') continue;
        if (r.width < 150 || r.height < 100) continue;
        if (el.closest('header, nav, main, footer')) continue;
        el.remove(); n++;
      }
    }
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.classList.remove('modal-open', 'no-scroll', 'overflow-hidden', 'mmenu-opened', 'mm-opened');
    return n;
  }).catch(() => 0);
  return removed;
}

// find elements that became visible after an action (menus/dialogs) and summarise
export async function visibleNewPanels(page, before) {
  return page.evaluate((beforeOverlayCount) => {
    const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
    const txt = (el, n = 200) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, n);
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 280 || r.height < 90) continue;
      const s = getComputedStyle(el);
      if (!['absolute', 'fixed', 'sticky'].includes(s.position) && !/(menu|dropdown|mega|panel|dialog|popup|modal|drawer)/i.test(String(el.className))) continue;
      if (el.closest('header nav > ul') && r.height < 120) continue;
      if (s.pointerEvents === 'none') continue;
      if (/gradient|inset-0|backdrop|scrim/i.test(String(el.className)) && el.querySelectorAll('a[href]').length === 0) continue;
      const links = [...el.querySelectorAll('a[href]')].map((a) => ({ text: (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), href: a.href })).filter((l) => l.text).slice(0, 40);
      if (links.length === 0 && !/(menu|dropdown|mega|panel|dialog|popup|drawer)/i.test(String(el.className))) continue;
      out.push({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 120), w: Math.round(r.width), h: Math.round(r.height), z: s.zIndex, text: txt(el, 200), links: links.length, linkList: links, display: s.display });
      if (out.length >= 8) break;
    }
    return out;
  }, before);
}

export async function hoverStyleDiff(page, handle) {
  try {
    const read = () => handle.evaluate((el) => {
      const s = getComputedStyle(el);
      const keys = ['color', 'backgroundColor', 'backgroundImage', 'borderColor', 'borderWidth', 'borderRadius', 'boxShadow', 'transform', 'opacity', 'textDecorationLine', 'letterSpacing', 'filter', 'scale'];
      const o = {};
      for (const k of keys) o[k] = s[k];
      return o;
    });
    const before = await read();
    await handle.hover({ timeout: 3000 });
    await sleep(450);
    const after = await read();
    const diff = {};
    for (const k of Object.keys(before)) if (before[k] !== after[k]) diff[k] = { before: before[k], after: after[k] };
    return { hovered: true, diff, before, after };
  } catch (e) {
    return { hovered: false, error: e.message };
  }
}

export function summariseNetwork(requests) {
  const byDomain = {};
  const byType = {};
  const nonGet = [];
  for (const r of requests) {
    let host = '';
    try { host = new URL(r.url).hostname; } catch {}
    byDomain[host] = (byDomain[host] || 0) + 1;
    byType[r.type] = (byType[r.type] || 0) + 1;
    if (r.method !== 'GET' && r.method !== 'HEAD') nonGet.push(r);
  }
  return {
    total: requests.length,
    byDomain: Object.entries(byDomain).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([domain, count]) => ({ domain, count })),
    byType: Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count })),
    nonGet: nonGet.slice(0, 60),
  };
}

export const KNOWN_TP = {
  'googletagmanager.com': 'Google Tag Manager', 'google-analytics.com': 'Google Analytics', 'analytics.google.com': 'Google Analytics 4',
  'gstatic.com': 'Google static', 'fonts.googleapis.com': 'Google Fonts', 'fonts.gstatic.com': 'Google Fonts', 'doubleclick.net': 'Google Ads',
  'facebook.net': 'Meta Pixel', 'connect.facebook.net': 'Meta Pixel', 'hotjar.com': 'Hotjar', 'clarity.ms': 'Microsoft Clarity',
  'tiktok.com': 'TikTok', 'linkedin.com': 'LinkedIn', 'snap.licdn.com': 'LinkedIn Insight', 'youtube.com': 'YouTube', 'youtu.be': 'YouTube',
  'vimeo.com': 'Vimeo', 'player.vimeo.com': 'Vimeo', 'tidio.co': 'Tidio chat', 'tidiochat.com': 'Tidio chat', 'intercom.io': 'Intercom',
  'crisp.chat': 'Crisp', 'tawk.to': 'Tawk.to', 'zendesk.com': 'Zendesk', 'hubspot.com': 'HubSpot', 'hs-scripts.com': 'HubSpot',
  'cookiebot.com': 'Cookiebot', 'onetrust.com': 'OneTrust', 'usercentrics.eu': 'Usercentrics', 'borlabs.io': 'Borlabs',
  'cloudflare.com': 'Cloudflare', 'cloudflareinsights.com': 'Cloudflare Analytics', 'jsdelivr.net': 'jsDelivr CDN', 'unpkg.com': 'unpkg CDN',
  'google.com': 'Google', 'googleapis.com': 'Google APIs', 'gmail.com': 'Google', 'bing.com': 'Bing', 'clarity.microsoft.com': 'Microsoft Clarity',
  'elementor.com': 'Elementor', 'wp.com': 'WordPress.com', 'gravatar.com': 'Gravatar', 'maps.googleapis.com': 'Google Maps',
  'recaptcha.net': 'reCAPTCHA', 'google.com/recaptcha': 'reCAPTCHA',
  'script.hotjar.com': 'Hotjar', 'static.hotjar.com': 'Hotjar', 'www.clarity.ms': 'Microsoft Clarity',
  'scripts.clarity.ms': 'Microsoft Clarity', 'googleads.g.doubleclick.net': 'Google Ads',
  'static.elfsight.com': 'Elfsight widgets', 'apps.elfsight.com': 'Elfsight widgets',
  'px.ads.linkedin.com': 'LinkedIn Ads', 'www.facebook.com': 'Meta', 'www.google.com': 'Google',
  'www.googletagmanager.com': 'Google Tag Manager', 'bzr.openai.com': 'OpenAI SDK (chat/AI)',
  'bzrcdn.openai.com': 'OpenAI SDK (chat/AI)', 'assets.apollo.io': 'Apollo',
};
