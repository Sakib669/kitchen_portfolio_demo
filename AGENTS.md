# AANGAN Kitchens and design research

## Stack

- **Website:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 3, local shadcn-style components, Zod.
- **Data:** Bundled bilingual starter content plus one browser-local `localStorage` record. Contact notes remain on the visitor's device.
- **Research:** JavaScript ES modules on Node.js, Playwright/Chromium, local HTML galleries and Markdown/JSON evidence.
- **Assets:** Original bundled kitchen imagery and self-hosted Noto fonts. Do not reuse third-party research screenshots in the website.

## Build approach

The root is the website. `app/` contains routes and CSS, `src/components/` contains public/editor UI, and `src/lib/` contains types, schema, and starter content. Existing research folders remain reference material. The production build uses `next build --webpack` because this local workspace uses symlinked dependencies. A clean install can use the package scripts. Mutable site data is never shared with other browsers; do not add a server-side write or claim contact delivery without a new user decision.

## Commands

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e
node tools/extract.mjs --site seaform
node tools/analyze.mjs
node tools/build-compare.mjs
node tools/actions/run.mjs --site seaform
node tools/actions/aggregate.mjs
node tools/actions/build-functions-html.mjs
```

## Specs

Architecture decisions live in `docs/specs/` when created.

## Rules

- Treat `sites/*/raw/` and `functional/actions/` as captured evidence. Change the scripts, then regenerate derived files when a method changes.
- Keep observed, inferred, and unknown claims distinct in reports.
- Crawl only the public pages listed in `tools/sites.mjs`. Respect each site's configured delay.
- Browser interaction probes must block `POST`, `PUT`, `PATCH`, and `DELETE` requests so forms are not submitted.
- Screenshots, fonts, photography, and copy from the studied sites are research evidence, not reusable product assets.
- `compare.html` and `functional/functions.html` are generated galleries. Edit their builders for durable changes.

## Agent skills

MCP servers: `@playwright/mcp` (recommended, not connected).

## Context files

- [tools/AGENTS.md](tools/AGENTS.md) (capture, analysis, and gallery generators)
- [sites/AGENTS.md](sites/AGENTS.md) (per site design evidence and reports)
- [functional/AGENTS.md](functional/AGENTS.md) (interaction evidence and guardrails)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
