# Functional evidence

## Overview

This area records observed interactions across the three public sites. Its JSON flows, network logs, screenshots, and summary files support the feature matrix and gallery.

## Key files

| File | Owns |
|---|---|
| `README.md` | Method, evidence classes, and rerun commands |
| `feature-matrix.md` | Cross site capability comparison |
| `actions/<slug>/flows/*.json` | Step and network evidence |
| `actions/<slug>/summary.json` | Aggregated outcomes |
| `functions.html` | Generated interaction gallery |

## Conventions

- Label claims observed, inferred, or unknown according to `README.md`.
- Never treat a blocked form write as evidence of a successful submission.
- Regenerate summaries and the gallery through `tools/actions/aggregate.mjs` and `tools/actions/build-functions-html.mjs`.

## Gotchas

- Partial or rate limited flows do not prove that an interaction is absent.
- Browser probes intentionally block non GET writes and do not test a live form backend.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
