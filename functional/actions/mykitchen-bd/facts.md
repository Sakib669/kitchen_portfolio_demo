# My Kitchen — functional evidence

Observed 22/22 flows in a real Chromium session at 1440×900 (+390×844 for mobile probes). Form writes were blocked client-side and recorded, never sent.

## Session totals

- Requests captured: 2102
- Cookies: wa_ul, wa_lang_pref
- localStorage: none
- sessionStorage: myKitchenAdDismissed
- Blocked writes: 4
- Third parties: Google Maps (32), Google Fonts (4), Google Fonts (4), Google (2)
- Unknown external domains: static.whatsapp.net, maps.gstatic.com, api.whatsapp.com, wa.me, send

## Flows

| Flow | Result | Steps | Requests | Blocked writes | Evidence |
| --- | --- | --- | --- | --- | --- |
| accordions | ok | 4 | 94 | 2 | flows/accordions.json |
| baseline | ok | 6 | 72 | 0 | flows/baseline.json |
| carousel | ok | 3 | 80 | 0 | flows/carousel.json |
| chat | ok | 2 | 92 | 0 | flows/chat.json |
| cookie | ok | 4 | 142 | 0 | flows/cookie.json |
| detailProbes | ok | 2 | 74 | 0 | flows/detailProbes.json |
| finalise | ok | 1 | 8 | 0 | flows/finalise.json |
| forms | ok | 3 | 72 | 2 | flows/forms.json |
| hoverStates | ok | 1 | 112 | 0 | flows/hoverStates.json |
| keyboard | ok | 3 | 71 | 0 | flows/keyboard.json |
| language | ok | 1 | 0 | 0 | flows/language.json |
| linksAssets | ok | 6 | 116 | 0 | flows/linksAssets.json |
| mobileUi | ok | 2 | 70 | 0 | flows/mobileUi.json |
| modal | ok | 5 | 214 | 0 | flows/modal.json |
| navDesktop | ok | 2 | 148 | 0 | flows/navDesktop.json |
| navMobile | ok | 4 | 65 | 0 | flows/navMobile.json |
| notFound | ok | 1 | 12 | 0 | flows/notFound.json |
| pageProbe | ok | 6 | 285 | 0 | flows/pageProbe.json |
| scroll | ok | 3 | 93 | 0 | flows/scroll.json |
| search | ok | 2 | 77 | 0 | flows/search.json |
| tabsFilters | ok | 3 | 149 | 0 | flows/tabsFilters.json |
| videoLightbox | ok | 1 | 56 | 0 | flows/videoLightbox.json |

## Forms

### contact

- Page: https://www.mykitchen-bd.com/contact
- Action: https://www.mykitchen-bd.com/contact · method: GET · framework: custom/unknown · file input: false · consent checkbox: false

| # | Field | Type | Required | Placeholder | Options |
| --- | --- | --- | --- | --- | --- |
| 1 | firstName | text | no | First Name |  |
| 2 | lastName | text | no | Last Name |  |
| 3 | email | email | no | Email |  |
| 4 | phone | tel | no | Phone |  |
| 5 | subject | text | no | Subject |  |
| 6 | message | select-one | no |  | 5 |

## Downloads / assets

- http://api.mykitchen-bd.com/uploads/file-1761366144703-548596167.pdf → 200 application/pdf 29422722

## Blocked writes

- POST https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetViewportInfo
- POST https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/InitMapsJwt
- POST https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetViewportInfo
- POST https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/InitMapsJwt

## Domain inventory

- www.mykitchen-bd.com (1963)
- api.mykitchen-bd.com (144)
- maps.googleapis.com (32)
- static.whatsapp.net (17)
- maps.gstatic.com (4)
- fonts.googleapis.com (4)
- fonts.gstatic.com (4)
- www.google.com (2)
- api.whatsapp.com (2)
- wa.me (1)
- send (1)