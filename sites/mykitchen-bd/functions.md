# My Kitchen — Functional & Interaction Teardown

**Site:** https://www.mykitchen-bd.com/ · **Scope:** every observable action, flow, form, state and network call, driven in a real Chromium session.
**Observed:** 2026-10-26, desktop 1440×900 + mobile 390×844. **Evidence:** `functional/actions/mykitchen-bd/` (`flows/*.json`, `shots/*.png`, `summary.json`, `facts.md`).
**Evidence classes:** _observed_ = executed/screenshot/network; _inferred_ = from markup/attributes; _unknown_ = not exercised.

Design system for the same site: [`design-system.md`](design-system.md). Cross-site function matrix: [`functional/feature-matrix.md`](../../functional/feature-matrix.md).

---

## 1. Functional thesis

My Kitchen is a **fully client-side Next.js marketing site**: navigation, mega menus, modal, carousel and accordion are React/Radix components; there is no search, no account, no cart, and — unusually — **no analytics or tracking scripts on the home page** (0 third-party requests, 0 cookies). The only persistent state is one `sessionStorage` key that makes the promo advert appear once per session.

The action surface is broad but shallow: three mega-menu chapters (22 links), a footer sitemap, a 3-slide hero carousel, a promo modal, a WhatsApp float, a catalogue modal with PDFs (up to 29 MB), a contact page with an **unwired form**, a Google-Maps embed, and an **empty store-locator page**. It behaves like a brochure with strong WhatsApp conversion rather than a transactional site.

| Capability | Present? | Evidence |
|---|---|---|
| Mega-menu navigation | ✅ 3 chapters, 24 links | `flows/navDesktop.json` |
| Mobile off-canvas menu | ✅ 21 links, 390×716 | `flows/navMobile.json`, `shots/navMobile-menu-open.png` |
| Search | ❌ none (no input, no icon) | `flows/search.json` → `noInput` |
| Language switcher | ❌ single-locale (`en`) | `flows/language.json` → skipped |
| Hero carousel | ✅ manual prev/next, 3 slides, no autoplay observed in 5.5 s | `flows/carousel.json`, `shots/carousel-next-*.png` |
| Promo modal | ✅ once per session, 765×765, scroll-locked | `flows/modal.json`, `shots/modal-onload.png` |
| Catalogue browser | ✅ 9 cards → modal with Print / Download / Open Document (PDF) | `flows/detailProbes.json`, `shots/detailProbes-catalogue-preview.png` |
| Contact form | ⚠️ renders 6 fields but submits nothing (no action, no network, no required fields) | `flows/forms.json`, `shots/forms-contact-*.png` |
| Map | ✅ Google Maps iframe embed (Dhaka showroom) | `flows/forms.json` network |
| FAQ accordion | ✅ 5 questions, one open at a time | `flows/accordions.json`, `shots/accordions-expanded-*.png` |
| WhatsApp chat | ✅ fixed FAB → `wa.me/8801642912612` → WhatsApp popup | `flows/chat.json`, `shots/chat-opened.png` |
| Store locator | ⚠️ page exists but is an empty stub (breadcrumb only) | `flows/pageProbe.json` |
| Wishlist / account | ❌ heart icon links to `/#` (dead) | `flows/baseline.json` |
| Video / VR | ❌ none on measured pages; "My Kitchen Studio" is a link to a page, no 3D viewer | `flows/videoLightbox.json` |
| Analytics / cookies | ❌ none on home; Google Maps only on contact | `summary.json` |

---

## 2. Global shell

### 2.1 Utility bar (44px, black)
Right-aligned: static **Offer** label + gift icon, **Find a Store** → `/find-store`, heart icon → `/#` (empty anchor, non-functional).
Observed markup: the "Offer" text is not a link; the heart anchor has `href="/#"` and no accessible name. _Inferred:_ promotions are handled by the once-per-session promo modal, not by this label.

### 2.2 Primary navigation (96px, white → fixed + translucent on scroll)
- Wordmark left (`MyKitchen / Modular Cabinets`), divider, then 7 items: `About ⌄ · Expertise ⌄ · Products ⌄ · Sales Point · Events & News · Catalogue · Contact`.
- Three dropdown triggers are `<button aria-expanded>` (Radix NavigationMenu). **Hover did not open them in our run; click did** (`method: click` for all three).
- **Sticky behaviour (observed):** at scroll 0 the bar is `position: static` at y=44; after scrolling 900 px it becomes `position: fixed`, `top: 0`, background `rgba(255,255,255,0.7)` — a frosted sticky header. It returns to static at the top. (`flows/scroll.json`)

| Menu | Panel size | Links (observed) |
|---|---|---|
| **About** | 1440×500 (full-width mega panel with 2 image groups) | Company Profile · History · Factory · Technology/Our Procedure & Processing of work · Software · What We Do · Certification · R&D · OEM/ODM |
| **Expertise** | 1440×256 | Wardrobes · WALK-IN CLOSETS · Vanities · ACCESSORIES |
| **Products** | 1440×476 | All Products · Kitchen · Counter Top · Wardrobes · Walk-In Closets · Vanities · Accessories · Appliances · LED Mirror |

Close behaviour: `Escape` closes the panel and clears focus (`closedAfterEscape: true` in all three). Panels are full-bleed with photography; no hover previews were observed on the menu links themselves.

### 2.3 Mobile menu (390×844)
- The hamburger is **icon-only** (no `aria-label`, no class "hamburger") — automation needed a positional fallback (top-right icon cluster). _Accessibility issue: unlabeled menu trigger._
- Opens a fixed off-canvas panel **390×716** at `top: 32` containing the entire tree (21 links): Home · About (+9 sub-links) · Expertise (+4) · Products (+5 sections) · Sales Point · Events & News · Catalogue · Contact.
- `body` scroll is locked while open (`overflow: hidden`).
- `Escape` visually closes the panel, but **`body` overflow stayed `hidden` in our observation** — the page may remain scroll-locked after closing (`flows/navMobile.json → closed`). _Observed bug; not re-tested after a click-outside._

---

## 3. Home page actions

| # | Action | Trigger | Result |
|---|---|---|---|
| 1 | Hero carousel | `Previous slide` / `Next slide` buttons (60×56, translucent) | Swaps the hero photograph and the split-text headline stays; **3 slides** detected; autoplay not observed within 5.5 s. Manual only in our session. |
| 2 | View Our Collection | 288px outlined box | → `/products` |
| 3 | Expertise tiles | 2×2 image cards (Wardrobes / Walk-In Closets / Vanities / Accessories) | → `/expertise/*`; label is 36 px uppercase overlay, hover reveals |
| 4 | View Our Gallery | red band text link | → `/gallery` |
| 5 | Learn More (partner cards) | black pill inside each card | → `/blum`, `/kessebohmer`, `/teka` (partner sub-sites/pages) |
| 6 | WhatsApp FAB | fixed 56px circle `#25D366`, `animate-ping` halo | Opens `https://wa.me/8801642912612` → `api.whatsapp.com` popup with prefilled phone; no message text |
| 7 | Promo modal | auto-opens on first visit per session | 765×765 Radix dialog, `Advertisement / Promotional message from My Kitchen / Close`, image advert, body scroll locked |
| 8 | Footer links | 4 columns | social (Facebook, LinkedIn), legal (Privacy, Terms), all section links; copyright |
| 9 | Sticky header | scroll > ~44px | bar fixes to top with translucent white background |

### 3.1 Promo modal lifecycle (observed)

1. Fresh session: dialog renders after load, `sessionStorage.myKitchenAdDismissed` absent.
2. `Escape` or the **Close** button dismisses it; `body` overflow returns to `auto`.
3. Dismissal writes `sessionStorage.myKitchenAdDismissed = <hash>`.
4. Reload in the same tab → **no modal** (flag present). Clearing the key reproduces it.
   _Inferred:_ once-per-session frequency cap; a new tab/session shows it again (sessionStorage is per-tab).

---

## 4. Contact page (`/contact`)

### 4.1 Form (observed, no submission sent)
- `<form>` with **no `action`, no `method`**, `noValidate=false`, **0 required fields**, no consent checkbox, no file input.
- Fields: `firstName` (text) · `lastName` (text) · `email` (email) · `phone` (tel) · `subject` (text) · `message` (**select**, 5 options).
- Labels are **placeholders only** (no `<label for>`); error styling is border-only.
- Buttons: `Message` (type=button), `Submit` (type=submit, **outside the `<form>` element**), `Cancel`.
- Behaviour on empty submit: native validation passes (`checkValidity() === true`, 0 invalid); synthetic `submit` event is cancelled by a React handler; **clicking “Submit” produced 0 network requests and no navigation**.
  → _Observed:_ the form is client-side only / not wired to a reachable endpoint in this session. Treat lead capture as **unknown or broken**; WhatsApp and phone are the working contact paths.

### 4.2 Map
- Google Maps `<iframe>` embed of the Dhaka showroom (Gulshan 1), `scrollwheel=false`.
- Loads `maps.googleapis.com` tiles + internal RPC POSTs (`GetViewportInfo`, `InitMapsJwt`) — the only third-party traffic found on the site.

### 4.3 FAQ accordion
- 5 Radix accordion questions (`aria-expanded`), **single-open** behaviour.
- Questions: “What types of customized modular cabinets do you offer?”, “How can I schedule a consultation…”, “Do you provide installation services…”, “Can I experience your products virtually…”, “What is the warranty…?”.
- Sample answer (observed after expanding): “…contact us via our website’s contact form, call us at **+88 01642-912612**, or visit one of our store locations.”
- Expand/collapse changes document text length 1457 → 2126 chars.

### 4.4 Contact information (from catalogue dialog / page)
House 8, Road 138, Gulshan 1, Dhaka 1212 · 01642-912612 · www.mykitchen-bd.com

---

## 5. Catalogue browser (`/catalogue`)

- 9 clickable cards in a 4-column grid, titles: **Appliance Folded Catalogue · MyKitchen Flyer · Vanity Catalogue · NAZ Hardware Catalouge · Sleektop Flyer · Hotel Furniture Catalogue · Flamora Appliance Catalogue · Kloset Furniture Catalog** (+ company profile card).
- Clicking a card opens a Radix dialog: **Print · Download · Open Document · Close**, title, a JPEG preview from `api.mykitchen-bd.com`, and the company address.
- `Open Document` → direct PDF, e.g. `http://api.mykitchen-bd.com/uploads/file-1761366144703-548596167.pdf` — **29,422,722 bytes (29.4 MB)**, `application/pdf` (HEAD request, not downloaded).
- `Print` invokes the browser print dialog (_inferred_ from label/markup; not executed).
- `Download` is a `<button>` (JS-triggered download), no `href` exposed.
- Modal locks body scroll; `Escape` closes.

---

## 6. Product listing & gallery

- **Products (`/products`):** category filter links (Kitchen, Wardrobes, Accessories) and a **Sort by** control (`aria-expanded=false`, 4px-radius bordered trigger) plus a **Clear** button. Clicking “Wardrobes” navigated to `/expertise/wardrobes` — filters are **links, not in-place filters**. `Sort by` opens a dropdown; in-place result re-render was not observed before navigation.
- **Gallery (`/gallery`):** 12-image grid, **no lightbox** (`lightboxTriggers: 0`), no zoom/modal.
- **Store locator (`/find-store`):** breadcrumb “Home / Find a Store” only; no store list, no map, no search → **empty stub** (observed).
- **404:** Next.js default “404 This page could not be found.”, status 404, **no site header/footer** (`shots/notFound-404.png`).

---

## 7. Network, storage & third parties

| Item | Observed |
|---|---|
| Own domains | `www.mykitchen-bd.com`, `api.mykitchen-bd.com` (images, PDFs) |
| Third parties on home | **none** — no analytics, tag manager, ads, fonts CDN or chat SDK |
| Third parties on contact | `maps.googleapis.com` (Google Maps embed), Google fonts/tiles |
| Cookies (first-party) | none. After the WhatsApp popup opened, the shared context held `wa_ul`, `wa_lang_pref` on `.whatsapp.com` — external, not My Kitchen. |
| localStorage | none |
| sessionStorage | `myKitchenAdDismissed` (promo frequency cap) |
| Requests per page | ~30–70 (mostly Next.js chunks + `next/image`) |
| RSC navigation | client-side route changes request `?_rsc=…` payloads |
| Blocked writes (never sent) | Google Maps internal RPC POSTs only; no form POST attempted |

**Conclusion:** privacy-clean by omission — no consent banner is needed because no non-essential trackers load. The trade-off is no analytics, no personalisation, no search.

---

## 8. Accessibility of interactions (observed)

| Check | Result |
|---|---|
| Keyboard focus indicator | ✅ all 14 first tab stops show `outline: auto 1px rgb(16,16,16)` |
| Tab order | utility bar → logo → nav triggers → nav links → hero CTAs → carousel → … → footer (758 tabbables across 10 pages) |
| Keyboard open of mega menu | ⚠️ `Enter` on the `About` trigger left `aria-expanded=false` in our snapshot; keyboard opening is **unconfirmed** (may require Space/hover) |
| `<main>` landmark | ❌ none |
| H1 on home | ❌ none (split-text `<div>`) |
| Icon-only controls named | ❌ hamburger, heart, carousel arrows, WhatsApp have no `aria-label` |
| Promo dialog | focus trapping not measured; `Escape` works |
| Mobile menu | opens/closes, but body scroll lock persisted after `Escape` |
| Form labels | ❌ placeholders only (no `<label>`), no error announcements |
| Skip link | ❌ none |

---

## 9. Rebuild action manifest

If rebuilding the interaction layer, implement exactly these units (ids are stable for a spec):

| ID | Trigger | Behaviour | State/side effects |
|---|---|---|---|
| `nav.mega.about` | click About button | open full-width mega panel (9 links + 2 image groups) | `aria-expanded`, Escape/outside close |
| `nav.mega.expertise` | click Expertise | 4-link panel | same |
| `nav.mega.products` | click Products | 9-link panel | same |
| `nav.sticky` | scroll > 44px | header `fixed`, translucent white, shadow none | returns static at top |
| `nav.mobile.open` | tap hamburger | 390×716 off-canvas tree, body scroll lock | Escape closes (release lock!) |
| `hero.carousel.prev/next` | click arrows | swap hero photo among 3 slides | no autoplay observed |
| `promo.show` | first visit in session | 765×765 advert dialog, scroll lock | `sessionStorage.mykitchenAdDismissed` |
| `cta.collection` | click | navigate `/products` | |
| `cta.learnMore` | click partner card pill | navigate `/blum` `/kessebohmer` `/teka` | |
| `chat.whatsapp` | click FAB | open `wa.me/8801642912612` | new tab |
| `catalog.open` | click card | dialog: Print / Download / Open Document (PDF) / Close | body lock, Escape close |
| `faq.toggle` | click question | expand one answer (single-open) | `aria-expanded` |
| `form.contact.submit` | click Submit | **no request observed** — needs wiring | validate required + POST endpoint |
| `map.contact` | page load | Google Maps iframe (Gulshan 1) | third-party requests |
| `sort.open` | click Sort by | dropdown with sort options | re-render list (currently navigates) |
| `404` | unknown route | Next.js 404, no chrome | |

### Unknowns / not exercised
- Whether `Sort by` and category filters ever re-render in place (our runs navigated or produced no change).
- Keyboard activation of mega menus (Enter/Space/ArrowDown).
- Focus trap and restore behaviour of the promo/catalogue dialogs.
- Mobile menu scroll-lock release via click-outside.
- Any backend for the contact form (no endpoint observed).
- PDF download UX on slow connections (29 MB file).
