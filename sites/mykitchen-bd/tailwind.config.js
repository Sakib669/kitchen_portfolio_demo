/** My Kitchen — Tailwind theme extracted from https://www.mykitchen-bd.com @ 2026-10-26 */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
      "brand-100": "#e84538",
      "neutral-1": "#000000",
      "neutral-2": "#1c1c1c",
      "neutral-3": "#444444",
      "neutral-4": "#646464",
      "neutral-5": "#939494",
      "neutral-6": "#9ca3af",
      "neutral-7": "#d1d5db",
      "neutral-8": "#e6e6e6",
      "neutral-9": "#f5f5f5",
      "neutral-10": "#ffffff"
      },
      fontFamily: {
      "Inter": [
            "Inter"
      ]
      },
      fontSize: {
      "14": "14px",
      "16": "16px",
      "18": "18px",
      "20": "20px",
      "24": "24px",
      "30": "30px",
      "36": "36px",
      "48": "48px",
      "72": "72px"
      },
      borderRadius: {
      "1": "0",
      "2": "4px",
      "3": ".5rem",
      "4": ".375rem",
      "5": "9999px",
      "6": "50%",
      "7": ".25rem",
      "8": "var(--border-radius)"
      },
      boxShadow: {
      "1": "var(--tw-ring-offset-shadow,0 0 #0000), var(--tw-ring-shadow,0 0 #0000), var(--tw-shadow)",
      "2": "var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow,0 0 #0000)",
      "3": "0 4px 12px #0000001a,0 0 0 2px #0003",
      "4": "none",
      "5": "0 4px 12px #0000001a",
      "6": "0 0 0 2px #0006"
      },
      screens: {
      "bp-640": "640px",
      "bp-768": "768px",
      "bp-1024": "1024px",
      "bp-1280": "1280px",
      "bp-1400": "1400px",
      "bp-1536": "1536px",
      "bp-1600": "1600px",
      "bp-1750": "1750px"
      },
    }
  }
};
