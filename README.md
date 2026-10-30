# AANGAN Kitchens

A bilingual kitchen website prototype for Bangladesh. The public site lives at `/en` and `/bn`; `/studio` edits the current browser's copy of its content. Built with Next.js App Router, TypeScript, Tailwind CSS, local shadcn-style components, Zod, and original imagery. The prior design research remains below and in `sites/`, `functional/`, and `shared/`.

**This is a browser-local demo.** Every visitor gets the bundled starter content on first use. Edits and contact notes stay in that visitor's `localStorage`; they are never sent to the brand or shared with others. Export a JSON backup from `/studio` before clearing browser data. The contact form visibly confirms “Saved on this device, not sent.” No account, CMS, database, email service, analytics, or API key is used.

## Run the website

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The root redirects to `/en`. To check a release, run `pnpm typecheck`, `pnpm lint`, `pnpm build`, then `pnpm test:e2e` after installing a Playwright browser with `pnpm exec playwright install chromium`. The local checkout used symlinked packages because network package installation was unavailable; a fresh clone should use `pnpm install` to create its own `node_modules` and lockfile.

For Vercel, import this repository with the root as the project directory and set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin. Vercel also supplies its own URL variables for previews. No secrets are required. A deployment is not connected from this workspace.

The application starts with four bundled kitchen photographs in `public/images/`, Noto English and Bangla fonts in `public/fonts/`, three collections per language, and six kitchen concepts per language. The brand name AANGAN is a provisional original identity. Contact phone and WhatsApp fields are blank until a real number is available. `/studio` can edit copy, collections, kitchens, gallery choices, featured collections, brand labels and contact channels; it can also review saved notes and import, export or reset the browser data. The editor changes the local view, while the server HTML, metadata and sitemap continue to use bundled starter content.

---

# Original design reverse-engineering study

Three kitchen brands, three design languages, measured from the live sites:

| Site | Stack | Position | Teardown |
|---|---|---|---|
| [My Kitchen](https://www.mykitchen-bd.com/) | Next.js 15 + Tailwind v4 | Bangladeshi modular-cabinet manufacturer, retail | [design-system.md](sites/mykitchen-bd/design-system.md) |
| [Häcker Küchen](https://www.haecker-kuechen.com/en/) | TYPO3 + Bootstrap + Swiper | German premium kitchens, dealer network | [design-system.md](sites/haecker-kuechen/design-system.md) |
| [SEAFORM](https://www.seaform.com/) | WordPress + Elementor | German-made luxury kitchens, global | [design-system.md](sites/seaform/design-system.md) |

**Open [`compare.html`](compare.html)** for the design gallery (screenshots, palettes, type specimens, component crops, metrics, section rhythm) and **[`functional/functions.html`](functional/functions.html)** for the action/evidence gallery (menus, search, forms, modals, chat, downloads, third parties). Start with [`shared/design-patterns.md`](shared/design-patterns.md) for the cross-site pattern library and the "which direction to copy" table; the functional capability matrix is [`functional/feature-matrix.md`](functional/feature-matrix.md).

> Research on public marketing pages only. No login, no paywall/captcha bypass, no downloaded brand assets. Screenshots are analysis evidence; fonts, photography and copy remain their owners'. `seaform.com` declares `Crawl-delay: 10` in robots.txt — the crawler honours a 9s delay for it.

---

## What's in here

```
kitchen-deom/
├── README.md                        ← this file
├── compare.html                     ← visual comparison gallery (self-contained)
├── shared/
│   └── design-patterns.md           ← cross-site pattern library + direction guide
├── functional/
│   ├── README.md                    ← functional method, guardrails, rerun commands
│   ├── functions.html               ← action-evidence gallery (screenshots + step logs)
│   ├── feature-matrix.md            ← capability matrix, all three sites
│   └── actions/<site>/              ← flows JSON, shots, summary, facts, form specs
├── sites/
│   ├── mykitchen-bd/
│   │   ├── design-system.md         ← design teardown (colour/type/layout/components/motion/a11y)
│   │   ├── functions.md             ← functional teardown (actions, flows, forms, state, network)
│   │   ├── tokens.css               ← ready-to-use CSS custom properties
│   │   ├── tailwind.config.js       ← Tailwind theme reconstructed from measurements
│   │   ├── analysis/
│   │   │   ├── tokens.json          ← structured design tokens
│   │   │   ├── raw-analysis.json    ← per-page flows, palettes, components
│   │   │   └── facts.md             ← auto-generated evidence tables
│   │   ├── crawl-meta.json
│   │   └── raw/<page>/              ← page.json, page.html, screenshots, section/component crops
│   ├── haecker-kuechen/             ← same structure
│   └── seaform/                     ← same structure
└── tools/
    ├── sites.mjs                    ← page manifests (10 / 11 / 11 pages)
    ├── extract-in-page.mjs          ← in-browser design snapshot (computed styles, CSS vars, sections, components, a11y)
    ├── extract.mjs                  ← crawler: overlays/cookies, lazy-scroll, screenshots at 1440/768/390, CSS harvest
    ├── analyze.mjs                  ← aggregation → tokens.json / facts.md / tokens.css / tailwind.config.js
    ├── build-compare.mjs            ← compare.html generator
    └── actions/                     ← functional harness: run.mjs, flows.mjs, sites.mjs, aggregate.mjs, build-functions-html.mjs
```

**Numbers:** 32 pages, 3 breakpoints per page (1440 / 768 / 390), 321 measured page sections, ~2,000 rendered style records, ~1,100 colour observations, **56 functional flows, 101 flow screenshots, 8,527 interaction requests, 717 blocked form/beacon writes**.

---

## Method

Three-stage pipeline (all scripts are in `tools/`, re-runnable):

1. **Capture** (`extract.mjs` + `extract-in-page.mjs`)
   - Playwright Chromium at 1440×900, DPR 1, light colour scheme, `en-US`.
   - Accepts cookie banners (OneTrust/Cookiebot/SG Cookie Optin/Elementor/role-text fallbacks), records and clears promo/newsletter overlays, then slowly scrolls the page to trigger lazy images and scroll-reveal animations.
   - Per page: full DOM snapshot, computed styles for every visible element up to 12k nodes, CSS custom properties + `@font-face` + media queries from all same-origin/inline CSS, section geometry, heading/type inventory, component signatures, contrast pairs, motion, media inventory, a11y landmarks.
   - Screenshots: desktop viewport, full-page JPEG, mobile full-page, tablet/mobile viewports, up to 8 section crops and component crops (header, buttons, cards, footer, overlays).
2. **Tokenize** (`analyze.mjs`)
   - Area-weighted colour palette (background area, text characters, CSS declaration frequency) with role assignment: used brand vs defined-only vs library/utility colours.
   - Type scale merged by `family|size|weight|line-height|tracking|case`, including split-text headings that have no semantic `h1`.
   - Spacing rhythm, containers, breakpoints, radii, shadows, motion durations/easings; component variants (buttons/cards/nav/labels/links); contrast and accessibility roll-up.
3. **Export / report**
   - `tokens.json`, `tokens.css`, `tailwind.config.js`, `facts.md` per site; hand-written `design-system.md` teardowns; `compare.html` gallery.
4. **Functional observation** (`tools/actions/`)
   - 21 configurable flows per site (nav, mobile menu, search, carousel, accordions, tabs, forms, modal, language, planner/detail probes, chat, video/lightbox, hover, links/assets, 404, mobile UI, consent, storage).
   - POST/PUT/PATCH are aborted at the browser boundary and recorded; validation is observed without submitting; every flow writes steps, requests, screenshots and blocked-write payloads.
   - Aggregated into `summary.json` / `facts.md`, rendered as `functional/functions.html`.

Re-run everything:

```bash
cd "/home/sakib/Desktop/Projects Old/kitchen-deom"
# Playwright is a root dev dependency; run pnpm install in a fresh checkout
node tools/extract.mjs --site seaform            # add --force to re-crawl, --only /path to target pages
node tools/analyze.mjs                          # add --site <slug> for one site
node tools/build-compare.mjs

# functional layer
node tools/actions/run.mjs --site seaform          # 21 flows, ~6–10 min
node tools/actions/aggregate.mjs                   # summary.json + facts.md
node tools/actions/build-functions-html.mjs        # functions.html
```

---

## Key comparative findings

| | My Kitchen | Häcker Küchen | SEAFORM |
|---|---|---|---|
| Design idea | Poster retail — red punctuation, 72px type, image grid | Editorial calm — 1050px column, 1.7× type scale, whitespace | Luxury catalogue — tracked caps, cinematic 900px bands, champagne accent |
| Body ⇄ display | 16px → **72px** (4.5×) | 18px → **36px** (1.7×) | 12–14px → **20–25px**, sometimes 77px |
| Type families | Inter only (variable) | Nunito Sans + ACaslonPro (magazine only) | Optima + Roboto + Open Sans + Lato + Poppins |
| Brand colour | `#E84538` (used on <1% of pixels) | **none** — photography is the colour | `#C9B195` champagne (text only) |
| Container | 1400px / 32px gutters | **1050px** / 15px gutters | 1330px full-width |
| CTA | Red 0-radius block | Black 126px pill with hairline border | Black 0-radius uppercase rectangle |
| Motion | Tailwind 150–300ms, letter-split headings | Swiper 400ms + 100ms button fill | Elementor 300ms + 500ms hover zoom |
| Homepage | 4,883px | 10,233px | 10,469px |
| Strongest idea | Red = one word per heading | Alternating image/text editorial rows | Audience-first routing + champagne labels |
| Biggest flaw | No `<main>`, no H1 on home/index pages | No responsive images, 25% lazy loading | No focus styles, inconsistent H1 scale |

The three sites agree on the fundamentals: **photography carries the colour, the interface stays monochrome, and the hero is a dark kitchen photograph with white type.** They diverge on how loudly to speak — 72px retail, 36px editorial, 25px luxury — and that single decision cascades into layout density, CTA shape, motion and conversion strategy.

---

## Functional findings (short version)

The full action inventory, step logs and screenshots live in **[`functional/functions.html`](functional/functions.html)** and each site's `functions.md`. Highlights:

| | My Kitchen | Häcker Küchen | SEAFORM |
|---|---|---|---|
| Interaction model | React/Radix single-page marketing; 3 mega menus, 3-slide carousel, WhatsApp FAB | TYPO3 brochure; hover mega menus, Swiper hero, dealer search | WordPress/Elementor catalogue; hover mega menus, full-screen search, 3 Elementor forms |
| Forms | Contact form has **no action, no required fields and sent nothing** on submit | Dealer search (250-country select) validates natively; **no contact form exists** | Contact 19 fields + catalogue 21 fields, POST, required fields + consent |
| Consent | no banner because **no trackers** (0 third-party requests) | `SgCookieOptin` gates GA4 + Meta Pixel | Elementor cookie bar gates GA4, Meta, LinkedIn, Hotjar, Clarity, Ads |
| Search | ❌ none | ✅ TYPO3 `/en/search` | ✅ full-screen → `/?s=` (47 results for "kitchen") |
| Catalogue | 9 cards → modal Print/Download/Open, PDF 29.4 MB | brochure links via Service menu | request-only catalogue form |
| Locator | `/find-store` **empty stub** | ✅ dealer search by country | ✅ `/locations` |
| Chat | WhatsApp FAB (`wa.me/8801642912612`) | ❌ | AllInOneChat bubble |
| Worst bug | form unwired + empty store locator | contact page without a contact form | `/get-your-design` promoted but **404** |

### Functional evidence & method
- `functional/README.md` documents the 21 flow types, the write-blocking guardrail, viewport handling and evidence classes (observed/inferred/unknown).
- No REA MCP provider or `rea` CLI was registered in this session, so the supported runtime-observation route (Playwright) was used and every finding is labelled accordingly.
- Häcker rate-limited repeated automation late in the pass; its report marks the affected flows as partial and relies on saved DOM/crawl evidence for those.

## Using the tokens

Each site folder ships a measured token set. Example:

```css
/* sites/mykitchen-bd/tokens.css */
:root {
  --mk-canvas: #F5F5F5;
  --mk-ink: #1C1C1C;
  --mk-brand-100: #E84538;
  --mk-font-size-72: 72px;
  --mk-space-80: 80px;
  ...
}
```

```js
// sites/haecker-kuechen/tailwind.config.js
export default { theme: { extend: { colors: { 'brand-100': '#000000', ... }, fontSize: { ... } } } }
```

Notes:
- Colours are named by measured role (`brand-*`, `neutral-*`, `surface-*`), not by invented brand names.
- Unused "defined" tokens are kept in `analysis/tokens.json` under `color.definedTokens` so you can see what a site *declares* vs what it *paints*.
- `compare.html` and screenshots reference local files only; no external requests.

---

## Scope & limitations

- Only public marketing pages from the manifests were captured; logged-in areas, checkout, configurators and mobile-app views are out of scope.
- Dynamic states (open mega menus, hover, form validation, slider frames) are represented only where they were visible at capture time; hover styles are inferred from CSS/transitions, not screenshots.
- Contrast is computed from the nearest opaque background colour, so text over photography/gradients is excluded or approximate.
- Section detection is heuristic (unwrap layout wrappers → visual bands); a handful of very long Elementor/TYPO3 sections remain as single bands (visible in `raw-analysis.json`).
- The teardowns describe *what is rendered now*; no claim is made about the sites' internal design files or future versions.

*Generated 2026-10-26. Study prepared for design research and rebuild planning, not for 1:1 cloning of commercial sites.*
