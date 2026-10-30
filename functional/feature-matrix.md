# Feature & interaction matrix — three kitchen sites

Observed by driving every reachable action in Chromium (see [`README.md`](README.md), [`functions.html`](functions.html)). ✅ present · ⚠️ present but broken/limited · ❌ absent · — not applicable. Evidence files are under `actions/<site>/flows/`.

| Capability | My Kitchen | Häcker Küchen | SEAFORM |
|---|---|---|---|
| **Platform** | Next.js 15 App Router + React + Tailwind v4 + Radix UI | TYPO3 + jQuery + Swiper + Bootstrap grid | WordPress + Elementor Pro + OceanWP + jQuery |
| **Languages** | 1 (`en`) | **10** (en, de, es, fr, it, nl, pl, dk, …) | 1 (`en`) |
| **Header** | 96px, static → **fixed translucent on scroll** | **92px fixed white** | 108px transparent over hero, scrolls away |
| Desktop mega menu | ✅ 3 chapters (click), full-width panels | ✅ 4 chapters (hover), images + 10 links | ✅ 4 chapters (hover), 14-link panels |
| Mobile off-canvas menu | ✅ 21 links, 390×716 | ✅ TYPO3 mmenu | ✅ Elementor off-canvas |
| Search | ❌ none | ✅ TYPO3 ke_search → `/en/search` | ✅ Elementor full-screen search → `?s=` |
| Breadcrumbs | ⚠️ only on `/find-store` | ✅ on inner pages | ✅ on inner pages |
| Sticky CTA / floating | ✅ WhatsApp FAB | ❌ | ✅ vertical “GET IN TOUCH” tab + chat |
| **Hero** | photo carousel, 3 slides, manual arrows | image slogan + material spheres, Swiper 4s autoplay | **autoplay muted loop video** (`seaform_home.m4v`) |
| Carousel controls | ✅ prev/next | ✅ arrows + bullets + autoplay | ❌ |
| Promo / marketing popup | ✅ 765×765 advert, **once per session** | ❌ | ⚠️ cookie bar only |
| Cookie consent | ❌ none needed (no trackers) | ✅ SgCookieOptin, 4 categories | ✅ Elementor cookie bar |
| **Forms** | | | |
| Contact form | ⚠️ 6 fields, **no action, 0 required, no request observed** | ⚠️ no form on `/en/contact` (search form only) | ✅ 19 fields, POST, name/email/phone + consent required |
| Lead / catalogue form | ⚠️ contact only | ✅ dealer search (country select 250 options + Continue) | ✅ catalogue request 21 fields + concierge |
| Native validation | ❌ none configured | ✅ required country select blocked empty submit | ✅ required fields block submit |
| Consent checkbox | ❌ | ❌ (cookie settings separate) | ✅ required on contact/catalogue |
| Country select | ❌ | ✅ 250 options | ✅ 195 options |
| File upload | ❌ | ❌ | ❌ |
| Multi-step form | ❌ | ❌ (planner is separate app entry) | ❌ |
| Form submission observed | ❌ blocked/no endpoint | ❌ not sent (validation observed) | ❌ not sent (validation observed) |
| **Catalogue / content** | | | |
| Catalogue browser | ✅ 9 cards → modal: Print / Download / Open Document | ✅ brochure/resources links | ✅ “Order catalogue” form |
| PDF download | ✅ 29.4 MB `file-…pdf` via Open Document | ⚠️ brochure links (nav/resources) | ⚠️ catalogue is request-only |
| Image lightbox | ❌ | ✅ `figure.image.lightbox` galleries | ✅ Elementor lightbox |
| Video | ❌ | ❌ (no video on measured pages) | ✅ autoplay background video |
| Product filters | ⚠️ category links + “Sort by” (navigates) | ❌ none | ⚠️ MATERIALS / ACCESSORIES anchor buttons |
| Search results page | ❌ | ✅ `/en/search` | ✅ `/?s=` |
| 404 page | ✅ Next.js default (no nav) | ✅ TYPO3 404 | ✅ themed WordPress 404 |
| **Conversion** | | | |
| Store / dealer locator | ⚠️ `/find-store` **empty stub** | ✅ `/en/dealer-search` (country → dealer) | ✅ `/locations` showroom accordion |
| Planner / configurator | ⚠️ catalogue only | ✅ `/en/kitchen-planner` entry | ⚠️ `/get-your-design` **404** |
| Chat / messaging | ✅ WhatsApp (`wa.me/8801642912612`) | ❌ | ✅ AllInOneChat bubble |
| Account / login | ❌ | ❌ | ⚠️ “MySea” link (not exercised) |
| Wishlist | ❌ heart → `/#` | ❌ | ❌ |
| E-commerce / prices | ❌ | ❌ | ❌ |
| **Analytics & privacy** | | | |
| Consent platform | ❌ | ✅ SgCookieOptin (functional/statistics/marketing/external) | ✅ Elementor popup cookie bar |
| Trackers observed | **none** (0 third-party requests on home) | GA4 `G-GZRGMT838V`, Meta Pixel (after consent) | GA4 `G-80QZ6KQTKG`, Meta Pixel, LinkedIn Insight, Hotjar |
| Cookies (before consent) | 0 | 0 | 0 |
| Cookies (after consent) | 0 | — | 21+ (analytics/marketing/session) |
| Storage keys | `myKitchenAdDismissed` | — | `elementor`, `hj*`, `_gcl_ls`, `li_adsId`, chat plugin keys |
| Google Maps | ✅ contact page embed | ❌ | ❌ |
| **Interaction accessibility** | | | |
| Focus indicator | ✅ `outline: auto 1px` on all tab stops | ✅ | ✅ (custom `solid 1px #c9b195`, 12/14 stops) |
| `<main>` + H1 | ❌ no main, no H1 on home | ✅ both | ✅ both |
| Skip link | ❌ | ✅ | ✅ |
| Menu/ARIA state | ✅ `aria-expanded` on triggers | ⚠️ hover menus, no `aria-expanded`; hidden links remain tabbable | ⚠️ hover menus; `aria-haspopup` present |
| Icon-only controls named | ❌ (hamburger, heart, arrows) | ⚠️ some | ⚠️ 62 empty links site-wide |
| Form labels | ❌ placeholders only | ⚠️ select label | ✅ visible labels |
| Mobile menu scroll-lock release | ⚠️ lock persisted after Escape | — | — |

---

## Action-count snapshot (observed, home page)

| Metric | My Kitchen | Häcker | SEAFORM |
|---|---|---|---|
| Interactive elements (visible) | 42 | 63 | 92 |
| Links | 57 (33 unique) | 119 (71 unique) | 186 (71 unique) |
| Buttons | 31 (mostly nav) | 3 | 7 |
| Forms on home | 0 | 1 (search) | 2 (search) |
| Iframes / videos | 0 / 0 | 0 / 0 | 2 / 1 |
| Nav links in header | 7 + 22 in panels | 48 (10 in open mega panel) | 65 |
| Tab stops sampled with focus ring | 14/14 | 14/14 | 12/14 |

---

## Behavioural patterns worth reusing

1. **Audience routing before product** (SEAFORM): 4 chips (Home Owners / Architects / Developers / Partners) directly under the hero. Strongest IA idea of the three.
2. **Two-tier header for retail** (My Kitchen): black utility bar (offers, store, wishlist) + white nav; converts without cluttering navigation.
3. **Hover mega menu with product imagery** (Häcker): chapter + subline labels, 10 links + 2 large product cards; scannable and calm.
4. **Once-per-session promo** (My Kitchen): cheapest possible frequency cap (`sessionStorage`), but an auto-opening 765px advert on load is hostile to the brand photography.
5. **WhatsApp as primary conversion** (My Kitchen): floating FAB + phone in FAQ, no form dependency — appropriate for the market, and the only channel that provably works.
6. **Native validation before submit** (Häcker/SEAFORM): required country/contact fields block empty submits; visual errors still need auditing (see contrast).
7. **Catalogue modal** (My Kitchen): Print / Download / Open Document is a complete document journey — but 29 MB PDFs need streaming/thumbnail-first UX.
8. **Cookie consent as a gate** (Häcker/SEAFORM): both defer analytics until consent; SEAFORM still ships 21+ cookies after acceptance, so the consent choice matters.

## Bugs / gaps found by execution

- My Kitchen `/find-store` renders no locator (breadcrumb + footer only).
- My Kitchen contact form has no action, no required fields, and produced **no network request** on submit.
- My Kitchen mobile menu left `body { overflow: hidden }` after Escape (scroll lock stuck).
- My Kitchen wishlist heart links to `/#`.
- Häcker `/en/contact` contains no contact form (only the site search); contact is via phone/letter/dealer.
- Häcker cartesian mega-menu links are focusable while the menu is closed (large hidden tab order).
- Häcker meta/GA fire only after consent; consent banner is easy to miss (no persistent settings entry beyond footer link).
- SEAFORM `/get-your-design` returns a 404 page while being promoted in navigation.
- SEAFORM search submit destroys the execution context (full navigation) — the search page is a normal WP search result page.
- SEAFORM chat widget opens but the conversation panel was not identified in the DOM (third-party iframe `about:blank`).
