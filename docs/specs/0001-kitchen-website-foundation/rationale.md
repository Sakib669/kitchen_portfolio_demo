# Kitchen brand website foundation, rationale

## Context

> ⚠️ Premise note: Browser local storage cannot publish an editor's changes to other visitors or deliver inquiries to the brand. The engineer chose a browser local prototype with those limits. A shared marketing site would need a later storage and delivery decision.

The existing folder is a completed design and interaction study of three kitchen sites. It has research scripts and generated evidence, but no application scaffold or usable Git history. The new product is a publicly reachable prototype for Bangladesh, with English and Bangla starter content, collection browsing, product line details, and a local inquiry demonstration. Every browser owns its own edits and inquiries. Visitors do not need accounts, prices, orders, or search.

## Options considered

| Full approach | Benefit | Cost |
|---|---|---|
| Next.js, browser local storage, Vercel, Tailwind CSS, shadcn/ui | Keeps every mutable record in one browser and preserves the chosen UI and hosting stack. | No shared publishing, real lead delivery, or search visibility for local edits. (basis: [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html)) |
| Next.js, Sanity, Vercel, Resend, Tailwind CSS, shadcn/ui | Gives editors shared publishing and sends real inquiries. | Requires several managed services and sends content and inquiries outside the browser. (basis: [Sanity embedded Studio](https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs)) |
| Next.js with versioned content files only | Public content is simple to render and deploy with no browser data layer. | Visitors cannot edit their own copy or keep local inquiries. (basis: the requested browser editing behavior) |

The options were judged against the explicit decision that all mutable site data stays in browser local storage, while starter content and images ship with the site. (basis: the engineer's revised storage decision, [README.md](../../../README.md))

## Rationale

Browser storage fits a prototype where each visitor works with a private copy. It cannot meet the original shared editing and lead capture goals, and the engineer accepted that tradeoff. Versioned starter content gives a fresh browser useful pages, while JSON export and import provide manual backup. Local storage can fill or disappear when browser data is cleared, so save failures must be visible. (basis: [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html), [Storage Standard](https://storage.spec.whatwg.org/))

Next.js remains the engineer's selected framework. It can render starter pages into the initial HTML while browser code loads personal edits. Tailwind CSS and shadcn/ui remain the selected UI tools. CSS variables should carry original brand tokens so generated research tokens remain evidence rather than copied design. (basis: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [shadcn/ui Next.js setup](https://ui.shadcn.com/docs/installation/next))

Separate language records permit a browser to edit English and Bangla independently. Explicit language paths give starter content stable public URLs. Local changes cannot update shared SEO metadata or a public sitemap. Image paths stay in local storage, while the image files stay in the application because full photos exceed a sensible browser storage budget. (basis: [Next.js internationalization](https://nextjs.org/docs/app/guides/internationalization), [Storage Standard](https://storage.spec.whatwg.org/))

## References

**Project sources**

- [README.md](../../../README.md), the research scope and generated evidence.
- [functional/README.md](../../../functional/README.md), the interaction evidence and write guard.

**Practices and standards**

- One deployable application for a small public product.
- Server validation and least privilege for contact and editor access.
- Explain clearly when an inquiry is saved locally rather than delivered.

**Links**

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html)
- [Storage Standard](https://storage.spec.whatwg.org/)
- [Next.js internationalization](https://nextjs.org/docs/app/guides/internationalization)
- [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js image](https://nextjs.org/docs/app/api-reference/components/image)
- [Sanity embedded Studio](https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs)
- [shadcn/ui Next.js setup](https://ui.shadcn.com/docs/installation/next)
