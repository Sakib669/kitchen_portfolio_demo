# Häcker Küchen — Functional & Interaction Teardown

**Site:** https://www.haecker-kuechen.com/en/ · **Scope:** observable actions, flows, forms, states, network calls — driven live in Chromium.
**Observed:** 2026-10-26, 1440×900 (+390×844 mobile probes). **Evidence:** `functional/actions/haecker-kuechen/` (`flows/`, `shots/`, `summary.json`, `facts.md`).
**Evidence classes:** _observed_ = executed/screenshot/network; _inferred_ = from markup/attributes; _unknown_ = not exercised.

Design teardown: [`design-system.md`](design-system.md) · Cross-site matrix: [`functional/feature-matrix.md`](../../functional/feature-matrix.md).

> **Coverage note:** the site began rate-limiting repeated automated sessions during the functional pass, so a few late flows (`carousel`, `accordions`, language switch) are documented from the saved DOM/crawl files plus partial executions, and are marked _inferred/partial_ rather than fully executed. Earlier flows (navigation, scroll, forms, keyboard, consent) were fully observed.

---

## 1. Functional thesis

Häcker is a **TYPO3 marketing and dealer-network site**. There is no e-commerce, no account, no cart and no prices: the entire interaction layer exists to move a visitor to a **dealer search**, a **kitchen planner**, a **brochure/media download** or **contact**. Navigation is hover-driven mega menus; the only forms are a **dealer search** (country → dealer) and the **site search**; language switching covers 10 markets; consent is handled by a custom `SgCookieOptin` dialog.

The site is unusually "static" from an interaction standpoint — **63 interactive elements on the home page, all of them links, zero buttons**. The expressive interactions are visual: Swiper hero carousel with autoplay, material-sphere slider, lightbox image galleries. There is no chat, no video, no personalisation.

| Capability | Present? | Evidence |
|---|---|---|
| Hover mega menus (4 chapters) | ✅ full-width panels, images + 10 links | `flows/navDesktop.json` |
| Mobile off-canvas menu (mmenu) | ✅ `#toggle-mobile-menu` → `#mmainnav` | DOM `flows/navMobile.json` (trigger unlabeled; automation could not confirm open) |
| Search | ✅ TYPO3 ke_search `/en/search` | `baseline.json` form, `navDesktop` DOM |
| Language switcher | ✅ 10 locales (en, de, es, fr, it, nl, pl, dk + sv/no commented) | DOM, `design-system` |
| Sticky header | ✅ fixed 92px always | `flows/scroll.json` |
| Hero carousel | ✅ Swiper, autoplay **4000ms**, arrows + bullets | DOM + `flows/carousel.json` (controls not captured pre-throttle) |
| Lightbox galleries | ✅ `figure.image.lightbox` | DOM + crawl evidence |
| Cookie consent | ✅ SgCookieOptin, 4 categories | crawl screenshot + DOM |
| Dealer search form | ✅ country select (250 options) + Continue | `flows/forms.json` |
| Contact form | ❌ none on `/en/contact` (search form only) | `flows/forms.json` |
| Kitchen planner | ✅ `/en/kitchen-planner` page (links to online planner) | `flows/pageProbe.json` |
| FAQ accordion | ✅ 5 `accordion-item`s on planner page | DOM (`.accordion-header[role=button]`) |
| Chat / video | ❌ neither | `flows/chat.json`, `flows/videoLightbox.json` |
| Analytics | ✅ GA4 + Meta Pixel **after consent** | `flows/forms.json` network |

---

## 2. Global shell

### 2.1 Header (fixed, 92px, white)
- Logo left (SVG, black/white variants), then **4 chapters with two-line labels**:
  `Inspiration / Kitchens & more` · `Company / Values & more` · `Service / Consultation & more` · `Career / Jobs & more`.
- Right cluster: **Kitchen planner** link, language globe (“en”), search icon (`role="search"`, `href="javascript:;"`).
- Fixed at `top: 0` at all scroll positions (no transition, no translucent state) — `flows/scroll.json`.
- Header contains **48 links in the DOM** (mega menus fully rendered). The chapter items are `<li tabindex="0">`; submenu links are focusable while closed → keyboard tab order is very long (`flows/keyboard.json`: every Tab after the first went through mega-menu links).

| Mega menu | Panel | Links |
|---|---|---|
| Inspiration | 1440×371 (images + 10 links) | Kitchen styles · Kitchen interior · Kitchen accessories · In-house exhibition · Blaupunkt · Häcker’s Kitchen Magazine · Media Site · systemat · concept130 · Limited Edition 1926 |
| Company | full-width | About Häcker · Project business · Values · Press · Awards and Certificates |
| Service | full-width | Dealer search · Kitchen planner · Brochures · Contact · Downloads · Extranet |
| Career | full-width | Vacancies · Häcker as an employer · Career starters · Experienced applicants · Dual study programme · Traineeship · Internship · Speculative application |

**Open behaviour:** hover opens the panel (`method: hover` for all 4 in `flows/navDesktop.json`); no `aria-expanded` is set on the trigger. Escape/click-outside closes (observed in earlier run).

### 2.2 Mobile menu
- Trigger: `<a id="toggle-mobile-menu" href="#mmainnav">` with three `<span>` bars — **no accessible name**, no class "hamburger"; it sits at the top-right over the logo bar.
- Target: TYPO3 **mmenu** off-canvas (`#mmainnav`, `mm-page`/`mm-slideout` wrapper), with per-item next buttons (`.mm-btn--next`).
- Our automation could not confirm the open state before the site throttled; DOM structure and the mmenu plugin are observed. _Partial._

---

## 3. Search

- Trigger: `<a class="nav-link js-searchbox-trigger" role="search">` with a Font Awesome magnifier and visually hidden text “Search”.
- Backing form (observed in `baseline.json`):
  `GET /en/search` · one field `tx_kesearch_pi1[sword]` · placeholder **“What are you looking for?”** · submit “Search”.
- So search is a **server-rendered TYPO3 ke_search results page**; no autocomplete/XHR.
- Our two post-throttle attempts could not open the searchbox (page loaded only 5 requests — the site served a degraded/blocked page), so the overlay behaviour is documented from markup only. _Partial._

---

## 4. Home page actions (observed)

| Action | Trigger | Result |
|---|---|---|
| Hero carousel | Swiper with arrows (`.swiper-nav.swiper-prev/next`), bullets, `data-swiper-autoplay="4000"` | auto-advances every 4 s; loop enabled; 5–6 campaign/material slides |
| Material spheres | 5 circular material buttons + arrows | switch the material story; progress line under hero |
| Get inspired now | black pill (`.btn .btn-secondary`, 37px, radius 126px) | → `/en/dealer-search` |
| Go to the Kitchen Planner | black pill | → `/en/kitchen-planner` |
| Apply Now | black pill | → `/en/career` |
| Find the Perfect Kitchen | black pill | → dealer/kitchen search |
| Design my kitchen now | black pill | → planner/colour configurator entry |
| Plan your own kitchen now | black pill | → `/en/kitchen-planner` |
| “wide range of design possibilities” inline link | text link | → `/en/kitchenideas` |
| Hero image links | whole image is an `<a>` | → full-size image (lightbox) |
| Certification logos | static images | no links |

No chat widget, no floating CTA, no promo popup. The only overlay on first visit is the consent dialog.

---

## 5. Forms

### 5.1 Dealer search — `/en/dealer-search` (observed)
- `<form>` **GET** to `/en/dealer-search`; fields: **country select (250 options, required)** + submit **“Continue”**.
- Empty submit is blocked by native validation: `country` → “Please select an item in the list.” No request is sent until a country is chosen.
- This is the primary conversion path for the whole site (every “Get inspired” CTA leads here).

### 5.2 Contact — `/en/contact` (observed)
- The contact page contains **no contact form**; the only `<form>` in the DOM is the site search.
- Contact is by **mail, letter or phone** (page title: “Your contact for Häcker Kitchens – via mail, letter or phone”), plus dealer search.

### 5.3 Cookie consent — `#SgCookieOptin` (observed in crawl; interaction partial)
- Dialog: “Privacy settings — We use cookies to ensure the technical functioning of our website.”
- Categories: **Essential · Statistics · Marketing · External content** (4 toggle rows).
- Buttons: **Accept all** · **Save selection & close** · **Accept essential cookies** · **Show more information**.
- Until consent is given, **0 cookies / 0 local storage** and **0 third-party requests** (baseline).
- After a consent click, GA4 (`G-GZRGMT838V`) and Meta Pixel requests appear on subsequent pages (dealer search/contact) — i.e. consent is respected, trackers are consent-gated.

### 5.4 Forms not present
- No newsletter form, no upload, no account login, no quote/price form. The planner is a separate application linked from `/en/kitchen-planner`.

---

## 6. Planner, FAQs, catalogues

- **Kitchen planner** (`/en/kitchen-planner`): explainer page with a CTA “Plan your kitchen online with the kitchen planner” and a secondary “Find a dealer” button. The planner itself is an external/online application; no booking or payment flow.
- **FAQ accordion** (same page, DOM observed): 5 items using `.accordion-item` → `.accordion-header` (`role="button"`, `aria-pressed="false"`) → `.accordion-content`.
  - Q: “How do I begin planning my kitchen?” → A: start by measuring the available space and entering the dimensions into the kitchen planner, then design the floor plan.
  - No `aria-expanded` attribute — state is tracked with `aria-pressed`/classes, so assistive tech semantics are weak.
- **Media / downloads**: “Media Site”, “Brochures”, “Downloads” are links in the Service mega menu; no direct PDFs were captured in the tested flows.
- **Lightbox**: images use `figure.image.lightbox` / `a.sp.image.lightbox`; clicking opens a full-size image overlay (21 lightbox references on the concept130 page).
- **404 / not found:** not captured before throttling. _Unknown._
- **Videos:** none on measured pages. **Iframes:** none.

---

## 7. Network, analytics & storage

| Item | Observed |
|---|---|
| Platform | TYPO3 + jQuery + Swiper + Bootstrap-style grid; 7 scripts on the home page |
| Trackers | **Google Analytics 4** (`G-GZRGMT838V`), **Meta Pixel** (`facebook.com/tr`) — only after consent |
| Pre-consent third parties | none (baseline: all requests first-party) |
| Cookies (before consent) | 0 |
| Cookies (after consent) | GA `_ga`, `_ga_*`, Meta `_fbp`-family + others (not exhaustively enumerated after throttling) |
| localStorage / sessionStorage | none observed |
| Search endpoint | `GET /en/search?tx_kesearch_pi1[sword]=…` |
| Dealer search | `GET /en/dealer-search?country=…` |
| Consent platform | custom `SgCookieOptin` |

---

## 8. Accessibility of interactions

| Check | Result |
|---|---|
| Skip link | ✅ “Skip to content” (`#beforeContent`) |
| `<main>` + H1 | ✅ both present |
| Focus indicator | ✅ `outline: auto 1px` on all 14 sampled tab stops |
| Keyboard menu | ⚠️ chapter `<li tabindex="0">` is focusable; hidden submenu links remain in the tab order (48 header links), causing a huge tab sequence |
| Menu state semantics | ⚠️ no `aria-expanded` / `aria-haspopup` on chapter triggers |
| Icon-only controls | ⚠️ mobile hamburger link has no accessible name; search trigger relies on `role="search"` + hidden text |
| Accordion semantics | ⚠️ `aria-pressed` on a `role="button"` div instead of `aria-expanded` |
| Form labels | ✅ country select has a label; validation message is native |
| Mobile drawer | mmenu plugin; focus management not confirmed |
| Carousel | ⚠️ Swiper arrows/bullets are small icon controls without visible labels |

---

## 9. Rebuild action manifest

| ID | Trigger | Behaviour | State |
|---|---|---|---|
| `nav.mega.inspiration` | hover | 1440×371 panel, 10 links + 2 product images | hover-only, no aria-expanded |
| `nav.mega.company/service/career` | hover | full-width panels | |
| `nav.mobile` | tap `#toggle-mobile-menu` | mmenu off-canvas, 48+ links | unlabeled trigger |
| `search.open` | click search link | reveal searchbox | |
| `search.submit` | submit | GET `/en/search?tx_kesearch_pi1[sword]=…` | server-rendered results |
| `hero.swiper` | autoplay 4s / arrows / bullets | 5–6 slides, loop | |
| `material.spheres` | click sphere / arrows | switch material story | |
| `cta.dealer` | black pill | → `/en/dealer-search` | |
| `form.dealerSearch` | submit | GET `/en/dealer-search`, country required | native validation |
| `cta.planner` | black pill | → `/en/kitchen-planner` (external planner app) | |
| `accordion.plannerFaq` | click `.accordion-header` | expand answer, `aria-pressed` toggles | |
| `consent` | first visit | 4-category `SgCookieOptin` dialog; Accept all / Save / Essential only | gates GA4 + Meta |
| `lightbox.image` | click gallery image | full-size image overlay | |
| `language.switch` | click globe → language | navigate to `/de/`, `/es/`, … | 10 locales |

### Unknowns / partial
- Live open/close of the searchbox and mobile mmenu (site throttled automation after repeated sessions).
- Carousel control click + autoplay confirmation in the final pass (autoplay documented from `data-swiper-autoplay="4000"` and Swiper classes).
- Language switch redirect behaviour (menu structure and URLs observed; navigation not executed).
- 404 page rendering.
- Exact post-consent cookie list.
- Brochure/download endpoints (links exist in the Service menu; no PDFs captured).
