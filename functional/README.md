# Functional reverse engineering — method & evidence

This folder contains the **behavioural** layer of the three-site study: every menu, search, slider, accordion, form, modal, chat widget, catalogue download, language switch, storage key and third-party call that could be exercised, plus the state changes and network traffic each produced.

Start with **[functions.html](functions.html)** — a visual evidence gallery with screenshots, step logs, form specs and domain inventories. Then read the per-site functional specs:

- [`sites/mykitchen-bd/functions.md`](../sites/mykitchen-bd/functions.md)
- [`sites/haecker-kuechen/functions.md`](../sites/haecker-kuechen/functions.md)
- [`sites/seaform/functions.md`](../sites/seaform/functions.md)
- [`functional/feature-matrix.md`](feature-matrix.md) — all capabilities side by side

---

## Evidence classes

| Class | Meaning | Where |
|---|---|---|
| **observed** | executed in a real Chromium session; screenshot/network/state recorded | `flows/*.json`, `shots/*.png` |
| **inferred** | derived from markup, attributes, CSS or framework conventions, not executed | noted inline in the reports |
| **unknown** | not exercised (out of scope or blocked) | listed at the end of each report |

No REA MCP provider or `rea` CLI was available in this session, so the supported **runtime-observation** route was used directly: Playwright driving the live sites, recording network/state/screenshots. No decompilation or source inspection was involved (the sites are remote web apps).

---

## What was driven, per site

21 flow types (`tools/actions/flows.mjs`), configured per site in `tools/actions/sites.mjs`:

| Flow | What it does |
|---|---|
| `baseline` | load, accept consent, inventory every interactive element, forms, embeds, scripts, storage, third parties |
| `cookie` | clear cookies/storage, reload, capture consent UI, accept, record storage delta, verify persistence |
| `scroll` | header position/before-after, fixed/sticky bars, scroll-to-top controls |
| `keyboard` | 14 tab stops with focus styles; keyboard attempt to open navigation |
| `navDesktop` | every top-level nav trigger: hover/click, panel geometry, panel links, Escape close |
| `navMobile` | 390×844 viewport, hamburger, off-canvas panel, submenu, links, close |
| `search` | open search, type "kitchen", capture suggestions/XHR, submit, results, zero-result query |
| `carousel` | next/prev ×3, active slide/heading/image/dot changes, autoplay observation |
| `accordions` | click real content toggles, capture expanded state, answers, text-length deltas |
| `tabsFilters` | tabs/chips/filters/selects, option lists, in-place changes vs navigation |
| `forms` | per configured page: all forms + field specs, native validation, synthetic submit, real submit click (writes blocked), attempted payloads |
| `modal` | on-load overlay detection, content/buttons, close method, recurrence after reload |
| `language` | open language menu, list locales, switch and verify translation, switch back |
| `pageProbe` | planner/dealer/contact/catalogue/locations pages: forms, embeds, CTAs, popup targets |
| `detailProbes` | open catalogue/collection/gallery detail interactions, dialog buttons, download HEAD requests |
| `chat` | click chat/WhatsApp widget, capture popup URL/provider/overlay |
| `videoLightbox` | enumerate video/iframe/lightbox triggers, play video where possible |
| `hoverStates` | computed-style diff on hover for CTA/nav/card/chip |
| `linksAssets` | internal/external/contact/download link graph, HEAD for PDFs, asset pages |
| `notFound` | 404 status and page structure |
| `mobileUi` | fixed bars, sticky CTAs, small tap targets at 390px |
| `finalise` | final storage + network summary |

---

## Guardrails

- **No real submissions.** Every `POST/PUT/PATCH/DELETE` request is aborted at the browser boundary (`context.route`) and recorded with method, URL and payload. Validation is observed with native constraint APIs (`checkValidity`, `:invalid`, `validationMessage`) and synthetic `submit` events; forms are never sent.
- **No credentials, no accounts, no purchases.** Public pages only.
- **Polite pacing.** One browser context per site, sequential flows, default navigation timeouts; no parallel hammering of a single site.
- **Fresh-consent probes.** The `cookie` flow clears cookies + local/session storage so a first-visit consent banner can be observed, then records exactly which cookies/storage appear after acceptance.
- **Screenshots are evidence.** They contain the sites' imagery and text; they are not assets for reuse.

---

## Evidence layout

```
functional/
├── functions.html                 ← visual action gallery (open this)
├── feature-matrix.md              ← capability matrix, all sites
├── actions/
│   ├── mykitchen-bd/
│   │   ├── baseline.json          ← inventory, links, forms, embeds, storage, load network
│   │   ├── summary.json           ← aggregated flows, forms, third parties, blocked writes
│   │   ├── facts.md               ← auto-generated evidence tables
│   │   ├── flows/<id>.json        ← steps + requests + blocked writes per flow
│   │   ├── flows/<id>.network.json
│   │   ├── shots/<flow>-<step>.png
│   │   └── form-<name>.json       ← full field spec per form
│   ├── haecker-kuechen/ … same
│   └── seaform/ … same
└── tools/ … (in ../../tools/actions)
```

---

## Re-running

```bash
cd "/home/sakib/Desktop/Projects Old/kitchen-deom"

node tools/actions/run.mjs --site seaform                  # full suite (~6–10 min)
node tools/actions/run.mjs --site seaform --flows navDesktop,forms   # subset

node tools/actions/aggregate.mjs                           # rebuild summary.json / facts.md
node tools/actions/build-functions-html.mjs                # rebuild functions.html
```

The runner writes each flow as soon as it finishes, so partial runs are usable. It always restores the desktop viewport after a mobile flow.

---

## Known limits

- Dynamic states are only observed where they were reachable without credentials; logged-in areas, checkout/payment and third-party hosted planners are out of scope.
- The harness blocks all non-GET requests, so outcomes that depend on a real successful POST (e.g. "thank you" messages, emails) are **not** observed.
- Third-party widgets (chat, maps, analytics) are observed only as far as they load and render in this environment; their backends were not probed.
- Time-dependent behaviour (carousel autoplay, promo frequency, session expiry) is sampled, not exhaustively tested.
- Consent banners that set server-side cookies can reappear/differ across contexts; the reported storage is what was observed in this session.
