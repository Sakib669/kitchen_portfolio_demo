# My Kitchen — Design System Teardown

**Site:** https://www.mykitchen-bd.com/ · **Brand:** MyKitchen Modular Cabinets (Tilottoma Group, Bangladesh)
**Teardown date:** 2026-10-26 · **Pages measured:** 10 · **Viewports:** 1440 / 768 / 390
**Method:** rendered-DOM capture with Playwright — computed styles, CSS custom properties, section geometry, screenshots, then aggregation. No brand assets were downloaded; screenshots are analysis evidence only.

Evidence lives next to this file: `raw/home/full-1440.jpg`, `raw/home/viewport-1440.png`, `raw/home/viewport-390.png`, `raw/home/sections/`, `raw/home/components/`, plus `analysis/facts.md` (all raw tables) and `tokens.css` / `tailwind.config.js` (reusable tokens).

---

## 1. Design thesis

My Kitchen reads as a **poster-like, high-contrast kitchen showroom**: white and near-black surfaces, photography doing nearly all the emotional work, and a single vermilion red used as a punctuation mark. It is a Next.js + Tailwind v4 build with an unusually disciplined custom token layer (`--red-brand-color-1`, `--black--brand-color-4`, `--white--brand-color-1`…), but the *applied* system is far smaller than the *defined* one — two chromatic colours and a six-step greyscale carry the whole site.

The layout language is **architectural rather than decorative**: sharp 0px corners on CTAs and image tiles, 1400px containers with 32px gutters, full-bleed image bands, thin 1px rules, no drop shadows, no gradients in use, and section headings set in a light 400 weight with exactly one word coloured red. If Häcker (see sibling report) is quiet German editorial, My Kitchen is South-Asian retail confidence: bigger type, stronger contrast, denser information, and a WhatsApp button always one tap away.

Three signature moves:

1. **Red as a single word.** Section headings are split into `Our` + `Expertise` where only the noun is `#E84538`. The same red returns on the active nav item, the primary CTA, and tiny icon accents — never as a background field.
2. **Full-bleed photography with type overlaid at the edge.** Hero and image tiles put white type directly on dark kitchen photos; the black hero panel on desktop is the one place type gets a solid field.
3. **Zero-radius, zero-shadow CTAs.** Buttons are rectangles (0px) with 1px borders, or solid red; only the secondary "Learn More" is a pill. Shadow is reserved for floating UI (dropdowns, toasts), not layout.

---

## 2. Colour

### 2.1 Applied palette (area-weighted from rendered pixels, 10 pages)

| Role | Hex | HSL | Where it actually appears | Weight |
|---|---|---|---|---|
| Page canvas | `#F5F5F5` | 0° 0% 96% | body/app wrapper, gallery pages, FAQ panels | 93.1M px² |
| Surface | `#FFFFFF` | 0° 0% 100% | nav bar, cards, content bands | 8.44M px² |
| Deep ink / hero panel | `#010202` | 180° 33% 1% | desktop hero left panel, image overlays | 1.29M px² |
| Footer / dark band | `#0A0A0A` | 0° 0% 4% | footer, dark CTA strip | 1.15M px² |
| Body text | `#1C1C1C` | 0° 0% 11% | all headings and body copy | 2.12M px² (5.3k chars) |
| Secondary text | `#444444` | 0° 0% 27% | descriptions, intros | 6.9k chars |
| Hairline / tile bg | `#E6E6E6` | 0° 0% 90% | 2px dividers, image tile wells | 4.74M px² |
| Card surface | `#EBEBEB` | 0° 0% 92% | brand-partner cards | 0.55M px² |
| Muted / placeholder | `#939494` | 180° 0% 58% | hero outline CTA text, captions | text only |
| **Brand red** | **`#E84538`** | **4° 79% 56%** | emphasised heading words, primary CTA, active nav, icons | 48.8k px² + 190 chars |
| Near-black token | `#212424` | 180° 4% 14% | black pill "Learn More" | 32.5k px² |

**Rule of use.** The page is ≈99% greyscale by area. Red never fills a section: it is type (heading keyword), a small solid button (60px tall), a 1px underline/active state, or an icon. The only large red surface observed was the promo modal (a marketing overlay, not the core system).

### 2.2 Defined token layer (CSS custom properties, `:root`)

The site ships a complete brand palette as CSS variables — a Tailwind v4 `@theme` pattern. Several tokens are defined but never painted:

| Variable | Value | Painted? |
|---|---|---|
| `--red-brand-color-1` | `#E84538` | yes — the accent |
| `--black-brand-color-1` | `#010202` | yes — hero panel |
| `--black--brand-color-2` | `#0A0A0A` | yes — footer |
| `--black--brand-color-3` | `#212424` | yes — pill button |
| `--black--brand-color-4` | `#1C1C1C` | yes — text |
| `--black--brand-color-5` | `#444444` | yes — body copy |
| `--black--brand-color-6` | `#646464` | defined only |
| `--white--brand-color-1` | `#F5F5F5` | yes — canvas |
| `--white--brand-color-2/6` | `#D4D4D4` | defined only |
| `--white--brand-color-3` | `#EBEBEB` | yes — cards |
| `--white--brand-color-5` | `#E6E6E6` | yes — dividers |
| `--white--brand-color-7/8` | `#989898` / `#939393` | mostly defined only |
| `--white--brand-color-9` | `#FFFFFF` | yes — surfaces |
| `--green--brand-color-1/2` | `#53A653` / `#418D41` | **defined only** |
| `--blue--brand-color-1` | `#0075FF` | **defined only** |
| `--red-danger-color-1` | `red` | semantic |
| `--red-warning-color-1` | `#FF5F15` | semantic |

**Rebuild implication.** Ship the applied palette (`--red`, five neutrals, white) and keep unused brand ramps out of the stylesheet. The "defined but unused" greens/blues are a maintenance smell, not part of the design.

### 2.3 Utility / third-party colours

`#25D366` (WhatsApp floating CTA), `#EF4444`/`#DC2626`/`#B91C1C` (promo modal + status), `#9CA3AF`/`#E5E7EB`/`#D1D5DB` (Tailwind defaults in reviews/slider controls), toast-library greys. These should be excluded from any brand palette — they are component-library or channel colours.

### 2.4 Contrast

Measured text/background pairs: 21 distinct pairs, **6 below WCAG AA 4.5:1**. The real recurring issues (after discarding off-canvas menu artifacts):

- **Red as small text fails.** `#E84538` on `#FFFFFF` = 3.93:1 and on `#F5F5F5` = 3.61:1. At 48px+ the red heading words pass the 3:1 large-text threshold, but red 14–16px labels (active nav, footer wordmark, links) do not.
- `#9CA3AF` on `#E5E7EB` = 2.05:1 and on `#F5F5F5` = 2.33:1 — disabled/pagination controls and menu labels.
- `#939494` on `#F5F5F5` ≈ 2.2:1 — hero outline CTA resting state and image-tile captions; fails AA at 20px.
- `#F5F5F5` on `#E84538` = 3.61:1 — white/near-white 16–20px labels on the red button and red gallery band.
- Core reading pairs are solid: `#1C1C1C` on `#F5F5F5` ≈ 15.4:1, `#444444` on `#F5F5F5` ≈ 8.9:1, white on `#010202` ≈ 20:1.

---

## 3. Typography

**One family: Inter.** Self-hosted variable font (`Inter 100–900`, woff2 via Next.js font optimisation) with a metric-compatible `Inter Fallback` mapped to local Arial. No display serif, no second face — hierarchy comes from scale, weight and colour, not from family contrast.

### 3.1 Rendered type scale

| Size | Weight | Line-height | Transform | Role / observed usage |
|---|---|---|---|---|
| 72px | 400 | 72px | none | Page hero headings on sub-pages ("Wardrobes", "Style in Focus") |
| 72px | 700 | 72px | none | Home hero "Designs That Define Your Space" |
| 48px | 400 | 48px | none | Section headings ("Our Expertise", "Sets Us Apart", "Brand Partners") |
| 48px | 700 | 48px | none | Split-text emphasis headings |
| 36px | 700 | 40px | uppercase | Image tile labels: WARDROBES, WALK-IN CLOSETS, VANITIES, ACCESSORIES |
| 36px | 400 | 40px | none | Sub-page section headings ("Who We Are", "Our Leadership") |
| 30px | 400 | 36px | none | Kicker above a heading ("what" above "Sets Us Apart") |
| 24px | 700 | 32px | none | Card titles, people names, service labels |
| 20px | 700 | 28px | none | Feature/card headlines, stats |
| 20px | 500 | 28px | none | Small CTA text, secondary controls |
| 18px | 400 | 28px | none | Lead paragraphs, hero body, pill CTA label |
| 16px | 400 / 600 / 700 | 24px | none | Body copy, nav links (700), footer links |
| 14px | 400 / 500 / 700 | 20px | none | Utility bar, captions, legal |

### 3.2 Typographic rules

- **Display line-height collapses to 1.0.** 72/72 and 48/48 — headings are set as solid blocks, with visual air supplied by section padding instead of leading. This is the single most distinctive type decision on the site.
- **One word per heading is red.** The heading text node is split: `<span>Our </span><span class="text-brandColor">Expertise</span>`. Colour, not italic/underline, carries emphasis.
- **Weight contrast is binary.** 400 for structure, 700 for names/labels/hero. 500 appears only on buttons and small controls. No 300 weights, no variable-font optical play.
- **No letter-spacing styling.** Everything is `normal`; the only tracked type is the browser-default uppercase tile label — which is why the 36px uppercase labels read solid rather than "luxury-spaced".
- **Body measure is wide.** Home intro sits at ~18px/28px across a 50–60% column; paragraph widths reach ~90 characters on sub-pages, wider than the 60–75ch comfortable range.

---

## 4. Layout, grid & spacing

### 4.1 Container & breakpoints

| Property | Value |
|---|---|
| Container max-width | **1400px** (`container` + `max-w-[1400px]`), 1440px page shell |
| Gutter at ≥1400 | **32px** each side |
| Gutter at small | 16–24px |
| Breakpoints (Tailwind v4 defaults + customs) | 640 · 768 · 1024 · 1280 · 1400 · 1536 · 1600 · 1750 (plus a `max-width: 600` block) |
| Grid usage | 205 divs/page: flex and CSS grid both used; grids mostly `grid-cols-2/3/4/5` via Tailwind utilities |
| Column patterns | 50/50 split hero · 2×2 expertise tiles · 5-up feature row with 1px dividers · 4-up masonry gallery · 3-up partner cards |

### 4.2 Section rhythm (homepage, 1440)

| # | Band | Height | Background | Notes |
|---|---|---|---|---|
| 1 | Two-tier header | 96px | black utility bar + white nav | static → fixed translucent on scroll |
| 2 | Hero | 860px | `#010202` panel + photo | 50/50 split, 72px headline, carousel arrows |
| 3 | Our Expertise | 600px | `#F5F5F5`/white + photos | 2×2 tiles, 36px uppercase labels |
| 4 | What Sets Us Apart | 582px | white | 30px kicker + 48px heading + 5 features |
| 5 | Inspiration Gallery | 1102px | white | copy column + 4-col masonry (9 images) |
| 6 | Brand Partners | 635px | `#F5F5F5` | 3 grey cards, partner logos, pill CTAs |
| 7 | Footer | 432px | `#0A0A0A` | 4 link columns + logos + legal |

Spacing scale is a 4px-based Tailwind default: observed paddings `0.25 / 0.5 / 0.625 / 0.75 / 1 / 1.25 / 1.5 / 2 / 2.5 / 3 / 3.5 / 4 / 5 / 6 / 10rem`, with `2.5rem` (40px) and `2rem` (32px) most frequent; on the 10 bands with real vertical padding, **80px** is the norm (10 occurrences), with 144px reserved for hero-scale bands and `0` on most full-bleed image bands. Gaps: 1rem, 2.5rem, 5rem dominate.

### 4.3 Shape & depth

- **Radii:** `0` is the default for buttons and image tiles; `4px` for small controls/inputs; `8px` for content cards; `9999px` only for the secondary "Learn More" pill; `50%` for circular icon buttons and the floating WhatsApp FAB.
- **Shadows:** effectively absent from layout. Observed only `0 4px 12px rgba(0,0,0,.1)` on dropdown/popover surfaces and 2px focus rings (`ring-offset` utilities). Cards are flat `#EBEBEB` fields.
- **Borders:** 1px `#E6E6E6`/`#D4D4D4` hairlines, and 1px `#939494` on the hero outline CTA.
- **Gradients:** defined via Tailwind (`linear-gradient(to bottom, var(--tw-gradient-stops))`) but only used for image overlays, not decorative fields.

### 4.4 Page archetypes (observed across 10 pages)

1. **Split editorial hero (Home):** black type panel / full-bleed image, CTA bottom-left, carousel controls on the photo.
2. **Dark photo hero + white body (Products, Company Profile, Factory, OEM/ODM):** 740–1119px full-bleed dark hero with centred white display heading and one-line subtitle; then white/grey content bands.
3. **Centred display header + grid (Gallery, Products index):** light grey page, 72px centred heading ("Style in Focus"), centred 18px intro, 4-col image grid (12 images, 1364px tall).
4. **Long-form accordion (Contact):** 1881px band — contact form (1 form / 6 inputs) and FAQ list with `h3` questions, plus an embedded map iframe.
5. **Step list (What We Do):** 11 bands — hero, six 296px alternating process rows, a dark `#1C1C1C` feature band, then "Key Features" and footer.

---

## 5. Components

### 5.1 Header (two-tier, static)

```
[black utility bar 40px] ................... Offer + · Find a Store ⌖ · ♡   (right)
[white nav 56px]  (M) MyKitchen | About ⌄  Expertise ⌄  Products ⌄  Sales Point  Events & News  Catalogue  Contact
                   Modular Cabinets
```

- Utility bar: `#000` background, 12–14px white text, red icons, right aligned.
- Nav bar: `#FFF`, 56px tall, logo left with a thin vertical divider, nav centred, 16px/700 links, 40px vertical hit area (measured button height 104px including padding), caret glyphs on the three dropdown parents, active item = red text + 1px underline.
- Header total 96px; `position: static` at the top, then becomes **`position: fixed`, `top: 0`, translucent white `rgba(255,255,255,0.7)` after ~900px of scroll** (observed in the functional pass — see `functional/actions/mykitchen-bd/flows/scroll.json`).
- Mobile: 96px total, logo left, hamburger right, utility bar retained above.

### 5.2 Buttons (measured, all pages)

| Variant | Spec | Usage |
|---|---|---|
| **Primary solid red** | 60px tall · `#E84538` bg · `#F5F5F5` text · 20px/500 · radius 0 · padding 16/40 · no border, no shadow | "See What's Inside" (kitchen/wardrobe pages) |
| **Secondary dark pill** | 48px tall · `#212424` bg · `#F5F5F5` text · 18px/500 · radius 9999px · ~130px wide | "Learn More →" on brand cards |
| **Hero outline** | 288px wide · transparent bg · 1px `#939494` border · `#939494` text on light / white on dark · 20px · radius 0 · padding 16/40 · hover fills white and inverts text · `transition: all 200ms` | "View Our Collection" |
| **Red text link** | 16px/400 white/red, no underline | "View Our Gallery" on red band |
| **Slider controls** | 60×56 · `#EBEBEB80` bg · radius 0 · arrow glyph | hero carousel |
| **Icon buttons** | 40–48px square, radius 0/50%, 1px border or transparent | carousel, wishlist, close |

No button uses a shadow or gradient; interaction feedback is fill inversion plus 200ms `all` transition.

### 5.3 Cards & tiles

- **Brand partner card:** `#EBEBEB`, radius 8px, padding 40px, width 432px, no shadow, no border; partner logo top, 16px/24 body copy, dark pill CTA. (3 per row.)
- **Expertise tile:** full-width image, dark gradient overlay, 36px/700 uppercase white label bottom-left, hover reveals label/hand cursor. 2×2 on desktop, stacked on mobile.
- **Gallery image:** square-ish (aspect ≈1.0–1.26), radius 0, no border/shadow, 4-up masonry with 16–24px gutters; 12 images on the Gallery page.
- **Feature item (What Sets Us Apart):** 5 columns, 1px top rule, 48px icon (grey/red), 24px/700 title, 16px/24 copy, 32–40px vertical padding.
- **Stat/feature block:** 20px/700 label + 24px value, used in the Factory page.

### 5.4 Footer

Black (`#0A0A0A`) 432px band: logo + tagline left, four 16px/700 column headings (Social Links, Useful Links, Products, Talk To Us) with 16px/400 links (`#E5E7EB`), partner webp logos (Tilottoma Group, blum, Kesseböhmer), centred 14px copyright with a red heart. Footer is a link-dense sitemap, not a newsletter footer — no email capture.

### 5.5 Floating & overlay UI

- **WhatsApp FAB:** fixed bottom-right, 56px circle `#25D366`, white glyph, `animate-ping` halo, `hover:scale-110` — the site's strongest conversion element and the only saturated green.
- **Promo modal:** 765×765 radix dialog on load, `#E84538` field, close X, full advertisement creative ("October Mega Deal / FLASH WEEK"), auto-shown. This is a retail pattern, not a luxury one — it is the first thing a visitor sees before the design does.
- **Toasts:** Sonner library (142 `--toast-*`/`--gray*` CSS variables) — form feedback.
- **Dropdowns:** About / Expertise / Products mega-menus, radix navigation, 4px radius, 1px border, shadow `0 4px 12px rgba(0,0,0,.1)`.

---

## 6. Motion

- **No animation library.** No GSAP, Lenis, Swiper, AOS, Framer or Locomotive detected in page globals; the carousel is custom React.
- **Transition vocabulary:** `0.3s cubic-bezier(0.4, 0, 0.2, 1)` is the workhorse (88 measured occurrences), then `0.5s` (45), `0.2s` (26), `0.15s` (15) — standard Tailwind/Radix easings. The only custom curve is `cubic-bezier(0.75, -0.02, 0.2, 0.97)` (2 uses), a soft overshoot.
- **What animates:** hover fills on CTAs, `translate`/`scale` on cards and the WhatsApp FAB, carousel slide transforms, dropdown enter/exit (Radix `data-state` animations), and letter-split heading reveals (headings are physically split into per-character spans — "Sets Us Apart" renders as 13 spans, which is why the DOM has no `h1` on the home page).
- **Reduced motion:** 31 `prefers-reduced-motion` rules per page — better than average for this market.

---

## 7. Imagery & media

- 146 images across 10 pages (~15/page); **85% lazy-loaded**, 88% with `srcset`, and **100% alt coverage** (0 missing `alt`). Formats: WebP/PNG served through Next.js `next/image` (optimiser URLs), with SVG for logos/badges.
- Image treatment: full-bleed hero photography; square-ish gallery crops (`object-fit: fill` on 114 images because Next.js sizes exact boxes, `cover` on 32); dark gradient overlays only where white type lands.
- **No video** on any measured page (0 `<video>`, 0 background video). The home hero is a photo carousel, not video — a deliberate weight/perf choice.
- CSS background images: ~1.3 per page (footer texture/logos, hero overlays); 0.7 gradients per page.

---

## 8. Accessibility (measured)

| Check | Result |
|---|---|
| `lang` | `en` on all pages |
| Landmarks | **No `<main>`/`role="main"` on any page** (0/10); nav + footer only |
| Skip link | none |
| H1s | 15 across 10 pages — **0 on Home, Gallery, Products, Kitchen, Wardrobes** (home hero is a split `<div>`, not `h1`) |
| Alt text | 100% coverage (146/146) |
| Empty links | 10 (icon-only links without accessible name) |
| Empty buttons | 0 |
| Form labels | 6 inputs on Contact; label association only partial |
| Focus styling | 70 `:focus-visible` selectors per page — visible rings implemented |
| Reduced motion | 31 rules per page |
| Contrast | 6 of 21 measured pairs below 4.5:1 (see §2.4); red only passes as large text |
| Tabbable elements | 758 across 10 pages (dense nav/footer) |

**Verdict:** image accessibility and focus states are strong; **document semantics are the weak spot** — a marketing site with no `main`, no skip link, and missing H1s on its most important pages.

---

## 9. Page blueprints

| Page | Bands | What it is |
|---|---|---|
| **Home** | 7 | Split hero → expertise tiles → 5-value prop → gallery feature → 3 partner cards → footer |
| **Products** | 4 | Dark photo hero "Discover Your Perfect Space" → 1950px product/collection grid ("Explore My Kitchen") → footer |
| **Gallery** | 3 | Centred 72px "Style in Focus" + intro + 12-image masonry → footer |
| **Company Profile** | 6 | Dark hero → "Who We Are" → "Our Leadership" (people cards) → "Leading Innovation in…" → footer |
| **Factory** | 5 | Dark hero → factory capability sections → "Key Features" → footer |
| **OEM / ODM** | 5 | Dark hero → capability blocks → "Our OEM/ODM Capabilities" → footer |
| **Kitchen / Wardrobes** | 3 | Dark hero → single long product/materials band with CTA "See What's Inside" → footer |
| **Contact** | 4 | Compact header band → form (1 form, 6 fields) + map iframe + FAQ accordion (1881px) → footer |
| **What We Do** | 11 | Dark hero → six process rows (296px each) → dark feature band → Key Features → footer |

Navigation: `About ⌄ · Expertise ⌄ · Products ⌄ · Sales Point · Events & News · Catalogue · Contact` + utility `Offer · Find a Store · Wishlist` + WhatsApp FAB. Footer repeats the whole tree plus legal and group brands.

---

## 10. Strengths / weaknesses (design critique)

**Working**
- Ruthless palette discipline: red is scarce, so it directs the eye exactly where the business wants it (CTA, keyword, active state).
- Strong photographic system with consistent overlays; type never sits on a busy area without a scrim.
- Zero-radius, flat surfaces feel architectural and match a cabinetry brand better than rounded SaaS cards would.
- Layered header (utility + nav) fits a retailer with stores/offers/wishlist without cluttering the main nav.
- Mobile reflows sensibly: split hero becomes image-with-overlay, nav collapses to hamburger, CTAs go full width.

**Weak**
- **No semantic spine:** no `<main>`, no H1 on the homepage or index pages; headings are animated divs/spans. Hurts SEO and screen readers.
- **Promo modal on load** (765×765 red ad) is the opposite of the premium brand it is selling; it also blocks the hero.
- Low-contrast muted text (`#939494` on `#F5F5F5` ≈2.2:1) in CTAs/captions.
- Wide paragraph measure (up to ~90ch) at 18px weakens reading comfort.
- Defined-but-unused green/blue brand ramps contradict the disciplined applied palette.
- Footer carries no newsletter/lead capture; conversion relies on WhatsApp and the offer modal.

---

## 11. Rebuild recipe

Use `tokens.css` and `tailwind.config.js` in this folder as the source of truth.

```css
:root {
  --mk-canvas: #F5F5F5;
  --mk-surface: #FFFFFF;
  --mk-ink: #1C1C1C;
  --mk-body: #444444;
  --mk-muted: #939494;
  --mk-line: #E6E6E6;
  --mk-card: #EBEBEB;
  --mk-black: #010202;
  --mk-pill: #212424;
  --mk-brand: #E84538;       /* the only accent */
}
```

```html
<!-- Split hero: dark type panel + full-bleed photo -->
<section class="grid lg:grid-cols-2 bg-[#010202]">
  <div class="flex flex-col justify-center gap-6 px-8 xl:px-20 py-24">
    <h1 class="text-[72px] leading-[1] font-bold text-[#F5F5F5]">Designs That<br>Define Your Space</h1>
    <p class="text-lg leading-7 text-[#F5F5F5]/80 max-w-[50ch]">…</p>
    <a class="w-72 text-center border border-[#939494] text-[#939494] py-4 text-xl transition-all duration-200 hover:bg-white hover:text-[#1C1C1C]">View Our Collection</a>
  </div>
  <div class="min-h-[560px] bg-cover bg-center" style="background-image:url(hero.jpg)"></div>
</section>

<!-- Section heading with one red word -->
<h2 class="text-[48px] leading-[1] font-normal text-[#1C1C1C]">
  Our <span class="text-[#E84538]">Expertise</span>
</h2>
```

**Rules to keep:** 1400px container / 32px gutters; 80px section padding; 1.0 display leading; one red word; 0px radius on primary CTAs; 8px radius only on cards; no shadows in layout; 1px hairlines; Inter only (400/500/700).

**Rules to fix if you reuse it:** add `<main>` and real `h1`s per page; raise muted text to ≥4.5:1 (`#6B6B6B` on `#F5F5F5`); cap paragraph measure at ~70ch; remove the auto-open promo modal or defer it to exit intent; delete unused green/blue tokens.
