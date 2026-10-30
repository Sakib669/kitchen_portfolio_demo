import type { SiteData } from "./types";

const hero = "/images/hero-kitchen.webp";
const oak = "/images/light-oak.webp";
const olive = "/images/walnut-olive.webp";
const city = "/images/city-light.webp";

export const imageChoices = [
  { path: hero, label: "Warm walnut hero" },
  { path: oak, label: "Light oak kitchen" },
  { path: olive, label: "Walnut and olive kitchen" },
  { path: city, label: "City light kitchen" },
];

export const starterData: SiteData = {
  version: 1,
  brand: {
    name: "AANGAN",
    nameBn: "আঙিনা",
    tagline: "Made for living",
    taglineBn: "জীবনের জন্য সাজানো",
    phone: "",
    whatsapp: "",
    instagram: "",
    logo: "",
    socialImage: hero,
  },
  pages: {
    home: {
      en: {
        title: "Home",
        kicker: "Kitchens for the way you live",
        headline: "A kitchen shaped around living.",
        subhead: "For shared meals, slow mornings, and every day in between.",
        body: "A considered home begins with the spaces we return to most. Explore kitchen ideas with room for every part of life.",
        image: hero,
        featured: ["c1-en", "c2-en", "c3-en"],
        seoTitle: "AANGAN Kitchens | Thoughtful kitchens for living",
        seoDescription: "Explore warm, considered kitchen concepts for homes in Bangladesh.",
      },
      bn: {
        title: "হোম",
        kicker: "আপনার জীবনযাপনের জন্য রান্নাঘর",
        headline: "যে রান্নাঘরে জীবনের গল্প জমে।",
        subhead: "একসঙ্গে খাওয়া, ধীর সকাল আর প্রতিদিনের আপন মুহূর্তের জন্য।",
        body: "ঘরের সবচেয়ে আপন জায়গাটি হোক ভেবেচিন্তে সাজানো। দেখুন এমন সব রান্নাঘরের ভাবনা, যেখানে জীবনের প্রতিটি মুহূর্তের জায়গা আছে।",
        image: hero,
        featured: ["c1-bn", "c2-bn", "c3-bn"],
        seoTitle: "আঙিনা কিচেনস | জীবনের জন্য সাজানো রান্নাঘর",
        seoDescription: "বাংলাদেশের ঘরের জন্য উষ্ণ ও যত্নে ভাবা রান্নাঘরের ধারণা দেখুন।",
      },
    },
    about: {
      en: {
        title: "The heart of a home deserves thought.",
        kicker: "Our point of view",
        body: "A kitchen is more than cabinetry. It is where a quick cup of tea turns into a conversation, where everyday rituals find their rhythm, and where a home feels most alive.\n\nAANGAN is a design concept shaped around warmth, useful details, and the way people actually live. This prototype lets you explore that idea and make it your own in this browser.",
        image: oak,
        seoTitle: "About AANGAN Kitchens",
        seoDescription: "Learn the thinking behind AANGAN's warm, practical kitchen concepts.",
      },
      bn: {
        title: "ঘরের প্রাণকেন্দ্রটি হোক যত্নে সাজানো।",
        kicker: "আমাদের ভাবনা",
        body: "রান্নাঘর শুধু আলমারি আর কাউন্টার নয়। এক কাপ চায়ের ফাঁকে গল্প, প্রতিদিনের ছোট ছোট অভ্যাস আর ঘরের সবচেয়ে প্রাণবন্ত মুহূর্তের ঠিকানা।\n\nআঙিনা একটি ডিজাইন ধারণা, যেখানে উষ্ণতা, কাজের সুবিধা আর বাস্তব জীবনযাপন একসঙ্গে আসে। এই প্রোটোটাইপে সেই ভাবনাটি দেখুন, নিজের ব্রাউজারে নিজের মতো সাজান।",
        image: oak,
        seoTitle: "আঙিনা কিচেনস সম্পর্কে",
        seoDescription: "উষ্ণ ও ব্যবহারিক রান্নাঘরের পেছনের ভাবনা জানুন।",
      },
    },
    collections: {
      en: {
        title: "Collections for every kind of home.",
        kicker: "Explore the collection",
        body: "From quiet natural textures to confident contrasts, find a direction that feels like yours.",
        image: city,
        seoTitle: "Kitchen collections | AANGAN Kitchens",
        seoDescription: "Browse AANGAN's light, warm, and urban kitchen collections.",
      },
      bn: {
        title: "প্রতিটি ঘরের জন্য আলাদা ভাবনা।",
        kicker: "কালেকশন দেখুন",
        body: "নরম প্রাকৃতিক আবহ থেকে সাহসী বৈপরীত্য, বেছে নিন আপনার ঘরের সঙ্গে মানানসই একটি দিক।",
        image: city,
        seoTitle: "কিচেন কালেকশন | আঙিনা কিচেনস",
        seoDescription: "আঙিনার উজ্জ্বল, উষ্ণ ও শহুরে রান্নাঘরের কালেকশন দেখুন।",
      },
    },
    contact: {
      en: {
        title: "Start with an idea.",
        kicker: "Your space, your story",
        body: "This is a browser local prototype. The form below saves your note on this device only. It does not send a message to AANGAN or any other business.",
        image: olive,
        seoTitle: "Contact demo | AANGAN Kitchens",
        seoDescription: "Try the local inquiry experience in the AANGAN kitchen prototype.",
      },
      bn: {
        title: "শুরু হোক একটি ভাবনা থেকে।",
        kicker: "আপনার ঘর, আপনার গল্প",
        body: "এটি ব্রাউজারে সংরক্ষিত একটি প্রোটোটাইপ। নিচের ফর্মে লেখা তথ্য শুধু এই ডিভাইসে সেভ হবে। আঙিনা বা অন্য কোনো প্রতিষ্ঠানে বার্তা পাঠানো হবে না।",
        image: olive,
        seoTitle: "যোগাযোগের ডেমো | আঙিনা কিচেনস",
        seoDescription: "আঙিনা কিচেন প্রোটোটাইপে লোকাল ইনকোয়ারি অভিজ্ঞতা দেখুন।",
      },
    },
    privacy: {
      en: {
        title: "Your data stays with you.",
        kicker: "Privacy in this prototype",
        body: "The content you edit and any inquiry you save are stored in this browser's local storage. They are not sent to AANGAN, a server, or another visitor. Anyone with access to this browser profile may see them.\n\nClearing browser data removes them. You can export a JSON backup, import it later, or reset the prototype from the local editor. The bundled starter pages and images are part of the website files. No visitor analytics are enabled.",
        image: city,
        seoTitle: "Privacy | AANGAN Kitchens prototype",
        seoDescription: "How this browser local kitchen prototype handles your data.",
      },
      bn: {
        title: "আপনার তথ্য আপনার কাছেই।",
        kicker: "এই প্রোটোটাইপে গোপনীয়তা",
        body: "আপনি যে লেখা বদলাবেন বা যে বার্তা সেভ করবেন, তা এই ব্রাউজারের লোকাল স্টোরেজে থাকবে। আঙিনা, কোনো সার্ভার বা অন্য দর্শকের কাছে যাবে না। এই ব্রাউজার প্রোফাইল ব্যবহার করতে পারে এমন কেউ তথ্যগুলো দেখতে পারবে।\n\nব্রাউজারের ডেটা মুছে ফেললে এগুলোও মুছে যাবে। চাইলে JSON ব্যাকআপ নিতে, পরে ইমপোর্ট করতে বা লোকাল এডিটর থেকে আবার শুরু করতে পারবেন। শুরুতে থাকা পেজ ও ছবিগুলো ওয়েবসাইটের ফাইলের অংশ। কোনো ভিজিটর অ্যানালিটিক্স চালু নেই।",
        image: city,
        seoTitle: "গোপনীয়তা | আঙিনা কিচেনস প্রোটোটাইপ",
        seoDescription: "এই ব্রাউজার লোকাল কিচেন প্রোটোটাইপে আপনার তথ্য কীভাবে থাকে।",
      },
    },
  },
  collections: [
    { id: "c1-en", translationId: "c1", lang: "en", slug: "soft-naturals", title: "Soft Naturals", intro: "Light, tactile and quietly welcoming. An easy calm for everyday living.", image: oak, order: 1, seoTitle: "Soft Naturals | AANGAN", seoDescription: "Explore light oak and soft natural kitchen concepts." },
    { id: "c1-bn", translationId: "c1", lang: "bn", slug: "komol-prokriti", title: "কোমল প্রকৃতি", intro: "হালকা রং, ছুঁয়ে দেখার মতো টেক্সচার আর প্রতিদিনের শান্তি।", image: oak, order: 1, seoTitle: "কোমল প্রকৃতি | আঙিনা", seoDescription: "হালকা কাঠ আর প্রাকৃতিক আবহের রান্নাঘর দেখুন।" },
    { id: "c2-en", translationId: "c2", lang: "en", slug: "warm-contrasts", title: "Warm Contrasts", intro: "Grounded timber meets expressive tones for a room with presence.", image: olive, order: 2, seoTitle: "Warm Contrasts | AANGAN", seoDescription: "Explore walnut and olive kitchen concepts." },
    { id: "c2-bn", translationId: "c2", lang: "bn", slug: "ushno-boiporitto", title: "উষ্ণ বৈপরীত্য", intro: "গাঢ় কাঠ আর গভীর রঙের মেলবন্ধনে তৈরি নিজস্ব চরিত্র।", image: olive, order: 2, seoTitle: "উষ্ণ বৈপরীত্য | আঙিনা", seoDescription: "আখরোট কাঠ আর জলপাই রঙের রান্নাঘর দেখুন।" },
    { id: "c3-en", translationId: "c3", lang: "en", slug: "city-light", title: "City Light", intro: "Clever, bright and beautifully composed for a more compact home.", image: city, order: 3, seoTitle: "City Light | AANGAN", seoDescription: "Explore bright kitchen concepts for city homes." },
    { id: "c3-bn", translationId: "c3", lang: "bn", slug: "shohorer-alo", title: "শহরের আলো", intro: "ছোট পরিসরে আলো, স্বাচ্ছন্দ্য আর কাজে লাগার মতো নকশা।", image: city, order: 3, seoTitle: "শহরের আলো | আঙিনা", seoDescription: "শহরের ঘরের জন্য উজ্জ্বল রান্নাঘরের ভাবনা দেখুন।" },
  ],
  products: [
    { id: "p1-en", translationId: "p1", lang: "en", slug: "sora", title: "Sora", summary: "A generous island and soft oak for a room that invites everyone in.", story: "Sora balances clean lines with the warmth of natural timber. Its open island creates space to cook, gather and linger, while quiet storage keeps the room feeling light.", image: oak, gallery: [oak, hero], collectionId: "c1-en", order: 1, seoTitle: "Sora kitchen | AANGAN", seoDescription: "Meet Sora, a light oak kitchen with room to gather." },
    { id: "p1-bn", translationId: "p1", lang: "bn", slug: "sora", title: "সোরা", summary: "বড় আইল্যান্ড আর হালকা কাঠে সবার জন্য খোলা একটি ঘর।", story: "সোরায় সহজ রেখার সঙ্গে মিশেছে প্রাকৃতিক কাঠের উষ্ণতা। খোলা আইল্যান্ডে রান্না, আড্ডা আর একসঙ্গে সময় কাটানোর জায়গা আছে।", image: oak, gallery: [oak, hero], collectionId: "c1-bn", order: 1, seoTitle: "সোরা কিচেন | আঙিনা", seoDescription: "একসঙ্গে সময় কাটানোর জন্য হালকা কাঠের সোরা রান্নাঘর।" },
    { id: "p2-en", translationId: "p2", lang: "en", slug: "mira", title: "Mira", summary: "Pale surfaces, gentle texture and an unmistakable sense of ease.", story: "Mira makes space for the small rituals of home. A bright palette reflects daylight through the room, while textured doors and timber details keep it warm.", image: hero, gallery: [hero, oak], collectionId: "c1-en", order: 2, seoTitle: "Mira kitchen | AANGAN", seoDescription: "Meet Mira, a bright kitchen with gentle texture." },
    { id: "p2-bn", translationId: "p2", lang: "bn", slug: "mira", title: "মীরা", summary: "হালকা রং, কোমল টেক্সচার আর সহজ স্বস্তির অনুভূতি।", story: "মীরা ঘরের ছোট ছোট অভ্যাসের জন্য জায়গা করে দেয়। উজ্জ্বল রঙে আলো ছড়িয়ে পড়ে, আর কাঠের ছোঁয়ায় ঘর থাকে উষ্ণ।", image: hero, gallery: [hero, oak], collectionId: "c1-bn", order: 2, seoTitle: "মীরা কিচেন | আঙিনা", seoDescription: "কোমল টেক্সচারের উজ্জ্বল মীরা রান্নাঘর।" },
    { id: "p3-en", translationId: "p3", lang: "en", slug: "aranya", title: "Aranya", summary: "Deep olive and walnut make a kitchen with a distinct point of view.", story: "Aranya brings natural depth into a modern home. Rich timber, olive cabinetry and a light stone surface create a grounded place for everyday life.", image: olive, gallery: [olive, hero], collectionId: "c2-en", order: 1, seoTitle: "Aranya kitchen | AANGAN", seoDescription: "Meet Aranya, an olive and walnut kitchen concept." },
    { id: "p3-bn", translationId: "p3", lang: "bn", slug: "aronno", title: "অরণ্য", summary: "জলপাই রং আর গাঢ় কাঠে আলাদা ব্যক্তিত্বের রান্নাঘর।", story: "অরণ্য আধুনিক ঘরে আনে প্রকৃতির গভীরতা। গাঢ় কাঠ, জলপাই রঙের আলমারি আর হালকা পাথরে তৈরি হয় প্রতিদিনের আপন জায়গা।", image: olive, gallery: [olive, hero], collectionId: "c2-bn", order: 1, seoTitle: "অরণ্য কিচেন | আঙিনা", seoDescription: "জলপাই আর আখরোট কাঠের অরণ্য রান্নাঘর।" },
    { id: "p4-en", translationId: "p4", lang: "en", slug: "riva", title: "Riva", summary: "A more expressive palette with a timeless material story.", story: "Riva pairs dark cabinetry with natural light and stone. The result feels composed and inviting, with generous surfaces for the moments that matter.", image: olive, gallery: [olive, oak], collectionId: "c2-en", order: 2, seoTitle: "Riva kitchen | AANGAN", seoDescription: "Meet Riva, a rich modern kitchen concept." },
    { id: "p4-bn", translationId: "p4", lang: "bn", slug: "riva", title: "রিভা", summary: "গভীর রং আর চিরচেনা উপকরণের নতুন গল্প।", story: "রিভায় গাঢ় আলমারি, প্রাকৃতিক আলো আর পাথর একসঙ্গে আসে। তৈরি হয় গোছানো অথচ আপন একটি রান্নাঘর।", image: olive, gallery: [olive, oak], collectionId: "c2-bn", order: 2, seoTitle: "রিভা কিচেন | আঙিনা", seoDescription: "গভীর রঙের আধুনিক রিভা রান্নাঘর।" },
    { id: "p5-en", translationId: "p5", lang: "en", slug: "noya", title: "Noya", summary: "A bright layout that makes a city home feel open and effortless.", story: "Noya is designed around clear work surfaces and useful storage. Light finishes and a practical plan make every corner feel considered.", image: city, gallery: [city, oak], collectionId: "c3-en", order: 1, seoTitle: "Noya kitchen | AANGAN", seoDescription: "Meet Noya, a bright kitchen for a city home." },
    { id: "p5-bn", translationId: "p5", lang: "bn", slug: "noya", title: "নয়া", summary: "শহরের ঘরকে খোলা আর সহজ করে তোলা উজ্জ্বল নকশা।", story: "নয়ায় আছে পরিষ্কার কাজের জায়গা আর দরকারি স্টোরেজ। হালকা রং আর ব্যবহারিক বিন্যাসে প্রতিটি কোণ ভেবেচিন্তে সাজানো।", image: city, gallery: [city, oak], collectionId: "c3-bn", order: 1, seoTitle: "নয়া কিচেন | আঙিনা", seoDescription: "শহরের ঘরের জন্য উজ্জ্বল নয়া রান্নাঘর।" },
    { id: "p6-en", translationId: "p6", lang: "en", slug: "tara", title: "Tara", summary: "Calm lines and clever details for the rhythm of everyday life.", story: "Tara brings a sense of order to compact spaces without losing warmth. Everything has a place, and the room still feels open to life.", image: city, gallery: [city, hero], collectionId: "c3-en", order: 2, seoTitle: "Tara kitchen | AANGAN", seoDescription: "Meet Tara, a calm kitchen for compact living." },
    { id: "p6-bn", translationId: "p6", lang: "bn", slug: "tara", title: "তারা", summary: "প্রতিদিনের ছন্দের জন্য সহজ রেখা আর বুদ্ধিদীপ্ত সাজানো।", story: "তারা ছোট জায়গায় আনে গোছানো স্বস্তি। সবকিছুর নিজস্ব জায়গা আছে, তবু ঘর থাকে খোলা আর প্রাণবন্ত।", image: city, gallery: [city, hero], collectionId: "c3-bn", order: 2, seoTitle: "তারা কিচেন | আঙিনা", seoDescription: "ছোট ঘরের জন্য শান্ত ও ব্যবহারিক তারা রান্নাঘর।" },
  ],
  inquiries: [],
};
