# Häcker Küchen — Design System Teardown

**Site:** https://www.haecker-kuechen.com/en/ · **Brand:** Häcker Küchen (Rödinghausen, Germany — premium fitted kitchens, 125+ years)
**Teardown date:** 2026-10-26 · **Pages measured:** 11 · **Viewports:** 1440 / 768 / 390
**Method:** rendered-DOM capture (Playwright) — computed styles, CSS custom properties, section geometry, screenshots. No brand assets downloaded; screenshots are analysis evidence.

Evidence: `raw/en/full-1440.jpg` (10233px home), `raw/en/viewport-1440.png`, `raw/en/viewport-390.png`, `raw/en/sections/`, `analysis/facts.md`, `tokens.css`, `tailwind.config.js`.

---

## 1. Design thesis

Häcker is the **quiet German editorial** of the three sites: a narrow 1050px reading column adrift in white space, one humanist sans (Nunito Sans) set at a generous 18px root size, an 18px/27px body rhythm, and an almost absence-of-chrome interface. Colour is not a brand device here — **the colour is the kitchens**. The interface itself is white, `#F7F7F7` and black; the only saturated pixels on the page come from photography (and a hero carousel of material spheres).

The type hierarchy is deliberately compressed: a 36px `h1` and 30.6px `h2` (2rem / 1.7rem of an 18px root) — barely larger than the 18px body. Hierarchy is carried by **weight** (400 body → 500 h1 → 600 h2 → 800 nav), **line-length control**, and vertical air, not by display scale. Where My Kitchen shouts at 72px, Häcker speaks at 36px with 80–120px of quiet around it.

One deliberate exception proves the rule: the **Kitchen Magazine** index opens at **90px/500** and its article titles are set in **32px Adobe Caslon Pro serif** — an editorial gear the rest of the marketing site keeps in reserve.

Signature moves:

1. **The narrow measure.** Content maxes at 1050px with 15px gutters even on a 1440px screen; paragraphs run ~55–65 characters. It reads like a catalogue essay, not a landing page.
2. **Alternating editorial rows.** Every home page section is a 50/50 (or 60/40) image + text pair, alternating sides, on white or `#F7F7F7`, separated by 80–120px of air. No cards, no shadows, no rounded surfaces.
3. **Black pill CTAs.** One button archetype — a 37px black pill with a hairline white border, 12.6px/600 label — repeated six times down the home page.
4. **A material carousel as the hero.** The 2026 slogan "Inspired by simplicity" is an *image*, flanked by a Swiper carousel of five kitchen-material spheres with particle bursts; it's the only "designed" ornament on the page.

---

## 2. Colour

### 2.1 Applied palette (rendered, 11 pages)

| Role | Hex | HSL | Where it appears |
|---|---|---|---|
| Canvas | `#FFFFFF` | 0° 0% 100% | body, most sections, fixed header |
| Alternating band | `#F7F7F7` | 0° 0% 97% | every second editorial section, image wells |
| Ink | `#000000` | 0° 0% 0% | all headings/body, black footer, pill buttons |
| Muted | `#A2A2A2` | 0° 0% 64% | secondary labels, captions |
| Warm off-white | `#F7F4F3` | 20° 14% 96% | rare hover/surface tint |
| Inverse text | `#FFFFFF` | — | footer, black buttons |

There is **no chromatic brand colour**. Zero saturated brand tokens were found in the rendered palette — a deliberate choice for a company whose product *is* coloured cabinetry. (Saturation in screenshots comes entirely from the material spheres and kitchen photography.)

### 2.2 Type colours for contrast

Text is essentially monochrome: `#000` (≈3.3k chars/page), `#A2A2A2` (583 chars), white on dark (221). `#A2A2A2` on white is ≈2.4:1 — it is used for small secondary labels/captions and is the site's main accessibility weakness.

### 2.3 CSS custom properties

Häcker's token layer is minimal: layout and campaign tokens rather than a colour system (`--container-max`, swiper offsets, `g-*` grid classes). The brand palette lives in compiled SCSS variables, not runtime CSS variables — unlike the other two sites, there is no `--brand-color-*` layer to harvest. `tokens.css` in this folder reconstructs the observed values.

---

## 3. Typography

**Primary: Nunito Sans** (self-hosted woff2, weights 400/600/800 + italics, `font-display: swap`, subset by unicode-range).
**Editorial serif: ACaslonPro** (Adobe Caslon Pro 400 / 400 italic / 600) — used on the Kitchen Magazine article titles (32px/400), the magazine sign-off (45px/400) and presumably print/campaign collateral.

**Root font-size is 18px, not 16px.** Every measured size is a rem multiple of 18: `0.7rem = 12.6`, `0.77rem = 13.86`, `0.88rem = 15.84`, `1rem = 18`, `1.7rem = 30.6`, `2rem = 36`.

### 3.1 Rendered type scale

| Size (rem) | Weight | Line-height | Role |
|---|---|---|---|
| 90px (5rem) | 500 | 108px (1.2) | Kitchen Magazine `h1` — the one display moment on the site (Nunito Sans) |
| 45px (2.5rem) | 400 | 50px (1.11) | Magazine sign-off "Visit us on our Social Networks" (ACaslonPro) |
| 36px (2rem) | 500 | 43.2px (1.2) | Page `h1` / intro headings |
| 32px (1.78rem) | 400 | 38.4px (1.2) | Magazine article `h2` titles (ACaslonPro serif) |
| 30.6px (1.7rem) | 600 | 36.72px (1.2) | Section `h2` headings |
| 18px (1rem) | 400 | 27px (1.5) | Body paragraphs — the dominant text |
| 18px (1rem) | 700 | 27px | "Skip to content", emphasised inline |
| 15.84px (.88rem) | 400 | 23.76px (1.5) | Nav sub-labels, captions, breadcrumbs |
| 15px | 800 | — | Top-level nav label (bold, small) |
| 13.86px (.77rem) | 400 | 20.8px | Legal, footer meta |
| 12.6px (.7rem) | 600 | 15.12px | Button labels (with 0.7–1px tracking when caps) |

### 3.2 Typographic rules

- **Heading scale is only 1.7× body** (36 vs 18). Contrast comes from weight and space, not size.
- **Two-line nav labels.** Each top-level nav item is a bold main word (`Inspiration`) with a lighter sub-line (`Kitchens & more`) — a catalogue-style "chapter + subtitle" pattern that also appears in the mega menu.
- **Body copy is long and centred on mobile.** Home paragraphs are 18px/27px, ~60ch, and the mobile layout centres body text (unusual for long copy, but consistent with the catalogue feel).
- **No letter-spacing on normal text**; tracking appears only in the all-caps micro-labels and button labels.
- **Serif is an editorial mode, not a brand face.** Caslon appears only in magazine content; the marketing pages stay monofamily. That switch is a smart content-type signal: corporate pages = sans, stories = serif.

---

## 4. Layout, grid & spacing

| Property | Value |
|---|---|
| Content container | **1050px** max width, 15px gutters (`container py-lg-3 g-lim g-lim-66p`) |
| Wide container | 1250px (occasional full-width rows) |
| Page shell | 1440px viewport, `overflow-x: hidden` |
| Section separation | 80–120px of air between bands; CSS padding sits mostly on inner containers (36–54px measured) |
| Homepage height | 10,233px at 1440 |
| Breakpoints | 350, 500, 550, 576, 590, 768, 1000, 1200, 1250, 1350, 1400, 1450, 1600, 1850 (min- and max-width pairs) |
| Grid | Bootstrap 5-style 12-column (`col-*`, `row`, `g-*` gap classes) inside a custom TYPO3 layout |
| Radii | Only `126px` (pill buttons) and `2–4px` (inputs/swatches); sections/photos are square |
| Shadows | None in layout; only hover lift on cards/pills via `box-shadow` transitions |
| Borders | 1px `rgba(255,255,255,.25)` on black pills; 1px `#e5e5e5` separators; 1px under header |

### 4.1 Homepage section rhythm (1440)

| # | Band | Height | Notes |
|---|---|---|---|
| — | Fixed header | 92px | white, mega menu, `position: fixed` |
| — | Hero carousel | 700px | Swiper, 5 campaign/material images, arrows + progress |
| 1 | Intro | 429px | `h1` 36/500 + body, centred, 1050px column |
| 2 | A Kitchen Designed Just for You | 1171px | image left / text right |
| 3 | In our kitchens, people come first | 914px | text left / image right |
| 4 | A Career at Häcker Küchen | 1271px | text left / image right (tall) |
| 5 | Do you dream of a colorful kitchen? | 407px | centred essay + CTA |
| 6 | (image pair) | 555px | two-up photography |
| 7 | The Kitchen Magazine | 778px | image left / text right |
| 8 | Your Kitchen — Your Choice | 353px | centred essay + CTA |
| 9 | (planner image pair) | 365px | plan drawing + render |
| 10 | Certified Quality | 993px | certification logo grid |
| 11 | Footer | 884px | black, 5 link columns, address, showroom hours |

### 4.2 Page archetypes

1. **Editorial home** — alternating image/text rows, two centred essay blocks, one logo grid.
2. **Product-line page** (`concept130`, `systemat`) — 36px `h1`, then 6–8 alternating feature rows (600–1400px each), colour/finish section, dealer CTA.
3. **Cabinet-range detail** (`concept130/perfect-soft-black`) — hero render + spec/colour pickers + gallery.
4. **Kitchen styles / furniture / manufacturer** — long-form catalogue pages (10k+ px), image + copy rows.
5. **Planner** — interactive configurator entry + explainer.
6. **Magazine** — article index and long-form article template.
7. **Career / Press / Dealer search** — list + form pages.

---

## 5. Components

### 5.1 Header (fixed, 92px, white)

```
[Häcker logo 160px]   Inspiration ⌄   Company ⌄   Service ⌄   Career ⌄      Kitchen planner ⌄?   🌐 en   ⌕
                       Kitchens & more  Values & more  Consultation & more  Jobs & more
```

- Fixed white bar, 92px, `#main-header.fixed-top`; logo is SVG with black and white variants (transparent-over-hero state swaps to white).
- Mega menu: full-width panel with 2–4 columns of link lists plus 2–4 large product images (systemat / concept130 cards) — 48 links in the DOM, 11 dropdown containers.
- Right cluster: "Kitchen planner" outlined pill, language dropdown with globe icon (`en`, 10 locales available), search icon.
- Mobile: logo + hamburger (off-canvas `mmenu` pattern), same mega content as accordion.

### 5.2 Buttons (single archetype)

| Spec | Value |
|---|---|
| Shape | Black pill, radius **126px** |
| Size | 37px tall, ~167px wide |
| Fill | `#000000` |
| Label | `#FFFFFF`, **12.6px / 600**, normal case, 15.12px line-height |
| Padding | `10px 30px` |
| Border | `1px solid rgba(255,255,255,0.25)` — a hairline that separates the black pill from dark photography |
| Transition | `0.1s ease-in` |
| Instances | 6 on the home page ("Get inspired now", "Go to the Kitchen Planner", "Apply Now", "Find the Perfect Kitchen", "Design my kitchen now", "Plan your own kitchen now") |

Interaction is minimal: a fast 100ms fill/opacity change. No arrows, no icons inside buttons.

### 5.3 Imagery & cards

- **No card components.** Content is image + text columns with generous whitespace; image aspect ratios cluster at **2.06:1** (wide kitchen shots), **1.42:1** (4:3), **0.71:1** (portrait), plus tiny 1:1 swatches.
- **Hero carousel:** full-width 700px Swiper, autoplay 4s, with round 60px arrow buttons (1px black border) and a 200px progress bar under the hero.
- **Material swatches:** 5 perfect circles (spheres) with names, used as the navigation between material stories.
- **Certification grid:** RAL, DGM, DMSZ ISO 9001/14001/45001, PUREresist, Qualitätszeichen — 9 logos in a loose 4+4+1 grid.
- **Dealer CTA band:** full-width image + "Find a dealer near you now!" (`h3`).

### 5.4 Footer (black, 884px)

Five link columns — Kitchens, Products, Resources, Häcker, Career (with Vacancies sub-links) — 15px/400 white links. Bottom row: white Häcker logo (160px), company address (Häcker Küchen GmbH & Co. KG, Werkstraße 3, 32289 Rödinghausen), showroom hours (Mon–Fri 8–18, Sat 9–14), and a "Member of German Design Council" lockup. No newsletter signup on the measured pages; contact is via dealer search / contact form.

---

## 6. Motion

- **jQuery-based TYPO3 front-end**, bundled Swiper for the hero carousel (autoplay 4s) and image sliders. No GSAP, Lenis, Locomotive, Framer or AOS.
- **Transition vocabulary:** `0.4s ease` is the house style (188 occurrences — swiper slides, fades, hover states), followed by `0.1s ease-in` (buttons, 10×), `0.2s ease` (opacity), `0.4s ease` for width/transform.
- **What animates:** carousel slide/fade, image hover zooms, nav mega-menu open (opacity/translate), button fill, accordion on mobile.
- **No scroll-triggered reveals** (no AOS/IntersectionObserver reveal attributes detected). The page simply is what it is — again, catalogue logic.
- `prefers-reduced-motion` handling: present in CSS but sparse (see facts).

---

## 7. Imagery & media

- 72 images on the home page, ~69 on the product page; formats JPG/PNG/SVG served directly from TYPO3 `/fileadmin/` (no CDN image optimiser, no `srcset` — 0 responsive variants detected).
- **Lazy loading only ~25%** of images — a performance weakness for a 10k-px image-heavy page.
- Alt text: 2 of 72 missing on home (97% coverage), better than most.
- **No video, no CSS background images, no gradients.** All photography is an `<img>`; the design relies on layout and type, not effects.
- Colour is delivered exclusively through kitchen/material photography — the interface never tints imagery.

---

## 8. Accessibility (measured)

| Check | Result |
|---|---|
| `lang` | `en-US` |
| Landmarks | `<main>`, nav, header, footer present (4 landmarks) |
| Skip link | present (`Skip to content`) |
| H1 | at least one per page — 12 across 11 pages (36px/500, 90px on magazine) |
| Alt text | 2 missing of 738 site-wide (99.7%); 2 of 72 on the home page |
| Empty links / buttons | 4 / 3 on home; 47 / 25 across 11 pages |
| Focus styles | present; `.skip-link` visually hidden until focus |
| Contrast | primary pairs 21:1 (black/white); 4 of 10 measured pairs fail AA, all muted greys (`#A2A2A2` on white = 2.55:1, `#969696` on `#F7F7F7` = 2.76:1) |
| Tabbable | dense mega menu (48 nav links) — long tab order |
| Reduced motion | partial |

**Verdict:** structurally the most correct of the three (main, h1, skip link, landmarks, 99.7% alt), let down by low-contrast grey micro-copy (2.55:1) and non-responsive images.

---

## 9. Information architecture

- 10 locales (en, de, es, fr, it, nl, pl, dk + commented sv/no), same tree per locale.
- 5 top nav chapters: **Inspiration** (styles, interior, accessories, in-house exhibition, Blaupunkt, magazine, media), **Company** (about, values, press, awards, project business), **Service** (dealer search, planner, brochures, contact, downloads), **Career**.
- Two product lines dominate: **systemat** (stylish & comfortable) and **concept130** (reliable & unique), plus Limited Edition 1926.
- Conversion path: dealer search → planner → brochure/download → contact. No e-commerce, no prices.
- URL pattern: flat, locale-prefixed (`/en/kitchen-styles`, `/en/concept130`, `/en/systemat/...`), TYPO3 sitemaps per locale.

---

## 10. Strengths / weaknesses

**Working**
- Exceptional calm and confidence: narrow column, huge whitespace, tiny type hierarchy — reads as a printed kitchen catalogue.
- The magazine's 90px display + Caslon serif gives the brand an editorial second gear without diluting the corporate sans voice.
- One typeface used with discipline (400/500/600/800) at a consistent 18px root; copy quality and length match the brand.
- The image/text alternating rhythm is a scalable content template — every product line page reuses it without feeling repetitive.
- Material-sphere hero gives colour to a monochrome system without tinting the interface.
- Structurally accessible: main landmark, single H1, skip link, strong black/white contrast.

**Weak**
- **Responsive images absent** (no srcset) and lazy-loading only ~25%: a 10k-px page ships desktop-sized JPGs to phones.
- `#A2A2A2` micro-copy fails contrast.
- 36px H1 with no display moments can feel *too* quiet on a homepage; the hero is an image, so the page opens with a slogan the crawler can't read (alt text only).
- 92px fixed header + mega menu with 48 links makes navigation heavy relative to the visual calm.
- ACaslonPro is downloaded on every page but only used in magazine content — a cache/payload cost unless it is lazy-loaded per template.
- Long pages (10k+ px) with no in-page navigation or progress cues.

---

## 11. Rebuild recipe

```css
:root {
  --hk-white: #FFFFFF;
  --hk-band: #F7F7F7;      /* alternating section */
  --hk-ink: #000000;
  --hk-muted: #A2A2A2;     /* raise to #6B6B6B for AA */
  --hk-container: 1050px;
  --hk-gutter: 15px;
  --hk-root: 18px;         /* the signature: 18px rem base */
  --hk-radius-pill: 126px;
}
html { font-size: 18px; }
body { font-family: "Nunito Sans", Arial, sans-serif; font-size: 1rem; line-height: 1.5; color: #000; background: #fff; }
```

```html
<!-- editorial row -->
<section class="grid md:grid-cols-2 items-center gap-16 py-[120px] max-w-[1050px] mx-auto px-[15px]">
  <img src="kitchen.jpg" alt="" class="aspect-[2.06/1] object-cover w-full">
  <div>
    <h2 class="text-[1.7rem] leading-[1.2] font-semibold">A Kitchen Designed Just for You</h2>
    <p class="text-[1rem] leading-[1.5] mt-6 max-w-[52ch]">…</p>
    <a class="inline-block mt-8 rounded-full bg-black text-white text-[.7rem] font-semibold tracking-[.02em] px-[30px] py-[10px] border border-white/25 transition-colors duration-100 hover:bg-white hover:text-black">Get inspired now</a>
  </div>
</section>
```

**Keep:** 18px root; 1050px column; 1.7× heading scale; alternating white/`#F7F7F7` rows; black pills with hairline border; square photography; no shadows or cards.

**Fix on reuse:** add `srcset`/`sizes` and eager-load LCP images; raise muted grey to AA; replace the image-only hero slogan with live text + alt-driven visual; shorten the tab order with a "skip navigation" target.
