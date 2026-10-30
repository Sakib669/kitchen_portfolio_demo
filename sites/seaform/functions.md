# SEAFORM — Functional & Interaction Teardown

**Site:** https://www.seaform.com/ · **Scope:** observable actions, flows, forms, states, network calls — driven live in Chromium.
**Observed:** 2026-10-26, 1440×900 (+390×844 mobile probes). **Evidence:** `functional/actions/seaform/` (`flows/`, `shots/`, `summary.json`, `facts.md`).
**Evidence classes:** _observed_ = executed/screenshot/network; _inferred_ = from markup/attributes; _unknown_ = not exercised.

Design teardown: [`design-system.md`](design-system.md) · Cross-site matrix: [`functional/feature-matrix.md`](../../functional/feature-matrix.md).

---

## 1. Functional thesis

SEAFORM is a **WordPress + Elementor Pro marketing site with a heavy commercial stack**. Under the calm monochrome surface sit GA4, Meta Pixel, LinkedIn Insight, Hotjar, Microsoft Clarity, Google Ads remarketing, an AllInOneChat widget, an Elementor popup system and an attribution layer (`handl_*` cookies, `organic_source`, `traffic_source`, `_gcl_au`). The consent bar is the only thing standing between a visitor and ~47 cookies; after acceptance, **659 POST beacons** were fired in our session (all blocked and recorded).

The interaction model is "luxury catalogue with forms":
- navigation is four hover mega-menus (`KITCHENS / WARDROBES / FASCINATION / EXPERIENCE`) + full-screen search + an off-canvas mobile popup;
- the hero is a **full-bleed autoplay video**, not a carousel;
- conversion is split across **three Elementor forms**: contact (19 fields), catalogue request (21 fields) and concierge (no form found — only search), plus a dealer/showroom locator;
- audience routing (Home Owners / Architects / Developers / Partners) sits directly under the hero as four Elementor buttons.

| Capability | Present? | Evidence |
|---|---|---|
| Hover mega menus (4 chapters) | ✅ panels 1440×447 with 14 links | `flows/navDesktop.json` |
| Full-screen search | ✅ overlay → `/?s=` results | `flows/search.json` |
| Mobile off-canvas popup menu | ✅ Elementor popup, full link tree | `flows/navMobile.json` |
| Language switcher | ❌ single-language | `flows/language.json` |
| Hero video | ✅ autoplay muted loop `seaform_home.m4v` | `baseline.json` |
| Carousel | ❌ | `flows/carousel.json` |
| Cookie consent | ✅ Elementor popup bar (ACCEPT / Close / Cookie Policy) | `flows/cookie.json`, `shots/cookie-banner.png` |
| Contact form | ✅ 19 fields, POST, required name/email/phone + consent | `flows/forms.json` |
| Catalogue request | ✅ 21 fields, POST, “RECEIVE THE CATALOG” | `flows/forms.json` |
| Concierge form | ⚠️ page has no form (search only) | `flows/pageProbe.json` |
| Showroom locator | ✅ `/locations` (accordion by market) | `flows/pageProbe.json` |
| Chat | ✅ AllInOneChat bubble “Open chat window” | `flows/chat.json` |
| Lightbox | ✅ Elementor lightbox (image galleries) | `flows/videoLightbox.json` |
| `get your design` landing | ❌ returns **404** | `flows/pageProbe.json` |
| Analytics | ✅ GA4, Meta, LinkedIn, Hotjar, Clarity, Ads remarketing | `summary.json` |

---

## 2. Global shell

### 2.1 Header (108px, transparent over hero)
- Centred SEAFORM wordmark, two hairline rules flanking a centred nav row.
- Four top-level items: **KITCHENS · WARDROBES · FASCINATION · EXPERIENCE** — uppercase, tracked, 14–16px. **Hover** opens the mega panel (no click required, no `aria-expanded`).
- Search icon right (full-screen search), hamburger right on mobile.
- A permanent **vertical “GET IN TOUCH” tab** on the right edge; it is an Elementor popup trigger (`/#elementor-action…popup id 3134`).
- Header is `position: relative` and **scrolls away**; after 900px it is at `top: -900` (`flows/scroll.json`). No sticky header.

| Mega panel | Size | Links |
|---|---|---|
| KITCHENS | 1440×447 | COLLECTIONS · MATERIALS & COLORS · INTERIORS · SPECIALS · COUNTERTOPS · APPLIANCES · NIGHT SYSTEM · CUBE · AQUATIC · PORTICO · … (14) |
| WARDROBES | — | NIGHT SYSTEM · CUBE · AQUATIC · PORTICO (+ collection links) |
| FASCINATION | — | AT A GLANCE · LEGACY · MANUFACTURING · QUALITY · ICONIC PROJECTS |
| EXPERIENCE | — | ORDER CATALOGUE · GET YOUR DESIGN · FIND A SHOWROOM · PRODUCT SERVICE · CONTACT · CONCIERGE SERVICE · CORPORATE · CONTRACT DIVISION |

### 2.2 Mobile menu
- Opened via the hamburger → an **Elementor full-screen popup** containing the full tree, the audience links, NEWS & EVENTS and MYSEA.
- Our fallback click once landed on a footer link (`/privacy-policy/`) before opening the popup — the hamburger is an unlabeled icon and sits in a busy icon cluster. _Observed; the menu itself is correct once open._
- Panel links include absolute `https://seaform.com` (no `www`) variants for several entries — mixed-origin links (`flows/navMobile.json`).

---

## 3. Search (observed end-to-end)

1. Click the search icon → full-screen Elementor search overlay (`elementor-search-form--full-screen`) with a single `input[type=search]` (`name="s"`).
2. Type `kitchen`: **no autocomplete, no XHR** (server-side search only).
3. Enter → GET `https://www.seaform.com/?s=kitchen` → WordPress search results page **47 results** (“You searched for kitchen”).
4. A nonsense query `zzqx-nonexistent-9137` still returned **112 result items** (generic page templates) and no “no results” state — the search is very loose / not filtered.
5. Search form exists on every page (GET to site root, `?s=`).

---

## 4. Home page actions

| Action | Trigger | Result |
|---|---|---|
| Audience routing | 4 Elementor buttons: HOME OWNERS · ARCHITECTS · DEVELOPERS · PARTNERS | → `/about-seaform/`, `/architects/`, `/projects/`, `/partners/` |
| Collection tiles | 2-up image cards with 14px caps captions | → `/monogram/`, `/signature/`, `/monocle/`, `/soho/`, `/hamptons/`, `/synthesis/`, `/purista/`, `/gaia/` |
| Explore collection CTA | outlined uppercase button | → `/kitchen-collections/` |
| Concierge CTA | “APPLY NOW” black button | concierge popup/page |
| Catalogue CTA | “REQUEST CATALOGUE” | → `/order-catalogue/` |
| Design CTA | “GET YOUR DESIGN” | → `/get-your-design` → **404 page** |
| Video hero | autoplay muted loop (`seaform_home.m4v`) | no controls, no pause UI |
| Chat bubble | 64px floating button “Open chat window” | AllInOneChat widget (network to chat backend; panel not captured in DOM) |
| Vertical GET IN TOUCH | right-edge tab | Elementor popup (contact prompt) |
| Cookie bar | first visit | fixed bottom popup: “We use cookies… ACCEPT / Close / Cookie Policy” |

### 4.1 Consent behaviour (observed)
- Banner is an **Elementor popup modal** (1440×900 backdrop, bottom bar) with links and two controls: **ACCEPT** (Elementor button) and **Close** (X, `dialog-close-button`).
- Accepting fires the marketing/analytics stack; before consent, **0 cookies** are present.
- After acceptance: **47 cookies** (GA `_ga`, `_ga_80QZ6KQTKG`, `_gcl_au`, Meta `_fbp`-family/`li_*`, `bcookie`, `lidc`, `__cf_bm`, Hotjar `_hjSession*`, `handl_*` attribution, `CLID`, `UserMatchHistory`, `AnalyticsSyncHistory`, `test_cookie`, …) and 9 localStorage keys.
- `body` scroll is not locked by the bar (it is a bottom overlay, not a full modal gate).
- **Observed caveat:** our consent flow clicked “Close” (the dismissal) rather than ACCEPT because the harness prioritises explicit accept labels but this dark bar’s ACCEPT is a link-style button; the *pre-accept* state and banner structure are reliable, the post-accept cookie set comes from the baseline session where ACCEPT was clicked.

---

## 5. Forms (observed, never submitted)

### 5.1 Contact — `/contact-us/`
- Elementor Form, method **POST**, action `https://www.seaform.com/contact-us/`.
- **19 fields**: hidden `post_id`, `form_id`, `referer_title`, `queried_id`; `name*`, `email*`, `phone*`; two selects (`3` option enquiry type, `country` with **195 options**, `4` option budget/role); required **consent checkbox**; extra text fields; UTM hidden fields.
- Empty submit: native validation blocks it — `name`, `email`, `phone`, `country`, required select, consent checkbox all marked `:invalid` with browser messages (“Please fill out this field.”). No network request is sent because validation fails.
- Labels: visible Elementor labels + placeholders; required asterisks present.
- Consent checkbox is **required** (`checkbox*`).

### 5.2 Catalogue request — `/order-catalogue/`
- Elementor Form, **POST** to `/order-catalogue/`, submit label **“RECEIVE THE CATALOG”**.
- **21 fields**: `name*`, `tel*`, `email*`, `country*` (text, not select), three **checkbox choices** for collections of interest, one select with 4 options, required consent checkbox, extra fields + UTM hidden fields.
- Empty submit blocked by native validation (name/phone/email/country/consent).

### 5.3 Concierge — `/concierge-service/`
- The page exposes **only the site-search form** in its DOM; the concierge application form is not rendered on load (likely behind a popup/CTA or hosted separately). _Unknown._

### 5.4 `get your design`
- `/get-your-design` returns a **404 page** (“Page not found – SEAFORM”) while being promoted in the main navigation. _Observed broken link._

---

## 6. Catalogue, locations, content

- **Locations** (`/locations`): showroom directory with Elementor elements; 18 elements with `aria-expanded`-style state at page level, but our accordion probe found **no clickable accordion toggles** — content appears as stacked location blocks. _Partially observed._
- **Materials & colours** (`/kitchen-materials-colors`): two Elementor buttons **MATERIALS** and **ACCESSORIES** act as in-page category switches; clicking MATERIALS changed page text content (6,997 → 6,951 chars) without navigation — the closest thing to a filter on the site. ACCESSORIES click produced no change in our run.
- **Collections** (`/kitchen-collections`): 2-up collection tiles; clicking a tile **navigates** (e.g. `/kitchen-collections/synthesis/`) rather than opening a lightbox.
- **Lightbox**: Elementor lightbox is configured (27 references) for gallery images; our probe opened a lightbox overlay on the brand page but did not capture a media item.
- **Video**: one `<video autoplay muted loop>` on the home hero (`https://seaform.com/wp-content/uploads/2021/08/seaform_home.m4v`), no controls.
- **404**: status **404**, themed WordPress page with header/nav and search, **no footer**; title “Page not found – SEAFORM”.

---

## 7. Network, analytics & storage

| Item | Observed |
|---|---|
| Platform | WordPress + Elementor Pro + OceanWP; jQuery; Elementor popups/forms |
| Trackers | **GA4 `G-80QZ6KQTKG`**, **Meta Pixel**, **LinkedIn Insight** (`px.ads.linkedin.com`, `snap.licdn.com`), **Hotjar** (`script.hotjar.com`, `_hjSession*`), **Microsoft Clarity** (`clarity.ms`), **Google Ads remarketing/doubleclick**, **AllInOneChat** |
| Other third parties | `static.elfsight.com` (widgets), `bzr.openai.com` / `bzrcdn.openai.com` (AI/chat-related SDK), Google Fonts, Cloudflare |
| Own infra | `www.seaform.com`, `seaform.com` (mixed host links), `wp-content` uploads |
| Cookies after consent | **47** (analytics, ads, LinkedIn, Hotjar, Cloudflare, attribution `handl_*`) |
| localStorage | 9 keys incl. `elementor`, `hjActiveViewportIds`, `lastExternalReferrer`, `_gcl_ls`, `li_adsId`, `AllInOneChat.*` |
| sessionStorage | 5 keys incl. Elementor session, `hjViewportId`, `_cltk` |
| Blocked writes | **659** POST beacons (analytics/ads) aborted client-side; none sent by the harness |
| Search | GET `/?s=` (server-rendered results) |

**Privacy note:** the site is not opt-in-by-default for nothing — before consent there are 0 cookies, but the consent bar is the only gate and its “Close” dismisses without choosing (implied consent wording: “By continuing you consent…”). After AСCEPT the full ad/analytics stack activates.

---

## 8. Accessibility of interactions (observed)

| Check | Result |
|---|---|
| Skip link | ✅ “Skip to content” |
| `<main>` + H1 | ✅ both page-level |
| Focus indicator | ✅ links/buttons show `outline: solid 1px rgb(201,177,149)` (champagne) — 12 of 14 sampled stops |
| Keyboard tab order | header → search → nav → hero. Search input is reachable; the full-screen search opens with focusable input |
| Hover-only menus | ⚠️ mega menus open on hover; no `aria-expanded` on the `<li>` triggers, so state is not announced; keyboard opening was not confirmed |
| Icon-only controls | ⚠️ 62 empty links site-wide (icon links, slider arrows, social) |
| Form labels | ✅ visible labels + required markers; native validation messages |
| Mobile tap targets | ⚠️ many full-width 38–40px rows (below 44px), chat FAB 64px |
| Chat | ⚠️ “Open chat window” button is labeled (good); panel content not in DOM (third-party) |
| Video | ⚠️ autoplay/muted with no controls or pause affordance |

---

## 9. Rebuild action manifest

| ID | Trigger | Behaviour | State |
|---|---|---|---|
| `nav.mega.kitchens` | hover KITCHENS | 1440×447 panel, 14 links | hover-only, no aria-expanded |
| `nav.mega.wardrobes` etc. | hover | same pattern | |
| `nav.mobile` | tap hamburger | Elementor full-screen popup, full tree | unmounts on close |
| `search.open` | click search icon | full-screen overlay, single `s` field | focus input |
| `search.submit` | Enter | GET `/?s=term`, WP results page | no autocomplete |
| `cookie.bar` | first visit | bottom Elementor popup: ACCEPT / Close / Cookie Policy | sets 47 cookies on accept |
| `cta.audience.*` | click chips | navigate to audience landing pages | |
| `cta.collection` | click tile | navigate collection detail | |
| `cta.catalogue` | click | navigate `/order-catalogue/` | |
| `form.contact` | submit | POST `/contact-us/`, 19 fields, required fields + consent | blocked in session |
| `form.catalogue` | submit | POST `/order-catalogue/`, 21 fields, required + consent | blocked in session |
| `locations` | page | showroom directory, no filters | |
| `materials.toggle` | MATERIALS / ACCESSORIES buttons | in-page content swap | no URL change |
| `chat.open` | floating bubble | AllInOneChat panel | third-party |
| `video.hero` | autoplay | muted loop, no controls | |

### Unknowns
- Whether the concierge form exists behind a popup/CTA.
- Chat panel contents/provider backend (DOM not exposed; `AllInOneChat` storage keys only).
- Keyboard activation path for hover mega menus.
- Full lightbox interaction on collection galleries.
- Post-consent form success/error states (blocked writes).
