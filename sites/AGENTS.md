# Site design evidence

## Overview

Each site folder contains one design study. Captured pages and screenshots support generated tokens and facts, while `design-system.md` and `functions.md` explain the findings.

## Key files

| File | Owns |
|---|---|
| `<slug>/raw/<page>/page.json` | Browser measurements for one page |
| `<slug>/analysis/tokens.json` | Structured design tokens |
| `<slug>/analysis/facts.md` | Generated design evidence tables |
| `<slug>/tokens.css`, `<slug>/tailwind.config.js` | Generated token exports |
| `<slug>/design-system.md`, `<slug>/functions.md` | Human readable findings |

## Conventions

- Check the captured page evidence before changing a claim in a report.
- Keep measured colors and typography separate from defined but unused CSS values.
- Regenerate token exports with `node tools/analyze.mjs --site <slug>` after capture changes.

## Gotchas

- The studied sites can change; a new crawl may differ from the saved October 2026 evidence.
- Screenshots contain third party imagery and text and are evidence only.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
