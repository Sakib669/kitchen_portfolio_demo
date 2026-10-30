// Site manifest for the kitchen-deom design reverse-engineering study.
// Only public marketing pages are crawled; no auth, no paywalls.

export const sites = [
  {
    slug: 'mykitchen-bd',
    name: 'My Kitchen',
    base: 'https://www.mykitchen-bd.com',
    origin: 'https://www.mykitchen-bd.com',
    locale: 'en-BD',
    delay: 2500,
    pages: [
      { path: '/', label: 'Home' },
      { path: '/products', label: 'Products' },
      { path: '/gallery', label: 'Gallery' },
      { path: '/what-we-do', label: 'What We Do' },
      { path: '/company-profile', label: 'Company Profile' },
      { path: '/expertise/kitchen-area', label: 'Kitchen' },
      { path: '/expertise/wardrobes', label: 'Wardrobes' },
      { path: '/factory', label: 'Factory' },
      { path: '/oem-odm', label: 'OEM / ODM' },
      { path: '/contact', label: 'Contact' },
    ],
  },
  {
    slug: 'haecker-kuechen',
    name: 'Häcker Küchen',
    base: 'https://www.haecker-kuechen.com',
    origin: 'https://www.haecker-kuechen.com',
    locale: 'en',
    delay: 2500,
    pages: [
      { path: '/en/', label: 'Home' },
      { path: '/en/kitchen-styles', label: 'Kitchen Styles' },
      { path: '/en/kitchen-furniture', label: 'Kitchen Furniture' },
      { path: '/en/kitchen-manufacturer', label: 'Manufacturer' },
      { path: '/en/concept130', label: 'concept130' },
      { path: '/en/systemat-von-haecker-premiumkuechen-mit-charakter', label: 'Systemat' },
      { path: '/en/kitchenideas', label: 'Kitchen Ideas' },
      { path: '/en/projects', label: 'Projects' },
      { path: '/en/kitchen-planner', label: 'Kitchen Planner' },
      { path: '/en/concept130/perfect-soft-black', label: 'Collection Detail' },
      { path: '/en/kitchen-magazine', label: 'Magazine' },
    ],
  },
  {
    slug: 'seaform',
    name: 'SEAFORM',
    base: 'https://www.seaform.com',
    origin: 'https://www.seaform.com',
    locale: 'en-AU',
    delay: 9000, // robots.txt declares Crawl-delay: 10
    pages: [
      { path: '/', label: 'Home' },
      { path: '/the-brand', label: 'The Brand' },
      { path: '/kitchen-collections', label: 'Kitchen Collections' },
      { path: '/kitchen-collections/hamptons', label: 'Hamptons Collection' },
      { path: '/kitchen-materials-colors', label: 'Materials & Colours' },
      { path: '/kitchen-interiors', label: 'Kitchen Interiors' },
      { path: '/wardrobe-collections', label: 'Wardrobes' },
      { path: '/projects', label: 'Projects' },
      { path: '/manufacturing', label: 'Manufacturing' },
      { path: '/about-seaform', label: 'About' },
      { path: '/contact-us', label: 'Contact' },
    ],
  },
];

export function siteBySlug(slug) {
  return sites.find((s) => s.slug === slug);
}
