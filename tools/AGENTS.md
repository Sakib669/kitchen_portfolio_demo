# Research scripts

## Overview

These Node.js scripts capture public pages, analyze rendered design details, observe interactions, and build local galleries. The site manifests set the crawl scope and per site behavior.

## Key files

| File | Owns |
|---|---|
| `sites.mjs` | Public design crawl page list and pacing |
| `extract.mjs`, `extract-in-page.mjs` | Browser capture and in page measurements |
| `analyze.mjs` | Design tokens and evidence summaries |
| `build-compare.mjs` | `compare.html` gallery |
| `actions/sites.mjs`, `actions/flows.mjs` | Interaction targets and flow definitions |
| `actions/core.mjs`, `actions/run.mjs` | Network guard and browser flow runner |
| `actions/aggregate.mjs`, `actions/build-functions-html.mjs` | Functional summaries and gallery |

## Conventions

- Use the site slug to connect the manifests, output folders, and reports.
- Keep source measurements in `sites/<slug>/raw/` and interaction records in `functional/actions/<slug>/`.
- Regenerate HTML galleries through their builders.
- Keep the functional runner's write blocking route in place before opening a page.

## Gotchas

- `extract.mjs` normally skips existing captures; `--force` recaptures them.
- `run.mjs --flows` runs only named flows and writes partial evidence as each flow completes.
- A failed mobile flow must not leave the viewport changed for the next flow.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
