# Kitchen brand website foundation

**Status**: Implemented locally
**Date**: 2026-10-30

## Summary

Build an original kitchen website prototype for Bangladesh at the repository root. Next.js serves English and Bangla starter pages, while each browser keeps its own editable copy in local storage. Vercel hosts the prototype, and the existing research remains available as design evidence.

## Decision

Use one Next.js application with no shared application data store. The application includes starter content in its build, then copies that content into browser local storage on first use. An editor screen changes only that browser's copy. An inquiry is saved only in the visitor's browser and is never sent to the brand. (basis: the engineer's revised storage decision, [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html))

The visual identity should be original and suitable for visitors in Bangladesh. Use the saved research to judge layout and interaction choices, while using original brand media or licensed temporary images. A separate design decision should choose final typography, colors, and page composition.

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Repository | Next.js application at the root, research folders retained | Keeps the prototype and its evidence together. |
| Runtime | Current supported Node.js LTS, pinned for deployment and CI | Keeps development and deployment on one runtime. |
| Language | TypeScript | Checks CMS data, locales, and form values before release. |
| Package manager | pnpm with one lockfile | Gives repeatable installs for the site and research scripts. |
| Web framework | Next.js 16 App Router | Renders starter pages into HTML and supports browser editing screens. |
| Styling | Tailwind CSS 3, CSS variables for brand tokens, local shadcn-style controls | Supports an original visual system while keeping component source in the app. |
| Content store | Browser `localStorage` with one versioned JSON record per origin | Keeps mutable content and saved inquiries on that device. |
| Starter content | Versioned English and Bangla data bundled with the application | Gives every fresh browser useful pages and indexable starter HTML. |
| Editor | Local editor screen at `/studio` with no shared account | Lets anyone edit only their current browser's copy. |
| Localization | Separate `en` and `bn` records linked by a stable translation ID | Allows each language to have its own slug and content. |
| Media | Image files shipped with the application, paths stored in content records | Avoids placing large image data in local storage. |
| Image and font delivery | `next/image` and self hosted English and Bengali fonts | Controls image sizes and avoids font requests to a third party. |
| Data validation | Zod for local edits and JSON imports, with localized form errors | Rejects malformed content before it replaces saved data. |
| Contact handling | Save the inquiry locally with a clear unsent message | Matches the browser only data rule. |
| Hosting | Vercel production and preview deployments | Lets people try the prototype in their own browsers. |
| Release checks | TypeScript, lint, production build, Playwright browser journeys | Checks both languages and the contact path before release. |
| CI | GitHub Actions plus Vercel previews | Runs checks before merging and shows each proposed change. |

There is no CMS, server database, mail provider, visitor account, shared publishing flow, analytics service, or payment provider. Browser storage is not shared across devices or visitors. Search engines see the bundled starter content, not personal edits. (basis: the revised browser only scope, [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html))

## Site contract

**Routes and local content**

| Route | Purpose |
|---|---|
| `/` | Redirect to `/en`. |
| `/en`, `/bn` | Home pages. |
| `/en/collections`, `/bn/collections` | Collection browsing. |
| `/{lang}/collections/{collectionSlug}` | Collection intro and its product lines. |
| `/{lang}/products/{productSlug}` | Product line story, gallery, and inquiry link. |
| `/{lang}/about`, `/{lang}/contact`, `/{lang}/privacy` | Brand, inquiry, and privacy pages. |
| `/studio` | Local editor for this browser's content, with no shared authentication. |

Only `en` and `bn` are valid language values. English and Bangla slugs may differ. Starter pages are rendered into the initial HTML. A browser may show locally edited content after loading, but those edits never change the HTML sent to other visitors or search engines. Missing local translations stay out of that browser's navigation. Switching to a missing translation goes to that language's home page. (basis: the agreed language workflow, [Next.js internationalization](https://nextjs.org/docs/app/guides/internationalization), [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html))

**Content documents**

| Document | Required fields | Links and rules |
|---|---|---|
| Site settings | Brand name, contact channels, logo path, social links, default social image path | One record per browser. |
| Home page | Language, title, hero image path, body, featured IDs, SEO title and description | One record per language. Fixed page layout. |
| About page | Language, title, body, image paths, SEO title and description | One record per language. Fixed page layout. |
| Collection index page | Language, title, introduction, SEO title and description | One record per language. Fixed page layout. |
| Contact page | Language, title, introduction, SEO title and description | One record per language. Fixed page layout. |
| Privacy page | Language, title, body, SEO title and description | One record per language. |
| Collection | Stable ID, translation ID, language, slug, title, introduction, hero image path, display order, SEO title and description | Slug unique within the language and collection type. |
| Product line | Stable ID, translation ID, language, slug, title, summary, story, gallery image paths, display order, collection ID, SEO title and description | Exactly one collection in the same language. Slug unique within the language and product type. |
| Saved inquiry | ID, created time, locale, name, email or phone, message, consent, optional product ID | Stored only in the visitor's browser. Never transmitted. |

Stable IDs identify records, and translation IDs connect language versions. Product lines show no prices. Browsing is by collection without search or filters. Anyone using a browser may edit its local content and featured references. Developers own page structure. (basis: the confirmed content model, revised for local storage)

Each language's contact page links to that language's privacy page, so the local consent link always resolves.

**Local storage flow**

On first use, copy the versioned starter dataset into a `aangan-kitchens:v1` local storage record. Validate it before use. Read and write through one storage module so schema changes, quota errors, and cross tab updates have one handling path. The editor can save changes, reset to starter data, export a JSON backup, and import a validated JSON backup. Import replaces the current browser record only after a confirmation and an offered export. A cleared browser profile loses unsaved backups and saved inquiries. If storage is blocked or full, show the starter pages and a clear warning, and never claim that an edit or inquiry was saved. (basis: [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html), [Storage Standard](https://storage.spec.whatwg.org/))

Render starter routes into initial HTML. For a locally created product slug absent from the starter build, the server may return a generic route shell; the browser resolves the record from its own storage. Such local pages have no searchable content in server HTML and cannot be shared with another browser. Avoid placing local product data in the URL. The browser storage event keeps tabs on the same origin in sync.

**Contact flow**

The form accepts name, at least one of email or phone, message, consent, locale, and an optional product ID. Validate it with Zod before writing a saved inquiry to local storage. Resolve the product name from the same browser's content. The confirmation must say **“Saved on this device, not sent.”** The page must also offer a direct phone or WhatsApp link for visitors who want to contact the brand. Do not present the saved inquiry as a delivered lead. The visitor can view and delete saved inquiries, and the JSON export includes them only after a clear warning about personal data. There is no contact API, email send, server rate limit, or CAPTCHA. (basis: the engineer's revised local inquiry decision)

Before saving, tell the visitor that the inquiry stays on this device and can be read by anyone with access to its browser profile. Render imported and edited content as text rather than trusted HTML, and apply a restrictive content security policy. Browser storage must never contain credentials or API secrets.

**Search and presentation**

Every starter route provides a localized title, description, canonical URL, social image, and relevant alternate language links in its initial HTML. The social image comes from the starter page hero or first gallery image, then the starter site settings default. Generate a sitemap with starter routes only and keep `/studio` out of search. Local edits do not change server metadata, sitemap entries, or content shown to search engines. Use responsive bundled images. Keep navigation and galleries usable by keyboard and reduced motion settings. (basis: [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap), [Next.js image](https://nextjs.org/docs/app/api-reference/components/image))

**Configuration**

Set the canonical site URL for generated links and metadata. No API keys, CMS credentials, mail secrets, or server data store are required. The editor screen has no meaningful access control because it changes only the current browser's copy. Do not store secrets in local storage.

**Verification**

GitHub Actions runs type checking, linting, a production build, and Playwright journeys for fresh English and Bangla browsers, collection to product navigation, local edits, reload persistence, cross tab updates, JSON export and import, reset, missing translations, inquiry storage, and unavailable or full storage. Check the initial HTML and sitemap separately from browser edited views. Existing research scripts remain runnable from the root with Playwright in dev dependencies when the shared `node_modules` link is replaced.

## Consequences

**Positive**

- Each browser can edit and keep its own bilingual prototype without accounts or a backend data service.
- Starter pages can appear in initial HTML for a fresh visitor and search engine.
- JSON export and import give people a manual way to back up or move their own data.

**Negative and tradeoffs**

- Local edits are private to one browser. They do not publish to visitors, survive browser data clearing without an export, or appear in search results.
- Inquiries never reach the brand. The form is a local demonstration and must say so clearly.
- Local storage has limited capacity and can be disabled. Image bytes remain in bundled files.
- An editor screen on a public deployment is available to everyone for their own browser copy; it is not a protected CMS.
- Starter HTML can briefly change after the browser loads a local edit.

## Follow-up

- [ ] Confirm the final brand name, domain, phone or WhatsApp contact, and original photos. The bundled images are original generated concepts; replace them with final brand photography before a commercial launch.
- [ ] Write the visual design system and page composition as a separate design decision, using the research as evidence and an original identity for Bangladesh visitors.
- [ ] Write the privacy text so visitors understand that inquiries stay in their browser and are not sent.
- [ ] Replace local storage with shared content and inquiry delivery in a later decision if this prototype becomes a real marketing and lead capture site.
- [ ] Initialize a usable Git repository before GitHub Actions and Vercel previews can run. This folder currently has no usable Git history.
- [ ] Install the selected Playwright, React best practices, and web design guideline skills when package registry access is available. Their install commands timed out in this workspace.
- [ ] Connect the optional shadcn MCP server if live component access is useful during implementation. The previously selected Sanity MCP no longer applies.
- [ ] Run `/sync` after this foundation is accepted so root `AGENTS.md` reflects the new application stack.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
