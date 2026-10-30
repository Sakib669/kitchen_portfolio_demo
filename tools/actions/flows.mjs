// Generic functional-observation flows. Every flow records steps, screenshots,
// network requests and blocked writes; no real form submission is ever sent.
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  sleep, ensureDir, goHome, go, collectEnv, collectStorage, snapshot, shot,
  visibleElements, safeClick, safeHover, pressEscape, clickBody, acceptCookies,
  dismissOverlays, visibleNewPanels, hoverStyleDiff, summariseNetwork, requestsSince, xhrSince, KNOWN_TP,
} from './core.mjs';

async function findFirst(page, selectors, opts = {}) {
  for (const sel of selectors) {
    try {
      const els = await visibleElements(page, sel, 80);
      for (const el of els) {
        if (opts.text && !new RegExp(opts.text, 'i').test(el.text)) continue;
        if (opts.excludeText && new RegExp(opts.excludeText, 'i').test(el.text)) continue;
        return el;
      }
    } catch {}
  }
  return null;
}

async function topNavTriggers(page, cfg) {
  if (!cfg.topNavTexts?.length) return [];
  return page.evaluate((texts) => {
    const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
    const hiddenAncestor = (el) => {
      let cur = el.parentElement;
      while (cur && cur !== document.body) {
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return true;
        if (cur.getAttribute('aria-hidden') === 'true' || cur.hasAttribute('inert')) return true;
        cur = cur.parentElement;
      }
      return false;
    };
    const cands = [...document.querySelectorAll('header a, header button, header span, header li, header [role="button"], nav a, nav button, nav span, nav li')]
      .filter((el) => vis(el) && !hiddenAncestor(el))
      .map((el) => ({ el, r: el.getBoundingClientRect(), t: (el.innerText || '').replace(/\s+/g, ' ').trim() }))
      .filter((x) => x.t && x.t.length <= 80 && x.r.top < 300 && x.r.width >= 20);
    const groups = new Map();
    for (const c of cands) {
      const hit = texts.find((x) => c.t.toLowerCase().startsWith(x.toLowerCase()));
      if (!hit) continue;
      const key = hit.toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    }
    const out = [];
    for (const [, arr] of groups) {
      arr.sort((a, b) => {
        const score = (x) => {
          let sc = 0;
          if (x.el.hasAttribute('aria-expanded')) sc += 100;
          if (x.el.tagName === 'BUTTON') sc += 50;
          if (x.el.getAttribute('role') === 'button') sc += 40;
          if (x.el.tagName === 'LI' && x.el.hasAttribute('tabindex')) sc += 30;
          if (x.el.tagName === 'LI') sc += 10;
          sc += Math.min(x.r.width, 400) / 100;
          return sc;
        };
        return score(b) - score(a);
      });
      const pick = arr[0];
      out.push({
        index: out.length, text: pick.t.slice(0, 80), tag: pick.el.tagName.toLowerCase(),
        href: pick.el.tagName === 'A' ? pick.el.href : '', hasAria: pick.el.hasAttribute('aria-expanded'),
        box: { x: Math.round(pick.r.x), y: Math.round(pick.r.y), w: Math.round(pick.r.width), h: Math.round(pick.r.height) },
      });
    }
    return out;
  }, cfg.topNavTexts);
}

async function clickNthVisible(page, selector, index) {
  const els = await visibleElements(page, selector, 60);
  const el = els[index];
  if (!el) return null;
  const ok = await safeClick(el.handle);
  return ok ? el : null;
}

async function readCarouselState(page) {
  return page.evaluate(() => {
    const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
    const txt = (el, n = 140) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, n);
    const active = [];
    for (const sel of ['.swiper-slide-active', '.slick-active', '[aria-selected="true"]', '.active', '[data-active="true"]', '.carousel-item.active', '.is-active']) {
      for (const el of document.querySelectorAll(sel)) {
        if (!vis(el)) continue;
        const t = txt(el);
        if (t && t.length > 2) active.push({ sel, text: t, cls: String(el.className || '').slice(0, 80) });
      }
    }
    const tracks = [...document.querySelectorAll('.swiper-wrapper, [class*="carousel" i] > div, [class*="track" i]')].slice(0, 6).map((el) => ({ cls: String(el.className || '').slice(0, 70), transform: getComputedStyle(el).transform, width: Math.round(el.getBoundingClientRect().width) }));
    const dots = [...document.querySelectorAll('.swiper-pagination-bullet, [class*="dot" i], [role="tablist"] [role="tab"]')].slice(0, 12).map((d) => ({ cls: String(d.className || '').slice(0, 60), active: d.getAttribute('aria-selected') === 'true' || /active/i.test(d.className) }));
    const headings = [...document.querySelectorAll('h1,h2')].filter(vis).slice(0, 4).map((h) => txt(h, 100));
    const images = [...document.querySelectorAll('img')].filter((i) => vis(i) && i.getBoundingClientRect().top < 980).map((i) => (i.currentSrc || i.src).split('?')[0].split('/').pop().slice(0, 70)).slice(0, 8);
    const heroText = [...document.querySelectorAll('*')].filter((el) => {
      if (!vis(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.top > 980 || r.height < 20) return false;
      const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
      if (fs < 26) return false;
      const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
      return t.length > 3 && el.children.length <= 4;
    }).map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80)).slice(0, 6);
    const slideEls = [...document.querySelectorAll('[class*="slide" i], [class*="swiper-slide" i], [role="group"]')].filter(vis).length;
    return { active: active.slice(0, 8), tracks, dots, headings, images, heroText, slideEls };
  }).catch((e) => ({ error: e.message }));
}

function diffCarousel(a, b) {
  const changes = {};
  if (!a || !b) return changes;
  if (JSON.stringify(a.headings) !== JSON.stringify(b.headings)) changes.headings = { before: a.headings, after: b.headings };
  if (JSON.stringify(a.active) !== JSON.stringify(b.active)) changes.active = { before: a.active?.map((x) => x.text), after: b.active?.map((x) => x.text) };
  if (JSON.stringify(a.tracks) !== JSON.stringify(b.tracks)) changes.tracks = true;
  if (JSON.stringify(a.dots) !== JSON.stringify(b.dots)) changes.dots = true;
  return changes;
}

// ------------------------------------------------------------------ flows
export const flows = {
  async baseline(ctx) {
    await goHome(ctx);
    await sleep(1200);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(700);
    await shot(ctx, 'home');
    const env = await collectEnv(ctx.page);
    const storage = await collectStorage(ctx.context, ctx.page);
    await ctx.step('loaded', { url: env.url, title: env.title, counts: env.counts, header: env.header });
    await ctx.step('interactives', {
      total: env.interactives.length,
      byCat: env.interactives.reduce((a, i) => { a[i.cat] = (a[i.cat] || 0) + 1; return a; }, {}),
      top: env.interactives.slice(0, 60).map((i) => `${i.cat}: ${i.text || i.tag}${i.href ? ' → ' + i.href.replace(ctx.site.base, '') : ''}`),
    });
    await ctx.step('forms', env.forms.map((f) => ({ action: f.action, method: f.method, framework: f.framework, fields: f.fields.length, submits: f.submits.map((s) => s.text) })));
    await ctx.step('embeds', { iframes: env.iframes, videos: env.videos });
    await ctx.step('storage', { cookies: storage.cookies.map((c) => c.name), local: Object.keys(storage.local), session: Object.keys(storage.session), idb: storage.indexedDB });
    await ctx.step('thirdParties', summariseNetwork(ctx.state.requests).byDomain.filter((d) => KNOWN_TP[d.domain]).map((d) => `${KNOWN_TP[d.domain]} (${d.domain})`));
    await ctx.write('baseline.json', { env, storage, network: summariseNetwork(ctx.state.requests) });
  },

  async cookie(ctx) {
    // reproduce a first visit: no cookies/local storage, then reload
    await ctx.context.clearCookies().catch(() => {});
    await goHome(ctx, { keepOverlays: true });
    await ctx.page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => {});
    await goHome(ctx, { keepOverlays: true });
    await sleep(2800);
    const before = await collectStorage(ctx.context, ctx.page);
    const banner = await findFirst(ctx.page, ctx.site.cookieBanner || [], {});
    await ctx.step('bannerDetected', { found: !!banner, element: banner ? { text: banner.text, cls: banner.cls } : null });
    await shot(ctx, 'banner');
    const buttons = await ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
      const out = [];
      for (const el of document.querySelectorAll('button, a[href], [role="button"], input[type="submit"], input[type="button"]')) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 15 || r.height < 10) continue;
        const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        if (!text) continue;
        if (!/accept|agree|allow|akzept|zustimm|consent|reject|decline|save|settings|necessary|ok|close|×/i.test(text)) continue;
        out.push({ tag: el.tagName.toLowerCase(), text: text.slice(0, 60), cls: String(el.className || '').slice(0, 70) });
        if (out.length >= 20) break;
      }
      return out;
    });
    await ctx.step('consentControls', buttons);
    const clicked = await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(1200);
    await shot(ctx, 'after');
    const after = await collectStorage(ctx.context, ctx.page);
    const newCookies = after.cookies.filter((c) => !before.cookies.some((b) => b.name === c.name));
    await ctx.step('accepted', { clicked, newCookies: newCookies.map((c) => c.name), localDelta: Object.keys(after.local).filter((k) => !(k in before.local)), sessionDelta: Object.keys(after.session).filter((k) => !(k in before.session)) });
    await goHome(ctx, { keepOverlays: true });
    await sleep(800);
    const overlays = await snapshot(ctx.page);
    await ctx.step('afterReload', { cookieOverlaysVisible: overlays.overlays?.length || 0, localKeys: Object.keys((await collectStorage(ctx.context, ctx.page)).local) });
  },

  async scroll(ctx) {
    await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(600);
    const readHeader = () => ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
      const cands = [...document.querySelectorAll('header, [class*="header" i], [class*="navbar" i], nav')].filter(vis);
      const scored = cands.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, r, score: (r.width > innerWidth * 0.6 ? 100 : 0) + (r.top < 120 ? 60 : 0) + Math.min(el.querySelectorAll('a[href],button').length, 20) * 2 + (r.height < 300 ? 20 : 0) };
      }).filter((x) => x.r.height >= 30 && x.r.width >= innerWidth * 0.4 && x.r.top < 260).sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (!best) return null;
      const s = getComputedStyle(best.el);
      return { tag: best.el.tagName.toLowerCase(), cls: String(best.el.className || '').slice(0, 80), pos: s.position, top: Math.round(best.r.top), h: Math.round(best.r.height), bg: s.backgroundColor, shadow: s.boxShadow.slice(0, 60) };
    });
    const top = await readHeader();
    await ctx.step('atTop', top);
    await ctx.page.evaluate(() => window.scrollTo(0, 900));
    await sleep(900);
    const scrolled = await ctx.page.evaluate(() => {
      const fixed = [...document.querySelectorAll('body *')].filter((el) => {
        try { if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false; } catch { return false; }
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.position === 'fixed' && r.width > 120 && r.width < 420 && r.height > 24;
      }).slice(0, 10).map((el) => ({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 70), text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40), pos: { y: Math.round(el.getBoundingClientRect().top), x: Math.round(el.getBoundingClientRect().left) } }));
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
      const hc = [...document.querySelectorAll('header, [class*="header" i], [class*="navbar" i], nav')].filter(vis).map((el) => {
        const r = el.getBoundingClientRect();
        return { el, r, score: (r.width > innerWidth * 0.6 ? 100 : 0) + (r.top < 120 ? 60 : 0) + Math.min(el.querySelectorAll('a[href],button').length, 20) * 2 + (r.height < 300 ? 20 : 0) };
      }).filter((x) => x.r.height >= 30 && x.r.width >= innerWidth * 0.4 && x.r.top < 260).sort((a, b) => b.score - a.score);
      const best = hc[0];
      const hs = best ? getComputedStyle(best.el) : null;
      return {
        header: best ? { tag: best.el.tagName.toLowerCase(), pos: hs.position, top: Math.round(best.r.top), h: Math.round(best.r.height), bg: hs.backgroundColor, shadow: hs.boxShadow.slice(0, 60) } : null,
        fixed,
        scrollY: Math.round(window.scrollY),
        toTop: [...document.querySelectorAll('[class*="to-top" i], [class*="scroll-top" i], [aria-label*="top" i], [title*="top" i]')].filter((el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return false; } }).length,
      };
    });
    await ctx.step('afterScroll', scrolled);
    await shot(ctx, 'scrolled');
    await ctx.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await sleep(800);
    await ctx.step('bottom', await ctx.page.evaluate(() => ({ scrollY: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight, footerVisible: !!document.querySelector('footer') })));
    await shot(ctx, 'bottom');
    await ctx.page.evaluate(() => window.scrollTo(0, 0));
  },

  async keyboard(ctx) {
    await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(600);
    await ctx.page.mouse.click(4, 4).catch(() => {});
    const order = [];
    for (let i = 0; i < 14; i++) {
      await ctx.page.keyboard.press('Tab');
      await sleep(120);
      const f = await ctx.page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          name: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || el.id || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`, boxShadow: s.boxShadow.slice(0, 70),
          visible: r.width > 0 && r.height > 0,
          inViewport: r.top >= 0 && r.bottom <= innerHeight,
        };
      });
      order.push(f);
    }
    await ctx.step('tabOrder', order);
    const focusVisible = order.filter((x) => x && (x.outline.includes('solid') || x.outline.includes('auto') || x.boxShadow !== 'none'));
    await ctx.step('focusIndicators', { count: focusVisible.length, first: focusVisible.slice(0, 3) });
    // keyboard-open first nav trigger if present
    let kb = null;
    if (ctx.site.topNavTexts?.length) {
      const triggers = await topNavTriggers(ctx.page, ctx.site);
      if (triggers.length) {
        await ctx.page.evaluate(() => document.querySelector('header')?.scrollIntoView());
        await ctx.page.keyboard.press('Home').catch(() => {});
        for (let i = 0; i < 10; i++) {
          await ctx.page.keyboard.press('Tab');
          await sleep(100);
          const t = await ctx.page.evaluate(() => (document.activeElement?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50));
          if (ctx.site.topNavTexts.some((x) => t.toLowerCase().startsWith(x.toLowerCase()))) {
            await ctx.page.keyboard.press('Enter');
            await sleep(800);
            const s = await snapshot(ctx.page);
            kb = { triggerText: t, expanded: s?.expanded || [], overlays: s?.overlays?.length || 0 };
            await shot(ctx, 'keyboard-open');
            await pressEscape(ctx.page);
            break;
          }
        }
      }
    }
    await ctx.step('keyboardNav', kb);
  },

  async navDesktop(ctx) {
    await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(800);
    const triggers = await topNavTriggers(ctx.page, ctx.site);
    await ctx.step('triggers', triggers);
    const opened = [];
    for (let i = 0; i < Math.min(triggers.length, 6); i++) {
      const again = await topNavTriggers(ctx.page, ctx.site);
      const t = again[i];
      if (!t) break;
      const before = await snapshot(ctx.page);
      const els = await visibleElements(ctx.page, 'header a, header button, header span, header li, nav a, nav button, nav span, nav li', 160);
      let el = els.find((e) => e.text === t.text && e.tag === t.tag);
      if (!el) el = els.find((e) => e.text === t.text);
      if (!el) el = els.find((e) => e.text.toLowerCase().startsWith(t.text.toLowerCase().slice(0, 12)));
      let method = null;
      if (el) {
        await safeHover(el.handle);
        await sleep(900);
        let after = await snapshot(ctx.page);
        if (!after.panels?.length && after.overlays.length <= before.overlays.length) {
          const ok = await safeClick(el.handle);
          if (ok) { method = 'click'; }
          await sleep(900);
          after = await snapshot(ctx.page);
        } else method = 'hover';
        const panels = await visibleNewPanels(ctx.page, before.panels?.length || 0);
        const links = await ctx.page.evaluate(() => {
          const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
          const out = [];
          for (const el of document.querySelectorAll('header *, nav *')) {
            if (!vis(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 300 || r.height < 80) continue;
            const s = getComputedStyle(el);
            if (!['absolute', 'fixed'].includes(s.position) && !/(menu|mega|dropdown|panel)/i.test(String(el.className))) continue;
            for (const a of el.querySelectorAll('a[href]')) {
              const txt = (a.innerText || '').replace(/\s+/g, ' ').trim();
              if (txt) out.push({ text: txt.slice(0, 60), href: a.href });
              if (out.length >= 40) break;
            }
            if (out.length) break;
          }
          return out;
        });
        if (method) {
          opened.push({ nav: t.text, method, urlAfter: after.url, panels: panels.map((p) => ({ cls: p.cls, w: p.w, h: p.h, links: p.links })), panelLinks: links.slice(0, 30), expanded: after.expanded?.slice(0, 8) });
          await shot(ctx, `nav-${i}-open`, { jpg: false });
        } else opened.push({ nav: t.text, method: null, note: 'no panel detected' });
      }
      await pressEscape(ctx.page);
      await clickBody(ctx.page);
      await sleep(400);
      const closed = await snapshot(ctx.page);
      if (opened.length) opened[opened.length - 1].closedAfterEscape = (closed.panels?.length || 0) === 0 && closed.overlays.length === 0;
    }
    await ctx.step('opened', opened);
  },

  async navMobile(ctx) {
    await ctx.page.setViewportSize({ width: 390, height: 844 });
    await goHome(ctx);
    await sleep(1000);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(600);
    await shot(ctx, 'home-mobile');
    const candidates = await ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
      const out = [];
      for (const el of document.querySelectorAll('header button, header a, header [role="button"], header svg, [class*="hamburger" i], [class*="burger" i], [class*="menu-toggle" i], [class*="menu-btn" i], [aria-label*="menu" i], [aria-label*="Menü" i], .mm-toggle, .navbar-toggler, [class*="menu" i] svg')) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 12 || r.height < 12 || r.top > 200) continue;
        const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
        const cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className);
        if (!/menu|menü|navigation|toggle|open|burger/i.test(text + ' ' + cls + ' ' + (el.getAttribute('aria-label') || ''))) continue;
        out.push({ tag: el.tagName.toLowerCase(), text: text.slice(0, 40), cls: String(el.className || '').slice(0, 90) });
        if (out.length >= 10) break;
      }
      return out;
    });
    await ctx.step('hamburgerCandidates', candidates);
    let opened = null;
    // generic: click each candidate until a large panel/dialog appears
    const els = await visibleElements(ctx.page, 'header button, header a, [aria-label*="menu" i], [aria-label*="Menü" i], .navbar-toggler, .mm-toggle, [class*="hamburger" i], [class*="burger" i]', 40);
    for (const el of els) {
      const before = await snapshot(ctx.page);
      if (!el.text && !/menu|burger|toggle|hamburger|nav/i.test(el.cls)) continue;
      await safeClick(el.handle);
      await sleep(900);
      const after = await snapshot(ctx.page);
      if (after.overlays.length > before.overlays.length || (after.panels?.length || 0) > (before.panels?.length || 0)) {
        opened = { trigger: { text: el.text, cls: el.cls }, state: after, panels: (await visibleNewPanels(ctx.page, before.panels?.length || 0)).map((p) => ({ cls: p.cls, w: p.w, h: p.h, links: p.links, text: p.text, linkList: p.linkList })) };
        await shot(ctx, 'menu-open');
        break;
      }
    }
    if (!opened) {
      // fallback: click the top-right icon cluster in the header (icon-only hamburgers)
      const burger = await ctx.page.evaluateHandle(() => {
        const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
        const cands = [...document.querySelectorAll('svg, button, a, [role="button"], [class*="hamburger" i], [class*="burger" i], [class*="toggle" i], [class*="menu" i]')]
          .filter(vis)
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter((c) => c.r.top < 200 && c.r.left > innerWidth * 0.55 && c.r.width > 8 && c.r.width < 140 && c.r.height > 8 && c.r.height < 140)
          .sort((a, b) => (b.r.left + b.r.top) - (a.r.left + a.r.top));
        const pick = cands[0]?.el;
        if (!pick) return null;
        return pick.closest('button, a, [role="button"]') || pick.parentElement || pick;
      }).catch(() => null);
      if (burger && (await burger.asElement()?.isVisible().catch(() => false))) {
        const before = await snapshot(ctx.page);
        await burger.asElement().click({ timeout: 3000 }).catch(() => {});
        await sleep(1000);
        const after = await snapshot(ctx.page);
        if (after.overlays.length > before.overlays.length || (after.panels?.length || 0) > (before.panels?.length || 0) || after.bodyOverflow === 'hidden') {
          opened = { trigger: { text: 'icon-fallback', cls: '' }, state: after, panels: (await visibleNewPanels(ctx.page, before.panels?.length || 0)).map((p) => ({ cls: p.cls, w: p.w, h: p.h, links: p.links, text: p.text, linkList: p.linkList })) };
          await shot(ctx, 'menu-open');
        }
      }
    }
    await ctx.step('menuOpened', opened ? { trigger: opened.trigger, overlays: opened.state.overlays?.slice(0, 3), panels: opened.panels } : { opened: false });
    // try expanding a submenu inside the open menu
    if (opened) {
      const sub = await findFirst(ctx.page, ['[class*="menu"] [aria-expanded="false"]', '[class*="menu"] button', 'nav [aria-expanded="false"]'], {});
      if (sub) { await safeClick(sub.handle); await sleep(700); await shot(ctx, 'submenu'); await ctx.step('submenu', { clicked: sub.text, state: await snapshot(ctx.page) }); }
      const menuLinks = (opened.panels || []).flatMap((p) => p.linkList || []).slice(0, 40);
      await ctx.step('menuLinks', menuLinks);
      await pressEscape(ctx.page);
      await sleep(700);
      let closed = await snapshot(ctx.page);
      if (closed.bodyOverflow === 'hidden' || closed.overlays.length) {
        // try the hamburger again / close button
        const closer = await findFirst(ctx.page, ['[aria-label*="close" i]', 'button[class*="close" i]', '[class*="hamburger" i]', '[class*="burger" i]'], {});
        if (closer) { await safeClick(closer.handle); await sleep(800); }
        closed = await snapshot(ctx.page);
      }
      await ctx.step('closed', { overlays: closed.overlays.length, bodyOverflow: closed.bodyOverflow, panels: closed.panels?.length || 0 });
    }
    await ctx.page.setViewportSize({ width: 1440, height: 900 });
  },

  async search(ctx) {
    await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(600);
    let trigger = await findFirst(ctx.page, ctx.site.searchTrigger || ['[aria-label*="search" i]', 'button[class*="search" i]', '[class*="search-toggle" i]', '.e-search-toggle', 'button:has(svg)'], { text: ctx.site.searchTriggerText || '' });
    if (trigger) {
      await safeClick(trigger.handle);
      await sleep(1800);
      if (ctx.site.afterSearchTrigger) await ctx.page.evaluate(ctx.site.afterSearchTrigger).catch(() => {});
      await ctx.step('opened', { trigger: trigger.text, state: await snapshot(ctx.page) });
      await shot(ctx, 'open');
    } else {
      await ctx.step('opened', { trigger: null, note: 'no search trigger found; trying visible search input' });
    }
    let input = await findFirst(ctx.page, ['input[type="search"]', 'form[role="search"] input', '[class*="search" i] input[type="text"]', 'input[name="s"]', 'input[name*="search" i]', '#searchbox input', '.searchbox input', 'input[name*="q"]'], {});
    if (!input) {
      for (const h of await ctx.page.$$('input:not([type="hidden"])')) {
        const box = await h.boundingBox().catch(() => null);
        if (box && box.width > 40 && (await h.isVisible().catch(() => false))) {
          input = { handle: h, text: await h.getAttribute('placeholder').catch(() => '') || 'input' };
          break;
        }
      }
    }
    if (!input) {
      await ctx.step('noInput', { note: 'no visible search input' });
      return;
    }
    const before = ctx.state.reqSeq;
    await input.handle.fill('kitchen').catch(async () => { await input.handle.click(); await ctx.page.keyboard.type('kitchen'); });
    await sleep(1400);
    const suggestions = await ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
      const out = [];
      for (const el of document.querySelectorAll('[class*="suggest" i], [class*="autocomplete" i], [class*="result" i], [role="listbox"], .e-search-results, .search-results')) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.height < 20) continue;
        out.push({ cls: String(el.className || '').slice(0, 90), text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 400) });
        if (out.length >= 3) break;
      }
      return out;
    });
    await ctx.step('typed', { value: 'kitchen', suggestions, xhr: xhrSince(ctx, before).map((r) => `${r.method} ${r.url}`).slice(0, 20) });
    await shot(ctx, 'typed');
    const urlBefore = ctx.page.url();
    await ctx.page.keyboard.press('Enter');
    await sleep(2500);
    let urlAfter = ctx.page.url();
    // some search forms navigate; wait for the new document before reading results
    await ctx.page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await sleep(1500);
    urlAfter = ctx.page.url();
    const results = await ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
      const items = [...document.querySelectorAll('main article, main li, [class*="result" i] li, [class*="search" i] article, .elementor-post')].filter(vis);
      return {
        count: items.length,
        titles: items.slice(0, 8).map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90)),
        noResults: /no results|nothing found|keine ergebnisse|0 results/i.test(document.body.innerText || ''),
        title: document.title,
      };
    }).catch((e) => ({ error: e.message }));
    await ctx.step('submitted', { urlBefore, urlAfter, results, xhr: xhrSince(ctx, before).map((r) => `${r.method} ${r.url}`).slice(0, 25), status: (await ctx.page.evaluate(() => performance.getEntriesByType('navigation')[0]?.responseStatus)).catch?.(() => null) });
    await shot(ctx, 'results');
    // gibberish search if we have a search URL pattern
    if (urlAfter !== urlBefore) {
      const u = new URL(urlAfter);
      for (const key of [...u.searchParams.keys()]) u.searchParams.set(key, 'zzqx-nonexistent-9137');
      await go(ctx, u.href, 1500);
      const empty = await ctx.page.evaluate(() => ({
        noResults: /no results|nothing found|keine ergebnisse|0 results|leider/i.test(document.body.innerText || ''),
        title: document.title,
        count: [...document.querySelectorAll('main article, [class*="result" i] li')].length,
      }));
      await ctx.step('noResults', empty);
      await shot(ctx, 'no-results');
    }
  },

  async carousel(ctx) {
    await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(800);
    const nextSels = [...(ctx.site.carouselNext || []), 'button[aria-label*="next" i]', '.swiper-button-next', '.slick-next', 'button[class*="next" i]', '[class*="carousel" i] button[class*="right" i]'];
    const prevSels = [...(ctx.site.carouselPrev || []), 'button[aria-label*="previous" i]', 'button[aria-label*="prev" i]', '.swiper-button-prev', '.slick-prev', 'button[class*="prev" i]'];
    let next = await findFirst(ctx.page, nextSels, {});
    let prev = await findFirst(ctx.page, prevSels, {});
    if (!next) next = await findFirst(ctx.page, ['button', '[role="button"]', 'a[href="#"]'], { text: 'next|weiter|suivant|siguiente' });
    if (!prev) prev = await findFirst(ctx.page, ['button', '[role="button"]', 'a[href="#"]'], { text: 'previous|prev|zurück|précédent|anterior' });
    if (!next) {
      // some carousels only reveal arrows on hover
      const hero = await findFirst(ctx.page, ['.swiper', '[class*="slider" i]', '[class*="carousel" i]', 'main section:first-of-type', 'main > div:first-child'], {});
      if (hero) { await safeHover(hero.handle); await sleep(900); }
      next = await findFirst(ctx.page, ['.swiper-nav.swiper-next', '.swiper-button-next', '.swiper-nav-next', '[class*="swiper" i] [class*="next" i]', 'button[aria-label*="next" i]', 'button[class*="next" i]'], {});
      prev = prev || await findFirst(ctx.page, ['.swiper-nav.swiper-prev', '.swiper-button-prev', '.swiper-nav-prev', '[class*="swiper" i] [class*="prev" i]', 'button[aria-label*="prev" i]'], {});
    }
    await ctx.step('controls', { next: next ? { text: next.text, cls: next.cls } : null, prev: prev ? { text: prev.text, cls: prev.cls } : null });
    if (!next) { await ctx.step('skipped', { reason: 'no carousel next control' }); return; }
    const states = [];
    let state = await readCarouselState(ctx.page);
    states.push(state);
    await ctx.page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    await shot(ctx, 'initial');
    for (let i = 0; i < 3; i++) {
      await safeClick(next.handle);
      await sleep(1200);
      state = await readCarouselState(ctx.page);
      states.push(state);
      await ctx.page.evaluate(() => window.scrollTo(0, 0));
      await sleep(350);
      await shot(ctx, `next-${i + 1}`);
    }
    if (prev) {
      await safeClick(prev.handle);
      await sleep(1200);
      states.push(await readCarouselState(ctx.page));
      await ctx.page.evaluate(() => window.scrollTo(0, 0));
      await sleep(350);
      await shot(ctx, 'prev');
    }
    const autoplayBefore = await readCarouselState(ctx.page);
    await sleep(5500);
    const autoplayAfter = await readCarouselState(ctx.page);
    await ctx.step('transitions', states.map((s, i) => ({ step: i, active: s.active?.map((a) => a.text).slice(0, 3), headings: s.headings, heroText: s.heroText, images: s.images, tracks: s.tracks?.slice(0, 2), dots: s.dots?.slice(0, 6), slideEls: s.slideEls })));
    await ctx.step('autoplay', {
      changed: JSON.stringify([autoplayBefore.headings, autoplayBefore.heroText, autoplayBefore.images]) !== JSON.stringify([autoplayAfter.headings, autoplayAfter.heroText, autoplayAfter.images]),
      before: { headings: autoplayBefore.headings, heroText: autoplayBefore.heroText, images: autoplayBefore.images },
      after: { headings: autoplayAfter.headings, heroText: autoplayAfter.heroText, images: autoplayAfter.images },
    });
  },

  async accordions(ctx) {
    const target = ctx.site.accordionPage;
    if (target) await go(ctx, ctx.site.base + target, 1500); else await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(800);
    const els = [];
    for (const sel of ['[aria-expanded="false"]', 'details > summary', '[class*="accordion" i] [class*="header" i]', '[class*="accordion" i] button', '[class*="faq" i] [class*="question" i]', '[class*="faq" i] button', '[class*="toggle" i][aria-expanded]', '.accordion-header', '[aria-pressed="false"][role="button"]']) {
      els.push(...(await visibleElements(ctx.page, sel, 15)));
      if (els.length >= 30) break;
    }
    await ctx.step('toggles', els.slice(0, 10).map((e) => ({ text: e.text.slice(0, 70), cls: e.cls, ariaExpanded: e.ariaExpanded })));
    const results = [];
    const contentEls = els.filter((el) => el.box.y > 220 && !/nav|header|menu|sheet|drawer/i.test(el.cls));
    await ctx.step('contentToggles', contentEls.slice(0, 8).map((e) => ({ text: e.text.slice(0, 70), cls: e.cls, y: e.box.y })));
    for (const el of contentEls.slice(0, 4)) {
      if (!/accordion|faq|toggle|question|plus|expand/i.test(el.cls + ' ' + el.text) && el.tag === 'div') continue;
      const before = await ctx.page.evaluate(() => document.body.innerText.length);
      const ok = await safeClick(el.handle, { force: true });
      await sleep(900);
      const state = await ctx.page.evaluate(() => {
        const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
        const expanded = [...document.querySelectorAll('[aria-expanded="true"]')].filter(vis).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60));
        return { expandedCount: expanded.length, expanded: expanded.slice(0, 5), textLength: document.body.innerText.length };
      });
      results.push({ clicked: el.text.slice(0, 60), ok, beforeTextLen: before, after: state });
      await shot(ctx, `expanded-${results.length}`);
      await safeClick(el.handle).catch(() => {});
      await sleep(400);
    }
    await ctx.step('expanded', results);
    const content = await ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return false; } };
      const answers = [...document.querySelectorAll('[class*="accordion" i] [class*="content" i], [class*="faq" i] [class*="answer" i], [class*="accordion" i] [class*="body" i], details p')].filter(vis);
      return answers.slice(0, 5).map((a) => (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 240));
    });
    await ctx.step('answerSamples', content);
  },

  async tabsFilters(ctx) {
    const target = ctx.site.filtersPage;
    if (target) await go(ctx, ctx.site.base + target, 1500); else await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(800);
    const tabs = [];
    for (const sel of ['[role="tab"]', '[aria-selected]', '[class*="filter" i] button', '[class*="filter" i] a', '[class*="tabs" i] button', '[class*="tabs" i] a', '[class*="chip" i]', '[class*="swatch" i]']) {
      tabs.push(...(await visibleElements(ctx.page, sel, 20)));
      if (tabs.length >= 40) break;
    }
    // keep only candidates that are inside the page content, not the duplicate mobile menu
    for (let i = tabs.length - 1; i >= 0; i--) {
      const inMenu = await tabs[i].handle.evaluate((el) => !!el.closest('[class*="menu" i], [class*="sheet" i], [class*="drawer" i], header, nav')).catch(() => false);
      if (inMenu) tabs.splice(i, 1);
    }
    const selects = await visibleElements(ctx.page, 'main select, select', 5);
    for (const sSel of selects) {
      const opts = await sSel.handle.evaluate((el) => [...el.options].map((o) => o.text)).catch(() => []);
      await ctx.step('selectOptions', { cls: sSel.cls, options: opts.slice(0, 12) });
      if (opts.length > 1) {
        const before = await ctx.page.evaluate(() => document.body.innerText.length);
        await sSel.handle.selectOption({ index: 1 }).catch(() => {});
        await sleep(1200);
        const after = await ctx.page.evaluate(() => document.body.innerText.length);
        await ctx.step('selectChanged', { from: opts[0], to: opts[1], before, after, changed: before !== after });
        await shot(ctx, 'select-changed');
      }
      break;
    }
    if (!tabs.length) {
      for (const el of await visibleElements(ctx.page, 'select, button, [role="button"], a[href]', 120)) {
        if (!/sort|filter|all|clear|category|kitchen|wardrobe|vanity|accessor|material|colour|color/i.test(el.text)) continue;
        if (el.box.y < 220) continue;
        const inMenu = await el.handle.evaluate((e) => !!e.closest('[class*="menu" i], [class*="sheet" i], header, nav')).catch(() => false);
        if (inMenu) continue;
        tabs.push(el);
        if (tabs.length >= 10) break;
      }
      await ctx.step('fallbackCandidates', tabs.map((t) => t.text.slice(0, 60)));
    }
    await ctx.step('tabCandidates', tabs.slice(0, 12).map((t) => ({ text: t.text.slice(0, 50), cls: t.cls, ariaExpanded: t.ariaExpanded })));
    const results = [];
    for (const t of tabs.slice(0, 4)) {
      if (!t.text && !/filter|tab|chip|swatch/i.test(t.cls)) continue;
      const before = await ctx.page.evaluate(() => ({ text: document.body.innerText.length, url: location.href }));
      const ok = await safeClick(t.handle);
      await sleep(1200);
      const after = await ctx.page.evaluate(() => ({
        text: document.body.innerText.length,
        url: location.href,
        headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 5).map((h) => (h.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 70)),
        selected: [...document.querySelectorAll('[aria-selected="true"], [class*="active" i]')].slice(0, 5).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40)),
      }));
      results.push({ clicked: t.text.slice(0, 50), ok, before, after, changed: before.text !== after.text || before.url !== after.url });
      await shot(ctx, `tab-${results.length}`);
      if (ctx.page.url() !== ctx.site.base + (target || '/')) { await go(ctx, ctx.site.base + (target || '/'), 1200); }
    }
    await ctx.step('results', results);
  },

  async forms(ctx) {
    for (const f of ctx.site.forms || []) {
      await go(ctx, ctx.site.base + f.url, 1800);
      await acceptCookies(ctx.page, ctx.site.cookieAccept);
      await sleep(800);
      const env = await collectEnv(ctx.page);
      const forms = env.forms;
      await ctx.step(`${f.name}:formsFound`, forms.map((x, i) => ({ index: i, action: x.action, method: x.method, framework: x.framework, fields: x.fields.length, submits: x.submits.map((s) => s.text), hasFile: x.hasFile, hasConsent: x.hasConsent })));
      const usable = forms.map((x, i) => ({ x, i })).filter(({ x }) => x.fields.length >= 2 && !/search/i.test(x.cls));
      const formIndex = usable[0]?.i ?? 0;
      const form = forms[formIndex];
      if (!form) { await ctx.step(`${f.name}:noForm`, {}); continue; }
      await ctx.write(`form-${f.name}.json`, { page: ctx.page.url(), allForms: forms, picked: formIndex, form });
      await shot(ctx, `${f.name}-form`);
      const probes = [];
      // 1) native constraint validation without submitting
      const native = await ctx.page.evaluate((idx) => {
        const fm = [...document.forms][idx];
        if (!fm) return null;
        const invalid = [...fm.querySelectorAll(':invalid')].map((el) => ({ name: el.name || el.id, type: el.type, message: el.validationMessage, required: !!el.required }));
        return { action: fm.getAttribute('action'), method: fm.method, noValidate: fm.noValidate, valid: fm.checkValidity(), invalid, requiredCount: [...fm.elements].filter((e) => e.required).length };
      }, formIndex).catch((e) => ({ error: e.message }));
      probes.push({ probe: 'native-validation', ...native });
      // 2) synthetic submit event: lets framework handlers run (fetch/XHR is recorded; POST is blocked)
      const beforeReq = ctx.state.reqSeq;
      const synthetic = await ctx.page.evaluate((idx) => {
        const fm = [...document.forms][idx];
        if (!fm) return null;
        let prevented = null;
        const listener = (e) => { prevented = e.defaultPrevented; };
        document.addEventListener('submit', listener, { once: true, capture: true });
        const ev = new Event('submit', { bubbles: true, cancelable: true });
        const dispatched = fm.dispatchEvent(ev);
        setTimeout(() => document.removeEventListener('submit', listener, { capture: true }), 0);
        return { dispatched, defaultPrevented: !!ev.defaultPrevented, preventedByListener: prevented };
      }, formIndex).catch((e) => ({ error: e.message }));
      await sleep(1500);
      probes.push({
        probe: 'synthetic-submit', ...synthetic,
        blockedWrites: ctx.state.blockedWrites.filter((w) => w.flow === ctx.state.currentFlow).slice(-4),
        requests: requestsSince(ctx, beforeReq).map((r) => `${r.method} ${r.url}`).slice(0, 8),
      });
      await shot(ctx, `${f.name}-validation`);
      // 3) click the real submit control (outside-form submit buttons included), still with POST blocked
      const submitBtn = await findFirst(ctx.page, ['button[type="submit"]', 'input[type="submit"]', 'button'], { text: 'submit|send|send message|get in touch|request|senden|absenden|enviar|envoyer' });
      if (submitBtn) {
        const before2 = ctx.state.reqSeq;
        const urlBefore = ctx.page.url();
        await safeClick(submitBtn.handle);
        await sleep(1800);
        probes.push({
          probe: 'click-submit', clicked: submitBtn.text, urlBefore, urlAfter: ctx.page.url(),
          blockedWrites: ctx.state.blockedWrites.filter((w) => w.flow === ctx.state.currentFlow).slice(-4),
          requests: requestsSince(ctx, before2).map((r) => `${r.method} ${r.url}`).slice(0, 8),
          invalids: await ctx.page.evaluate(() => [...document.querySelectorAll('input:invalid, select:invalid, textarea:invalid')].map((el) => ({ name: el.name, message: el.validationMessage }))).catch(() => []),
        });
        await shot(ctx, `${f.name}-submit-click`);
      }
      await ctx.step(`${f.name}:validation`, probes);
      await ctx.step(`${f.name}:fields`, form.fields.map((x) => `${x.type || x.tag}${x.required ? '*' : ''} ${x.name || x.id}${x.placeholder ? ` ("${x.placeholder}")` : ''}${x.options ? ` [${x.options.length} options]` : ''}`));
    }
  },

  async detailProbes(ctx) {
    for (const probe of ctx.site.detailProbes || []) {
      await go(ctx, ctx.site.base + probe.url, 1900);
      await acceptCookies(ctx.page, ctx.site.cookieAccept);
      await sleep(800);
      let el = null;
      if (probe.text) el = await findFirst(ctx.page, ['h1', 'h2', 'h3', 'button', 'a', '[role="button"]', 'div'], { text: probe.text });
      if (!el && probe.selectors) el = await findFirst(ctx.page, probe.selectors, {});
      if (!el) { await ctx.step(`${probe.name}:noTrigger`, { text: probe.text || null }); continue; }
      await ctx.page.evaluate(() => window.scrollTo(0, 0));
      const before = await snapshot(ctx.page);
      const reqStart = ctx.state.reqSeq;
      await safeClick(el.handle);
      await sleep(2200);
      const after = await snapshot(ctx.page);
      const details = await ctx.page.evaluate(() => {
        const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
        const cands = [...document.querySelectorAll('[role="dialog"], dialog, [class*="modal" i], [class*="lightbox" i], [class*="drawer" i]')]
          .filter((x) => vis(x) && x.getBoundingClientRect().width > 250)
          .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height));
        const d = cands[0];
        if (!d) return null;
        return {
          cls: String(d.className || '').slice(0, 120),
          text: (d.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 500),
          buttons: [...d.querySelectorAll('button, a[href], [role="button"]')].filter(vis).map((b) => ({ text: (b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 50), href: b.tagName === 'A' ? b.href : '', tag: b.tagName.toLowerCase() })).slice(0, 12),
          images: [...d.querySelectorAll('img')].map((i) => ({ src: i.currentSrc || i.src, alt: i.alt })).slice(0, 4),
          iframes: [...d.querySelectorAll('iframe')].map((f) => f.src),
        };
      });
      await ctx.step(`${probe.name}:dialog`, { clicked: el.text, url: ctx.page.url(), opened: after.overlays?.length > before.overlays?.length || !!details, details, requests: requestsSince(ctx, reqStart).map((r) => `${r.method} ${r.url}`).slice(0, 10) });
      await shot(ctx, `${probe.name}`);
      // HEAD the download targets referenced by the dialog
      const downloadHeads = [];
      for (const b of (details?.buttons || []).filter((b) => b.href && /pdf|download|document|api\./i.test(b.href)).slice(0, 6)) {
        try {
          const res = await fetch(b.href, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
          downloadHeads.push({ href: b.href, status: res.status, type: res.headers.get('content-type'), size: res.headers.get('content-length') });
        } catch (e) { downloadHeads.push({ href: b.href, error: e.message }); }
      }
      await ctx.step(`${probe.name}:downloadHeads`, downloadHeads);
      await pressEscape(ctx.page);
      await sleep(600);
    }
  },

  async modal(ctx) {
    await goHome(ctx, { keepOverlays: true });
    await sleep(1400);
    const readFlags = () => ctx.page.evaluate(() => ({ session: { ...sessionStorage }, local: { ...localStorage } }));
    const flags0 = await readFlags();
    await ctx.step('preloadStorage', { sessionKeys: Object.keys(flags0.session), localKeys: Object.keys(flags0.local), adFlags: Object.entries(flags0.session).filter(([k]) => /ad|promo|pop|modal|offer|discount/i.test(k)) });
    // clear ad/popup dismissal flags so we can observe the on-load overlay
    const cleared = await ctx.page.evaluate(() => {
      const out = [];
      for (const store of [sessionStorage, localStorage]) {
        for (const k of Object.keys(store)) {
          if (/ad|promo|pop|modal|offer|discount|dismiss/i.test(k)) { out.push(k); store.removeItem(k); }
        }
      }
      return out;
    });
    await ctx.step('clearedFlags', cleared);
    await goHome(ctx, { keepOverlays: true });
    await sleep(2600);
    const overlayDetails = await ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
      const cands = [...document.querySelectorAll('[role="dialog"], dialog, [class*="modal" i], [class*="popup" i], [class*="lightbox" i]')]
        .filter((el) => vis(el) && el.getBoundingClientRect().width > 200 && el.getBoundingClientRect().height > 120)
        .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height));
      const el = cands[0];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 140), w: Math.round(r.width), h: Math.round(r.height),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 600),
        images: [...el.querySelectorAll('img')].map((i) => ({ src: i.src, alt: i.alt })).slice(0, 6),
        buttons: [...el.querySelectorAll('button, a[href], [role="button"]')].filter(vis).map((b) => ({ text: (b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60), tag: b.tagName.toLowerCase(), href: b.tagName === 'A' ? b.href : '' })).slice(0, 12),
        formFields: [...el.querySelectorAll('input, select, textarea')].map((i) => ({ type: i.type, name: i.name, placeholder: i.placeholder })).slice(0, 10),
      };
    });
    const state = await snapshot(ctx.page);
    await shot(ctx, 'onload');
    await ctx.step('onLoad', { overlays: state.overlays, bodyOverflow: state.bodyOverflow, details: overlayDetails });
    if (!state.overlays.length) {
      await sleep(5000);
      const late = await snapshot(ctx.page);
      await ctx.step('delayedCheck', { overlays: late.overlays, bodyOverflow: late.bodyOverflow });
      if (!late.overlays.length) { await ctx.step('none', { note: 'no on-load overlay observed even after clearing dismiss flags', flagsNow: await readFlags() }); return; }
    }
    // close: Escape first, then explicit close button
    let method = null;
    await pressEscape(ctx.page);
    await sleep(900);
    let after = await snapshot(ctx.page);
    if (after.overlays.length) {
      const btn = await ctx.page.$('[role="dialog"] button[aria-label*="close" i], [role="dialog"] button[class*="close" i], [class*="modal" i] [class*="close" i], button[aria-label*="close" i], [class*="close" i] button');
      if (btn && (await btn.isVisible().catch(() => false))) {
        await btn.click({ timeout: 2500 }).catch(() => {});
        await sleep(900);
        method = 'close-button';
      }
    } else method = 'Escape';
    after = await snapshot(ctx.page);
    await ctx.step('closed', { method, overlays: after.overlays.length, bodyOverflow: after.bodyOverflow, storage: await readFlags() });
    await shot(ctx, 'closed');
    // recurrence: reload in same session (flag should now be set)
    await goHome(ctx, { keepOverlays: true });
    await sleep(2200);
    const again = await snapshot(ctx.page);
    await ctx.step('recurrence', { overlaysOnReload: again.overlays.map((o) => ({ cls: o.cls, w: o.w, h: o.h })), adFlags: Object.entries(await readFlags().then((f) => f.session)).filter(([k]) => /ad|promo|pop|modal|offer|discount|dismiss/i.test(k)) });
  },

  async language(ctx) {
    const cfg = ctx.site.language;
    if (!cfg) { await ctx.step('skipped', { reason: 'single-language site' }); return; }
    await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(800);
    let trigger = await findFirst(ctx.page, cfg.trigger, {});
    if (!trigger) { await ctx.step('noTrigger', {}); return; }
    await safeClick(trigger.handle);
    await sleep(700);
    const options = await ctx.page.evaluate(() => [...document.querySelectorAll('[class*="lang" i] a, [hreflang], .language-menu a, [class*="language" i] li a')].filter((a) => { try { return a.checkVisibility({ checkOpacity: true }); } catch { return false; } }).map((a) => ({ text: (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30), href: a.href, lang: a.getAttribute('hreflang') || '' })).slice(0, 20));
    await ctx.step('options', { trigger: trigger.text, options });
    await shot(ctx, 'open');
    const target = cfg.target;
    const link = options.find((o) => o.href && (o.text.toLowerCase().startsWith(target.text.toLowerCase()) || o.lang.startsWith(target.lang)));
    if (link) {
      const before = ctx.page.url();
      await go(ctx, link.href, 2500);
      await ctx.step('switched', { from: before, to: ctx.page.url(), title: await ctx.page.title(), lang: await ctx.page.evaluate(() => document.documentElement.lang), h1: await ctx.page.evaluate(() => document.querySelector('h1')?.innerText?.trim().slice(0, 80)) });
      await shot(ctx, 'switched');
      await go(ctx, before, 2200);
    } else {
      await ctx.step('noTargetLink', { wanted: target });
    }
  },

  async pageProbe(ctx) {
    for (const p of ctx.site.probePages || []) {
      await go(ctx, ctx.site.base + p.url, 1800);
      await acceptCookies(ctx.page, ctx.site.cookieAccept);
      await sleep(600);
      const env = await collectEnv(ctx.page);
      await shot(ctx, p.name);
      const primary = await ctx.page.evaluate(() => {
        const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
        const out = [];
        for (const el of document.querySelectorAll('a[href], button, [role="button"]')) {
          if (!vis(el)) continue;
          const t = (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
          if (!t || t.length > 60) continue;
          if (!/get|start|plan|book|request|catalogue|brochure|download|contact|design|concierge|apply|find|store|dealer|consult|configure|quote/i.test(t)) continue;
          out.push({ text: t.slice(0, 60), tag: el.tagName.toLowerCase(), href: el.tagName === 'A' ? el.href : '', target: el.getAttribute('target') || '' });
          if (out.length >= 25) break;
        }
        return out;
      });
      await ctx.step(`${p.name}:overview`, {
        url: ctx.page.url(),
        title: env.title,
        counts: env.counts,
        forms: env.forms.map((f) => ({ action: f.action, method: f.method, fields: f.fields.length, framework: f.framework, submits: f.submits.map((s) => s.text) })),
        iframes: env.iframes,
        videos: env.videos,
        headings: await ctx.page.evaluate(() => [...document.querySelectorAll('h1,h2')].slice(0, 8).map((h) => (h.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80))),
        primaryActions: primary,
      });
      if (p.click) {
        const btn = await findFirst(ctx.page, p.click.selectors || [], { text: p.click.text });
        if (btn) {
          const before = ctx.state.reqSeq;
          const popupPromise = ctx.context.waitForEvent('page', { timeout: 6000 }).catch(() => null);
          await safeClick(btn.handle);
          const popup = await popupPromise;
          await sleep(1800);
          const popupInfo = popup ? { url: popup.url(), title: await popup.title().catch(() => '') } : null;
          if (popup) await popup.close().catch(() => {});
          await ctx.step(`${p.name}:primaryClick`, { clicked: btn.text, popup: popupInfo, url: ctx.page.url(), requests: requestsSince(ctx, before).map((r) => `${r.method} ${r.url}`).slice(0, 12) });
          await shot(ctx, `${p.name}-clicked`);
        }
      }
    }
  },

  async chat(ctx) {
    await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(1000);
    const candidates = await ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return !!(el.offsetWidth || el.offsetHeight); } };
      const out = [];
      for (const el of document.querySelectorAll('[class*="chat" i], [id*="chat" i], [class*="whatsapp" i], [class*="floating" i], [class*="fab" i], [aria-label*="chat" i], [class*="concierge" i], iframe[title*="chat" i]')) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 24) continue;
        out.push({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60), cls: String(el.className || '').slice(0, 100), href: el.closest('a')?.href || '' });
        if (out.length >= 8) break;
      }
      return out;
    });
    await ctx.step('candidates', candidates);
    const btn = await findFirst(ctx.page, ['[class*="chat" i]', '[id*="chat" i]', '[class*="whatsapp" i]', '[aria-label*="chat" i]', '[class*="floating" i] button', '[class*="fab" i]'], {});
    if (!btn) { await ctx.step('none', {}); return; }
    const href = await btn.handle.evaluate((el) => el.closest('a')?.href || '').catch(() => '');
    const before = ctx.state.reqSeq;
    const popupPromise = ctx.context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
    await safeClick(btn.handle);
    const popup = await popupPromise;
    await sleep(1800);
    const after = await snapshot(ctx.page);
    const newFrames = await ctx.page.evaluate(() => [...document.querySelectorAll('iframe')].map((f) => ({ src: f.src, title: f.title })));
    await ctx.step('opened', { clicked: btn.text, href, popup: popup ? popup.url() : null, overlays: after.overlays, iframes: newFrames, network: requestsSince(ctx, before).map((r) => `${r.method} ${r.url}`).slice(0, 15) });
    await shot(ctx, 'opened');
    if (popup) await popup.close().catch(() => {});
    await pressEscape(ctx.page);
  },

  async videoLightbox(ctx) {
    const target = ctx.site.mediaPage;
    if (target) await go(ctx, ctx.site.base + target, 1800); else await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(1000);
    const media = await ctx.page.evaluate(() => ({
      iframes: [...document.querySelectorAll('iframe')].map((f) => ({ src: f.src, title: f.title, allow: f.getAttribute('allow') || '' })),
      videos: [...document.querySelectorAll('video')].map((v) => ({ src: v.currentSrc || v.src, poster: !!v.poster, autoplay: v.autoplay, controls: v.controls })),
      lightboxTriggers: [...document.querySelectorAll('a[href*=".jpg"], a[href*=".png"], [data-lightbox], [class*="lightbox" i] a, [class*="gallery" i] a')].length,
    }));
    await ctx.step('media', media);
    if (media.videos.length) {
      const played = await ctx.page.evaluate(() => {
        const v = document.querySelector('video');
        if (!v) return null;
        v.muted = true;
        v.play().then(() => {}).catch(() => {});
        return { src: v.currentSrc || v.src, duration: v.duration, readyState: v.readyState };
      });
      await sleep(1500);
      await ctx.step('videoPlay', played);
      await shot(ctx, 'video');
    }
    // open a lightbox if the element is a gallery item
    const light = await findFirst(ctx.page, ['[class*="lightbox" i]', '[data-lightbox]', '[class*="gallery" i] a']);
    if (light) {
      const before = await snapshot(ctx.page);
      await safeClick(light.handle);
      await sleep(1500);
      const after = await snapshot(ctx.page);
      await ctx.step('lightbox', { clicked: light.text, overlays: after.overlays.slice(0, 3), iframes: await ctx.page.evaluate(() => [...document.querySelectorAll('iframe')].map((f) => f.src).slice(0, 5)) });
      await shot(ctx, 'lightbox');
      await pressEscape(ctx.page);
    }
  },

  async hoverStates(ctx) {
    await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(800);
    const results = [];
    for (const group of ctx.site.hoverTargets || []) {
      const el = await findFirst(ctx.page, group.selectors, { text: group.text });
      if (!el) { results.push({ group: group.name, found: false }); continue; }
      const diff = await hoverStyleDiff(ctx.page, el.handle);
      results.push({ group: group.name, target: el.text.slice(0, 50), ...diff });
      await shot(ctx, `hover-${group.name}`);
      await ctx.page.mouse.move(2, 2);
      await sleep(250);
    }
    await ctx.step('hovers', results);
  },

  async linksAssets(ctx) {
    await goHome(ctx);
    await sleep(800);
    const env = await collectEnv(ctx.page);
    const internal = env.links.filter((l) => l.internal && l.kind === 'page');
    const external = env.links.filter((l) => l.kind === 'external');
    const assets = env.links.filter((l) => ['pdf', 'download'].includes(l.kind));
    const contact = env.links.filter((l) => ['mailto', 'tel'].includes(l.kind));
    await ctx.step('summary', { internal: internal.length, external: external.length, assets: assets.length, contact: contact.length });
    await ctx.step('externalDomains', [...new Set(external.map((e) => { try { return new URL(e.href).hostname; } catch { return ''; } }))].filter(Boolean));
    await ctx.step('contactLinks', contact.map((c) => c.href).slice(0, 10));
    const pageAssets = [];
    for (const p of ctx.site.assetPages || []) {
      await go(ctx, ctx.site.base + p, 1600);
      const pageEnv = await collectEnv(ctx.page);
      const found = pageEnv.links.filter((l) => ['pdf', 'download'].includes(l.kind));
      pageAssets.push({ page: p, assets: found.map((x) => ({ text: x.text, href: x.href })) });
    }
    await ctx.step('assetPages', pageAssets);
    const allAssets = [...assets, ...pageAssets.flatMap((p) => p.assets)];
    await ctx.step('assetLinks', allAssets.map((a) => a.href).slice(0, 30));
    const headResults = [];
    for (const a of allAssets.slice(0, 15)) {
      try {
        const res = await fetch(a.href, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000) });
        headResults.push({ href: a.href, status: res.status, type: res.headers.get('content-type'), size: res.headers.get('content-length'), final: res.url });
      } catch (e) { headResults.push({ href: a.href, error: e.message }); }
    }
    await ctx.step('assetHeads', headResults);
    await ctx.write('links.json', { internal, external, assets, contact });
  },

  async notFound(ctx) {
    const before = ctx.state.reqSeq;
    const res = await ctx.page.goto(ctx.site.base + '/this-page-does-not-exist-9137', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => null);
    await sleep(1500);
    const state = await ctx.page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('h1')?.innerText?.trim().slice(0, 80) || '',
      text: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 240),
      hasNav: !!document.querySelector('header nav, nav'),
      hasFooter: !!document.querySelector('footer'),
    }));
    await ctx.step('404', { status: res ? res.status() : null, ...state, requests: requestsSince(ctx, before).length });
    await shot(ctx, '404');
    await ctx.write('not-found.json', { status: res ? res.status() : null, ...state });
  },

  async mobileUi(ctx) {
    await ctx.page.setViewportSize({ width: 390, height: 844 });
    await goHome(ctx);
    await acceptCookies(ctx.page, ctx.site.cookieAccept);
    await sleep(900);
    const fixed = await ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return false; } };
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        if (!vis(el)) continue;
        const s = getComputedStyle(el);
        if (s.position !== 'fixed' && s.position !== 'sticky') continue;
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 20) continue;
        out.push({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 90), text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.top), x: Math.round(r.left), pos: s.position, z: s.zIndex });
        if (out.length >= 15) break;
      }
      return out;
    });
    const smallTargets = await ctx.page.evaluate(() => {
      const vis = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return false; } };
      const out = [];
      for (const el of document.querySelectorAll('a[href], button, input, select, [role="button"]')) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 24) continue;
        if (r.width >= 44 && r.height >= 44) continue;
        out.push({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) });
        if (out.length >= 20) break;
      }
      return out;
    });
    await ctx.step('fixedBars', fixed);
    await ctx.step('smallTapTargets', smallTargets);
    await shot(ctx, 'mobile-ui');
    await ctx.page.evaluate(() => window.scrollTo(0, 600));
    await sleep(600);
    await shot(ctx, 'mobile-scrolled');
    await ctx.page.setViewportSize({ width: 1440, height: 900 });
  },

  async finalise(ctx) {
    const storage = await collectStorage(ctx.context, ctx.page);
    await ctx.write('storage-final.json', storage);
    const nonKnown = summariseNetwork(ctx.state.requests).byDomain.filter((d) => !KNOWN_TP[d.domain]);
    await ctx.write('network-summary.json', { ...summariseNetwork(ctx.state.requests), unknownDomains: nonKnown.slice(0, 40), blockedWrites: ctx.state.blockedWrites });
    await ctx.step('done', { cookies: storage.cookies.length, local: Object.keys(storage.local).length, session: Object.keys(storage.session).length, blockedWrites: ctx.state.blockedWrites.length });
  },
};

export const FLOW_ORDER = [
  'baseline', 'cookie', 'scroll', 'keyboard', 'navDesktop', 'navMobile', 'search', 'carousel',
  'accordions', 'tabsFilters', 'forms', 'modal', 'language', 'pageProbe', 'detailProbes', 'chat',
  'videoLightbox', 'hoverStates', 'linksAssets', 'notFound', 'mobileUi', 'finalise',
];
