# Three kitchen design languages — cross-site pattern library

A side-by-side read of the same problem ("sell kitchens, communicate craft") solved at three price points and in three markets. All numbers below are measured from rendered pages at 1440 / 768 / 390 (see each site's `analysis/facts.md`).

| | **My Kitchen** (mykitchen-bd.com) | **Häcker Küchen** (haecker-kuechen.com/en) | **SEAFORM** (seaform.com) |
|---|---|---|---|
| Market / position | Bangladeshi modular-cabinet manufacturer; retail showroom | German premium kitchen group, 125 years; dealer network | German-made luxury kitchens; Australian/global, B2B/B2C |
| Stack | Next.js 15 + Tailwind v4 | TYPO3 + Bootstrap grid + Swiper | WordPress + Elementor |
| Design idea | **Poster retail** — high contrast, red punctuation, image grid | **Editorial calm** — narrow column, tiny type hierarchy, whitespace | **Luxury catalogue** — tracked caps, cinematic bands, metallic accent |
| Type | Inter only; 72px display → 16px body; leading 1.0 on display | Nunito Sans (18px root); 36px h1 → 18px body; + Caslon on magazine | Optima + Roboto + Open Sans + Lato + Poppins; 20–48px caps → 12–14px body |
| Colour | `#E84538` red as accent; else black/white/`#F5F5F5` | No brand colour; black/white/`#F7F7F7`; photography is the colour | Monochrome + champagne `#C9B195` text accent |
| Container | 1400px / 32px gutters | 1050px / 15px gutters | 1330px (Elementor full-width) |
| Surface | Sharp 0px CTAs, 8px cards, no shadows, flat | No cards; square photos; black 126px pill CTAs | Square CTAs, no cards/shadows; photos as cards |
| Motion | Tailwind 150–300ms; letter-split heading reveals | jQuery/Swiper 400ms carousel; 100ms button | Elementor 300ms; 500ms hover zoom; gentle fades |
| Homepage length | 4,883px | 10,233px | 10,469px |
| A11y posture | Strong alt/focus, **no `<main>`, no H1 on key pages** | Main/H1/skip + alt; **low-contrast grey** | Main/H1/skip + 100% alt; **no focus styles** |
| Conversion | WhatsApp FAB + auto promo modal + store locator | Dealer search + kitchen planner + brochure | Catalogue request + concierge + showroom + "get your design" |

The three type strategies are the clearest differentiator:

```
My Kitchen   ████████████████████████████████  72px display, 1.0 leading, one red word
Häcker       ████████████                      36px h1 / 18px body — 1.7× scale, whitespace does the work
SEAFORM      ███████                            25px h1, tracked caps, 12–14px body — luxury whisper
```

---

## 1. Navigation patterns

### A. Utility bar + primary nav (My Kitchen)
Two stacked rows: a 40px black utility bar (`Offer`, `Find a Store`, wishlist) over a 56px white nav with logo, centre links, dropdown carets and a red active underline. Total 96px, **static**.
- Reuse when a retailer has offers, stores and personalisation, and the page can afford to lose the header on scroll.
- Weakness: no sticky navigation on a 5,000px page.

### B. Fixed mega-menu bar (Häcker)
92px fixed white bar; logo left; five "chapter + subtitle" nav items; full-width mega menu with link columns + two large product cards; outlined "Kitchen planner" pill, language globe, search.
- Reuse for a catalogue with many product lines (systemat, concept130) across 10 locales.
- Weakness: 48 nav links in the DOM makes the tab order expensive.

### C. Transparent masthead + audience routing (SEAFORM)
108px transparent header over the hero: centred wordmark, rule-flanked row of tracked caps links, search + hamburger; a vertical "GET IN TOUCH" tab pinned to the right; a 4-chip audience selector (Home Owners / Architects / Developers / Partners) immediately below the hero.
- Reuse when the same catalogue must serve consumers and trade; the audience split is the strongest IA idea across all three sites.
- Weakness: no visible focus styles anywhere; keyboard users get lost on dark photography.

---

## 2. Hero patterns

| Pattern | Site | Anatomy | When to use |
|---|---|---|---|
| **Split poster hero** | My Kitchen | 50/50: `#010202` panel with 72px bold headline + 18px body + 288px outlined CTA / full-bleed kitchen photo with carousel arrows | You have one strong product photo and a clear campaign message; you want text legibility without scrims |
| **Image slogan + material carousel** | Häcker | 700px full-bleed campaign image ("Inspired by simplicity" — actually an image asset), 5 material spheres, arrows, 4s autoplay, progress line | Brand campaign + material storytelling; product is colour/material |
| **Cinematic overlay + audience split** | SEAFORM | 900px full-bleed photo, bottom-left 23px tracked caps + 2-line 16px light tagline, dark scrim, vertical contact tab, 4 audience chips | The photography is the product; you want the interface to disappear |

Common thread: **all three put white type over a dark kitchen photograph**. The difference is scale and density — 72px + CTA (retail), 23px + tagline (luxury), image-only (editorial).

---

## 3. Section rhythm

- **Poster grid (My Kitchen):** full-bleed alternating bands, 600–1100px, 80px padding, 2×2 image tiles → 5-column value row → 4-column masonry → 3 partner cards. Content is packed, image-dense, every section ends in a red CTA.
- **Alternating editorial rows (Häcker):** image/text, text/image, repeated 6–8 times on a 1050px column with 80–120px vertical padding, alternating white / `#F7F7F7`. Identical template across product pages, so content scales without design drift.
- **Cinematic catalogue blocks (SEAFORM):** 900px full-viewport image bands, one idea per screen, 72–144px spacing, 2-up collection grids with 14px captions, black conversion bands between them. Very few words per screen.

---

## 4. CTA patterns

| | My Kitchen | Häcker | SEAFORM |
|---|---|---|---|
| Primary | Solid red `#E84538`, 60px, **0 radius**, 20px/500 | Black pill, 37px, **126px radius**, 12.6px/600, hairline white border | Black rectangle, 42px, **0 radius**, 12px/500 uppercase, 1px tracking |
| Secondary | Dark pill `#212424` ("Learn More →") | Outlined "Kitchen planner" pill | White outlined rectangle, 1px black border |
| Hero CTA | 288px outlined box, `#939494` 1px border + grey text | Black pill | — |
| Micro-interaction | 200ms `all` fill inversion | 100ms `ease-in` fill | 300ms `ease` fill + 500ms image zoom on tiles |
| Personality | Retail urgency | Quiet precision | Engraved restraint |

A single, consistent CTA shape is what makes each site feel designed. My Kitchen has five variants (red block, dark pill, outline, text link, slider controls); Häcker has one; SEAFORM has three systematically derived from one rectangle.

---

## 5. Typography systems

### Retail display (My Kitchen)
Inter variable, 72px/1.0 hero, 48px/1.0 section headings with **one red word**, 36px uppercase image labels, 16px body. Hierarchy via size and colour. Reads at a glance, good for a phone-first market.

### Editorial compression (Häcker)
18px root, Nunito Sans 400/500/600/800, 36px h1 (2rem), 30.6px h2 (1.7rem), 18px/1.5 body, 12.6px tracked button labels. **Only 1.7× between body and h1** — hierarchy via weight, measure and whitespace. A serif (ACaslonPro) appears only in magazine content, giving content type a second voice.

### Luxury whisper (SEAFORM)
10px root, Optima for headings/labels, Roboto for tech pages, Open Sans/Lato for body/UI, Poppins for caps labels. Headings 20–48px at weight 300 with 0.5–2px tracking; body 12–14px. Uppercase + tracking = the brand. Weakness: h1 varies 20–77px across templates, so there is no enforced scale.

**Transferable rule:** pick one axis of hierarchy and commit. My Kitchen commits to *size*, Häcker to *weight + space*, SEAFORM to *case + tracking*. Sites that mix all three (SEAFORM's h1 range) feel less systematic.

---

## 6. Colour strategy

| Strategy | Site | How it works |
|---|---|---|
| **Accent on monochrome** | My Kitchen | One saturated red for emphasis/action; everything else grey. Red occupies <1% of pixels, which is why it works. |
| **No interface colour** | Häcker | Black/white/`#F7F7F7` interface; saturated colour comes only from photography and material spheres. |
| **Metallic text accent** | SEAFORM | Monochrome + champagne `#C9B195` reserved for 12–14px caps labels. Works on black (6.1:1), fails on white (2.1:1). |

All three understand the same thing: **in a kitchen category, the product photography is the colour**. The interface should not compete with it.

Token-layer notes:
- My Kitchen defines a full `--red/black/white/green/blue-brand-color-*` system but paints only red + greys — defined-but-unused tokens.
- Häcker has no runtime colour variables (compiled SCSS).
- SEAFORM inherits Elementor's default palette (including unused `#13AFF0`, `#37589B`) alongside its real monochrome system.

---

## 7. Imagery treatment

| | My Kitchen | Häcker | SEAFORM |
|---|---|---|---|
| Images / page | ~15 | ~70 | ~45 |
| Treatment | Square/landscape crops, dark gradient overlays only under type | 2.06:1 and 4:3 editorial crops, no overlays | 5.67:1 cinematic and 3:2 crops, dark scrims |
| Lazy loading | 85% | **25%** (weak) | 85% |
| Responsive srcset | 88% | **0%** (weak) | 68% |
| Alt coverage | 100% | 97% | 100% |
| Video | none | none | 1.8/page |
| Background images | ~1.3/page | 0 | **52/page** (Elementor sections) |

Häcker's imagery is the most editorial, SEAFORM's the most cinematic, My Kitchen's the most utilitarian (grid/masonry). Häcker pays for its beauty with desktop-sized JPGs on mobile.

---

## 8. Motion

| | My Kitchen | Häcker | SEAFORM |
|---|---|---|---|
| Engine | CSS + React/Radix | jQuery + Swiper | Elementor + jQuery |
| House timing | 300ms `cubic-bezier(.4,0,.2,1)` | 400ms `ease`; 100ms buttons | 300ms `ease`; 500ms custom bezier on image zoom |
| Signature | Letter-split heading reveal | Autoplay material carousel (4s) | Slow image zoom on hover |
| Scroll effects | none | none | Elementor fade/zoom entrances |
| Reduced motion | 31 rules/page | partial | 44 rules/page |

None of the three uses scroll-scrubbed storytelling (GSAP/ScrollTrigger/Lenis). Motion is micro-interaction only — appropriate for catalogue sites where content must not be hijacked.

---

## 9. Conversion & overlays

- **My Kitchen:** auto-opening 765×765 red promo modal on load, floating WhatsApp FAB (the most prominent green on the site), store locator, "Offer" utility link, catalogue. Highest-friction, highest-urgency pattern; the modal cheapens the premium photography.
- **Häcker:** no promo modal. Cookie opt-in panel only. Conversion = dealer search → kitchen planner → brochure/contact. No prices. Trust is built with certification logos.
- **SEAFORM:** cookie bar (Elementor popup) only. Conversion = catalogue request → concierge application → showroom visit → "get your design". Four conversion bands on the homepage, all understated.

**Recommendation for a new kitchen brand:** follow Häcker/SEAFORM on load (no promo modal), keep My Kitchen's WhatsApp FAB if the market expects chat, and route audiences explicitly like SEAFORM.

---

## 10. Accessibility scoreboard (measured)

| Check | My Kitchen | Häcker | SEAFORM |
|---|---|---|---|
| `<main>` landmark | ✗ 0/10 | ✓ | ✓ 11/11 |
| H1 present | 15 across 10 pages; **0 on Home/Gallery/Products** | 1/page | 1/page |
| Skip link | ✗ | ✓ | ✓ |
| Alt coverage | 100% | 97% | 100% |
| Empty links (home) | 10 | 4 | 62 (11 pages) |
| Focus styles | 70 `:focus-visible` selectors | present | **0 custom selectors** |
| Contrast failures | 10/25 pairs < 4.5:1 | `#A2A2A2` grey fails | 5/34 pairs fail (champagne on white 2.1) |
| Reduced motion | 31 rules/page | partial | 44 rules/page |
| Tab order | 758 tabbables / 10 pages | dense mega menu | 1,991 tabbables / 11 pages |

**Checklist extracted from the three failures:** real `<main>` + one `<h1>` per page; visible focus ring on dark photography; muted greys ≥4.5:1; accessible names on icon-only controls; champagne/gold accents only on dark surfaces; reduced-motion coverage.

---

## 11. Choosing a direction

| If the brief is… | Copy from | Why |
|---|---|---|
| "We need to sell hard in a price-sensitive market" | **My Kitchen** | 72px display, red CTA, WhatsApp, dense grid, 1.0 leading |
| "We are a premium manufacturer with a dealer network" | **Häcker** | Narrow editorial column, 1.7× type scale, photography-led, trust logos, planner/dealer conversion |
| "We are a luxury house selling a lifestyle" | **SEAFORM** | Tracked caps, cinematic 900px bands, champagne accent, catalogue/concierge conversion, audience routing |
| "We want the best accessibility of the three" | Häcker + SEAFORM structure, My Kitchen alt coverage | Main/H1/skip from Häcker/SEAFORM; image discipline from My Kitchen |
| "We want a token system to hand to engineers" | My Kitchen + this repo's `tokens.css` | Only one of the three has a real runtime token layer |

Each site's `tokens.css` / `tailwind.config.js` in this repo is a ready starting point; the values are measured, not guessed.
