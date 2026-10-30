# SEAFORM — Design System Teardown

**Site:** https://www.seaform.com/ · **Brand:** SEAFORM Kitchens & Wardrobes (German kitchens & wardrobes "Made in Germany since 1917"; Australian/global luxury arm)
**Teardown date:** 2026-10-26 · **Pages measured:** 11 · **Viewports:** 1440 / 768 / 390
**Method:** rendered-DOM capture (Playwright) — computed styles, CSS custom properties, section geometry, screenshots. No brand assets downloaded; screenshots are analysis evidence.

Evidence: `raw/home/full-1440.jpg` (10,469px), `raw/home/viewport-1440.png`, `raw/home/viewport-390.png`, `raw/home/sections/`, `raw/home/components/`, `analysis/facts.md`, `tokens.css`, `tailwind.config.js`.

---

## 1. Design thesis

SEAFORM is the **luxury catalogue** of the three: a black-and-white showroom where almost nothing is set larger than 25px, labels are tracked capitals, photography is cinematic and full-bleed, and the only chromatic gesture is a **warm champagne text accent** (`#C9B195`) used on 12–14px micro-labels. It is a WordPress + Elementor build with a 10px rem root, six loaded font families (Optima, Roboto, Open Sans, Lato, Poppins, VisueltPro) and a colour system that is 99% monochrome by design.

The experience is closer to a printed lookbook than a product site: a transparent header floats over a full-viewport hero, the logo is centred like a masthead, navigation is uppercase and tracked, audience segments (Home Owners / Architects / Developers / Partners) are chosen before products, and conversion is "request the catalogue / get your design / apply to concierge" rather than add-to-cart. Sections alternate between white editorial space and near-black cinematic bands (`#141414`, `#121212`, `#101117`), separated by 72–144px of air.

Signature moves:

1. **Small type, wide tracking.** Headlines are 20–25px caps at weight 300 with 0.5–2px letter-spacing; body is 12–14px. Luxury is expressed as restraint and spacing, not size — the inverse of My Kitchen's 72px.
2. **Champagne micro-labels.** `#C9B195` (sand) is reserved for 12–14px uppercase tags like "MADE IN GERMANY — SINCE 1917", "BESPOKE LUXURY KITCHENS", "FASCINATION" — a jewellery-style accent that reads gold on black and disappears on white.
3. **Full-bleed cinematic bands.** Whole sections are single photographs (900px tall) with a centred word or two; the interface disappears, the image speaks.
4. **Masthead navigation.** Centred SEAFORM wordmark over a rule of tracked caps, search icon and hamburger at the edges, plus a permanent vertical "GET IN TOUCH" tab pinned to the right edge.
5. **Audience routing.** Four equal outlined chips directly under the hero — the site asks who you are before what you want.

---

## 2. Colour

### 2.1 Applied palette (rendered, 11 pages)

| Role | Hex | HSL | Where it appears |
|---|---|---|---|
| Canvas | `#FFFFFF` | 0° 0% 100% | most content sections |
| Ink / hero bands | `#000000` | 0° 0% 0% | cinematic sections, footer, buttons |
| Near-black 1 | `#141414` | 0° 0% 8% | full-bleed image sections |
| Near-black 2 | `#121212` | 0° 0% 7% | cinematic bands |
| Deep blue-black | `#101117` | 232° 8% 8% | footer / overlays |
| Carbon | `#171717`, `#151412`, `#0E0E0E` | — | image scrims, panels |
| Body text | `#54595F` | 210° 5% 35% | paragraphs on white |
| Secondary text | `#7A7A7A` | 0° 0% 48% | captions, small copy |
| Warm grey | `#908A7E` | 38° 6% 53% | 12px labels on white |
| **Champagne accent** | **`#C9B195`** | **32° 32% 69%** | 12–14px uppercase labels on dark/white |
| Off-white | `#F7F7F7` | — | rare light bands, form fields |

**Rule of use.** Colour is delivered by photography. The interface is black/white with a single warm metallic accent applied *only to type*. There is no red, blue or green brand colour; the champagne (#C9B195) is the brand's only signature hue and it is measured in characters, not areas.

### 2.2 Colour from Elementor globals

The site carries Elementor's default global palette in its CSS (`#133AF0`, `#13AFF0`, `#37589B`, `#69727D`, `#54595F`, `#333`, `#555`, `#222`, `#F1F1F1`, `#BBB`, `#929292`) — a tell-tale sign of an unpruned Elementor kit. Only `#54595F` is genuinely used (body text). The sharp cyan `#13AFF0` (451 CSS declarations) is a leftover default, not a design decision.

### 2.3 Contrast

| Pair | Ratio | Verdict |
|---|---|---|
| `#FFFFFF` on `#000000` | 21:1 | pass |
| `#54595F` on `#FFFFFF` | 7.07:1 | pass |
| `#666666` on `#FFFFFF` | 5.74:1 | pass |
| `#908A7E` on `#000000` | 6.12:1 | pass (on dark) |
| `#7A7A7A` on `#FFFFFF` | 4.29:1 | **fails AA** (12–14px body/captions) |
| `#908A7E` on `#FFFFFF` | 3.43:1 | **fails AA** (12px labels) |
| `#C9B195` on `#FFFFFF` | 2.06:1 | **fails badly** (labels on light sections) |

The champagne accent is beautiful on black (8.7–9:1) and unusable on white (2.06:1) — a real system bug: the same token is used on both surfaces. Across 11 pages, 3 of 32 measured pairs fail AA.

---

## 3. Typography

Six font families are loaded; four do real work. This is the least disciplined part of the system and the most characterful.

| Family | Role | Observed |
|---|---|---|
| **Optima** | Primary display / labels | h1–h3 at 20–48px, weight 300–400, tracked caps. Rendered char count: ~258 — the dominant face |
| **Roboto** | Secondary headings / tech pages | 60–77px display on Manufacturing ("INDUSTRY 4.0"), page h1s on some pages |
| **Open Sans** | Body copy | 14px/1.6 body default, 12–16px paragraphs |
| **Lato** | UI / buttons / small caps | 12px/500 uppercase buttons, nav chips |
| **Poppins** | Caps labels / mega-menu | 12–14px, weight 300, 1–2px letter-spacing |
| **VisueltPro** | Custom brand face | loaded and used once in measured pages (wardrobe heading) — effectively dormant |

**Root font-size is 10px** (`html { font-size: 10px }`) — Elementor's rem base. That means `1.2rem = 12px`, `2.4rem = 24px`, `4.8rem = 48px`. It makes the CSS compact but fragile and non-standard.

### 3.1 Rendered type scale (all pages)

| Size | Weight | Letter-spacing | Role / samples |
|---|---|---|---|
| 77px | 400 | 2px | Manufacturing hero "INDUSTRY 4.0" (Roboto) |
| 60px | 400 | 0.5px | "CONTRACT DIVISION" (Roboto) |
| 48px | 300 | 2px | Collection heroes "HAMPTONS", "MATERIALS AND COLORS" (Poppins/Optima) |
| 40px | 400 | 1.5px | "ACCESSORIES / LIGHTS INTERNALS" (Optima) |
| 35px | 300 | 0.5px | "FASCINATION" / "SEAFORM" cinematic band (Optima, uppercase) |
| 30px | 300–400 | 2px | Section heroes ("WITHOUT BLACK NO COLOR HAS ANY DEPTH") |
| 25px | 300 | 0.5–1px | Page h1 in most templates ("SEAFORM KITCHENS & WARDROBES", "GLOBAL LARGE SCALE PROJECTS") |
| 24px | 300 | 0.5px | "GET YOUR PERSONAL CONCIERGE", "ORDER YOUR CATALOGUE" |
| 23px | 400 | — | Home h1 |
| 20px | 300 | 2px | Section labels ("SEAFORM KITCHEN COLLECTION") |
| 14px | 300 | 1–2px | Collection names ("MONOGRAM M1", "NIGHT SYSTEM") |
| 12px | 300–500 | 1–2px | Buttons, nav chips, legal, "MADE IN GERMANY — SINCE 1917" |

### 3.2 Typographic rules

- **Everything is capitalised and tracked.** Page headings, section labels, buttons, nav, captions: uppercase with letter-spacing is the default voice. Uppercase + 300 weight is what creates the "engraved" luxury feel.
- **Hierarchy is inconsistent across templates.** H1 ranges from 20px to 25px to 48px (and 77px on Manufacturing). This is Elementor's per-page freedom showing through — the system has no enforced heading scale.
- **Line-height is 1.0–1.5 with wide tracking** at display sizes (25px/1.5, 30px/1.33, 48px/1.0) — some headings are set solid, others airy.
- **Body is small:** 12–14px Open Sans/Roboto with 1.6–1.8 line-height; long paragraphs are rare (copy is split into short editorial blocks).
- **Champagne labels are the only coloured type** (`#C9B195`), always 12–14px uppercase.

---

## 4. Layout, grid & spacing

| Property | Value |
|---|---|
| Container | **1330px** (Elementor full-width), 1140px for narrower editorial, 1000px for text, 1920px for edge-to-edge |
| Gutters | 0px container padding (Elementor columns handle spacing); inner widgets use 20/30/40px |
| Page shell | 1440px, `overflow-x: visible`, smooth scrolling |
| Section rhythm | 72px vertical padding dominant (14 bands), then 140/144px (5 bands), 240px once; full-bleed bands use 0 |
| Section heights | 650px (23), 900px (20), 700px (11), 750px (8), 450px (7) — a 900px full-viewport hero is the standard |
| Grid | Elementor flexbox (3930 flex containers vs 59 grid); grid templates mostly `1440px` single columns, 4-up and 5-up equal columns |
| Radii | 3px (buttons/inputs, 153×), 50%/100% (circles), 0 (sections/buttons), 2px (chips), 6px (cards) |
| Shadows | almost always `none` (119×); only `0 2px 6px rgba(0,0,0,.1)`, `0 0 10px 4px rgba(0,0,0,.1)`, `0 0 8px rgba(0,0,0,.6)` on floating UI |
| Breakpoints | Elementor defaults: 375/479/480/481/600/601/660/767/768/782/800/900/1024/1280… |

### 4.1 Homepage section rhythm (1440)

| # | Band | Height | Background | Notes |
|---|---|---|---|---|
| — | Transparent header | 108px | image | centred masthead, tracked caps |
| 1 | Hero | 828px | photo | full-bleed kitchen, bottom-left overlay copy, vertical GET IN TOUCH tab |
| 2 | Audience chips | (in hero) | `#191A1D` strip | 4 outlined chips: Home Owners / Architects / Developers / Partners |
| 3 | Kitchen Collection | 2607px | white | centred label + 2-col image grid, 8 collections |
| 4 | Explore CTA | — | white | outlined "EXPLORE OUR KITCHEN COLLECTION" |
| 5 | Concierge | 630px | black | "GET YOUR PERSONAL CONCIERGE" + "APPLY NOW" |
| 6 | Wardrobe Collection | 1166px | white | 2-col grid, 4 wardrobes |
| 7 | Witness / FASCINATION | 900px | photo | cinematic "SEAFORM" wordmark band |
| 8 | Catalogue | 630px | `#141414` | "ORDER YOUR CATALOGUE" + "REQUEST CATALOGUE" |
| 9 | Get your design | 900px | photo | full-bleed conversion band |
| 10 | Large scale projects | 675px | black | B2B band |
| 11 | Configure your kitchen | 900px | photo | planner CTA |
| 12 | Footer | 505px | `#101117` | 4 link columns + social + legal |

### 4.2 Page archetypes

1. **Cinematic landing** (Home) — photo hero, centred caps labels, 2-col catalogue grids, black conversion bands.
2. **Collection index** (`/kitchen-collections`, `/wardrobe-collections`) — 900px hero, 20px caps label, 2-up grid of collection cards; ~5000–3500px body.
3. **Collection detail** (`/kitchen-collections/hamptons`) — 900px hero image, then 13.5k px of alternating full-bleed imagery, materials, pricing-free spec blocks, gallery.
4. **Category page** (`/kitchen-interiors`, `/kitchen-materials-colors`) — very long (14–18k px), many stacked 630–1050px sections: materials, colours, finishes, accessories.
5. **Brand/manufacturing/projects** — long-form editorial with counters and cinematic bands ("INDUSTRY 4.0", "GLOBAL LARGE SCALE PROJECTS").
6. **Contact** — dark hero + form + showroom locator.

---

## 5. Components

### 5.1 Header (108px, transparent over hero)

```
                        S E A F O R M
   ────────────────────────────────────────────────  ⌕  ☰
        KITCHENS   WARDROBES   FASCINATION   EXPERIENCE
```

- Transparent header over the hero, white text; becomes solid on scroll (Elementor sticky).
- Centred wordmark (image), two horizontal rules flanking the nav, 14px Optima 300 tracked caps links, search icon + hamburger at right.
- Mega menus: 65 links in the header DOM across 6 nav lists (KITCHENS → collections; WARDROBES → systems; FASCINATION → at a glance/legacy/manufacturing/quality/projects; EXPERIENCE → concierge/get design/showroom/service/contact; plus ARCHITECTS, PARTNERS, MYSEA, CAREER).
- Permanent **vertical "GET IN TOUCH" tab** on the right edge (rotated 90°, black).
- No language switcher on the measured English site.

### 5.2 Buttons (measured across 11 pages)

| Variant | Spec | Samples |
|---|---|---|
| **Primary black** | 42px tall · `#000` · white 12px/500 Lato uppercase · **radius 0** · padding 12/24 · no border · transition `.3s ease` | APPLY NOW, AT A GLANCE, REQUEST CATALOGUE (42 instances) |
| **Inverted outline** | 44px tall · white bg · 1px `#000` border · black 12px/500 uppercase · radius 0 | EXPLORE OUR KITCHEN COLLECTION, EXPLORE OUR WARDROBE COLLECTION |
| **Light outline** | white bg · 1px `#767676` border · black 12px/300 uppercase | PRODUCTION INSIGHTS, GET AN ESTIMATE |
| **Audience chip** | 40px tall · `rgba(39,41,51,.72)` bg · `rgba(247,247,247,.9)` text · 12px/500 · radius 2px · 1px `rgba(255,255,255,.1)` border · padding 10/20 | HOME OWNERS / ARCHITECTS / DEVELOPERS / PARTNERS |
| **Chat FAB** | 64px circle · `#111` · radius 100px | floating concierge |
| **Text link** | 16px/300 `#7A7A7A`, no decoration | footer/legal |

All CTAs are uppercase, tracked, and rectangular (0px radius) — the luxury signal is a hard edge, not a pill. Only the audience chips and chat bubble are rounded.

### 5.3 Cards, labels & media blocks

- **Collection tile:** full image (aspect ≈1.5–1.8), no border, no radius, 14px Optima 300 label with 2px tracking centred underneath ("MONOGRAM M1", "HAMPTONS", "NIGHT SYSTEM", "PORTICO"). 42 such labels on the home page.
- **Section label:** 20px/300 caps with 2px tracking, often with a 12px champagne sub-label ("BESPOKE LUXURY", "WARDROBES REDEFINED").
- **Cinematic band:** full-bleed photo, centred 35–48px caps word, optional single button.
- **Material swatch grid:** flat colour/material tiles with 12–14px caps labels.
- **No card shadows or boxes** — the "card" is a photograph with a caption.

### 5.4 Footer (505px, `#101117`)

Four columns of 12px uppercase links (Kitchens / Wardrobes / Fascination / Experience), social row (Facebook, Instagram, Pinterest, LinkedIn), legal row (Imprint, Terms of Use, Privacy Policy, Career), 12px/300 in `#999`. Minimal, dark, catalogue-style.

---

## 6. Motion

- **Elementor's animation system + jQuery.** Transitions: `.3s ease` dominates (693 declarations), then `.25s` (165), `.2s` (154), `.4s` (143), `.5s` (99); easings `ease` (396) and `ease-in-out` (319).
- **Signature motion:** image hover zoom via `transform .5s cubic-bezier(0.25, 0.88, 0.54, 0.98)` (45 uses) — a soft, slow luxury zoom.
- **Cinematic fades:** Elementor entrance animations (fade/zoom on scroll) on headings and images; generated keyframes at 1.2s infinite (loading/marquee effects).
- **Smooth scrolling** enabled globally (`scroll-behavior: smooth`).
- **44 `prefers-reduced-motion` rules** per page — Elementor covers accessibility better than the custom builds do.
- No GSAP/ScrollTrigger/Lenis; no scroll-scrubbed sequences. Motion is decorative, not narrative.

---

## 7. Imagery & media

- **503 images across 11 pages (≈45/page)** — by far the most image-dense of the three. 85% lazy-loaded, 68% with `srcset` (Elementor/WordPress responsive).
- **52 CSS background images per page** — Elementor sections and columns use `background-image` for full-bleed heroes, which is why the DOM has few `<img>` in hero areas.
- Aspect ratios: 5.67 (wide cinematic), 1.78 (16:9), 1.63, 1.0 (square product), 0.6/0.66 (portrait).
- **Videos:** 1.8 per page (background/hero video plus Vimeo/YouTube embeds).
- Gradients: 3.5/page, always scrims over photography, never decorative.
- Alt text coverage: **100%** (0 missing across 503 images) — notable for an Elementor site.

---

## 8. Accessibility (measured)

| Check | Result |
|---|---|
| `lang` | `en-US` |
| Landmarks | `main` on all 11 pages; 16 landmarks/page including nested navs |
| Skip link | present on all 11 pages |
| H1 | 1 per page on all 11 pages |
| Alt text | 100% (503/503) |
| Empty links / buttons | **62 / 20** — icon-only controls (search, hamburger, slider arrows, social) without accessible names |
| Focus styles | **0 `:focus-visible` selectors** — no custom focus ring; relies on browser defaults on dark photography (often invisible) |
| Contrast | 3 of 32 measured pairs fail AA: champagne on white 2.06, warm grey 3.43, `#7A7A7A` 4.29 |
| Tabbable elements | 1,991 across 11 pages — very long tab order through mega menus |
| Reduced motion | 44 rules/page |

**Verdict:** strong document structure and image accessibility (main, h1, skip links, alt), but **no focus management** and fragile contrast on the accent colour. For a luxury brand, keyboard navigation on dark hero bands is likely near-invisible.

---

## 9. Information architecture

- **4 top chapters:** KITCHENS (8 collections: Signature, Monogram, Monocle, Soho, Hamptons, Synthesis, Purista, Gaia), WARDROBES (Night System, Cube, Aquatic, Portico), FASCINATION (At a Glance, Legacy, Manufacturing, Quality, Iconic Projects), EXPERIENCE (Concierge Service, Get Your Design, Find a Showroom, Product Service, Contact).
- **Audience split:** Home Owners / Architects / Developers / Partners (hero selector + separate landing pages).
- **Utility:** Architects, Projects, News, Become a Partner, MySea, Career, Search.
- **Conversion model:** no prices, no cart. Path = collection inspiration → materials → "get your design" → showroom/concierge → catalogue request. Four separate conversion bands on the home page alone.
- URL pattern: WordPress pages with flat slugs (`/kitchen-collections/hamptons`, `/kitchen-materials-colors`, `/manufacturing`), Yoast sitemaps, crawl-delay 10 in robots.

---

## 10. Strengths / weaknesses

**Working**
- A genuinely coherent luxury mood: monochrome, tracked caps, hard edges, cinematic photography — it feels like a €€€ brand, not a template.
- Photography-first layout with the interface receding (full-bleed 900px bands, no cards/shadows).
- The champagne `#C9B195` accent is a distinctive, ownable detail.
- Audience-first routing (home owners vs architects vs developers) is smart for a B2B/B2C hybrid.
- 100% alt coverage, `main`/H1/skip-link on every page, 44 reduced-motion rules.

**Weak**
- **Inconsistent heading scale across templates** (h1 from 20px to 77px) — Elementor freedom without a type system.
- **6 font families loaded**, two barely used (Poppins, VisueltPro) — heavy for the payoff.
- **10px rem root** is non-standard and makes responsive tuning brittle.
- Champagne on white (2.06:1) and warm grey on white (3.43:1) fail contrast; 62 empty links + no focus-visible styles make keyboard use poor.
- Extremely long pages (14–18k px on category pages) with no in-page navigation.
- Elementor default palette leftovers (`#13AFF0`, `#37589B`) in CSS — unpruned kit.

---

## 11. Rebuild recipe

```css
:root {
  --sf-white: #FFFFFF;
  --sf-black: #000000;
  --sf-night: #141414;
  --sf-deep: #101117;
  --sf-body: #54595F;
  --sf-grey: #7A7A7A;
  --sf-warm-grey: #908A7E;
  --sf-champagne: #C9B195;   /* type-only accent; never on white below 16px */
  --sf-container: 1330px;
  --sf-section-pad: 72px;
  --sf-hairline: rgba(255,255,255,.18);
}
```

```html
<!-- luxury label + display -->
<p class="uppercase text-[12px] tracking-[2px] text-[#C9B195]">Made in Germany — since 1917</p>
<h2 class="uppercase font-light text-[25px] leading-[1.5] tracking-[1px] text-white">Global large scale projects</h2>

<!-- primary CTA -->
<a class="inline-block bg-black text-white uppercase text-[12px] font-medium tracking-[1px] px-6 py-[12px] rounded-none transition-colors duration-300 hover:bg-white hover:text-black hover:ring-1 hover:ring-black">Request catalogue</a>

<!-- collection tile -->
<figure class="group">
  <div class="aspect-[3/2] overflow-hidden">
    <img src="monogram.jpg" alt="Monogram M1" class="w-full h-full object-cover transition-transform duration-500 [transition-timing-function:cubic-bezier(.25,.88,.54,.98)] group-hover:scale-105">
  </div>
  <figcaption class="mt-4 text-center uppercase text-[14px] tracking-[2px] font-light">Monogram M1</figcaption>
</figure>
```

**Keep:** 900px full-bleed cinematic sections; 72px section padding; uppercase tracked caps; 0px radius CTAs; monochrome + champagne; 2-up collection grids; audience chips; vertical GET IN TOUCH tab.

**Fix on reuse:** enforce one heading scale (e.g. 56/40/28/20) across templates; cut the font set to Optima + one body face; use 16px root; restrict champagne to dark surfaces or darken it for light ones (`#8A7154` passes on white); add visible focus rings; label icon-only controls; add in-page sub-navigation for 15k-px category pages.
