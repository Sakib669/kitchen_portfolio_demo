/** SEAFORM — Tailwind theme extracted from https://www.seaform.com @ 2026-10-26 */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
      "brand-100": "#c9b195",
      "neutral-1": "#000000",
      "neutral-2": "#121212",
      "neutral-3": "#54595f",
      "neutral-4": "#7a7a7a",
      "neutral-5": "#999999",
      "neutral-6": "#f7f7f7",
      "neutral-7": "#ffffff"
      },
      fontFamily: {
      "Optima": [
            "Optima"
      ],
      "Poppins": [
            "Poppins"
      ],
      "Roboto": [
            "Roboto"
      ],
      "Lato": [
            "Lato"
      ]
      },
      fontSize: {
      "14": "14px",
      "15": "15px",
      "16": "16px",
      "18": "18px",
      "20": "20px",
      "22": "22px",
      "23": "23px",
      "24": "24px",
      "25": "25px",
      "30": "30px",
      "35": "35px",
      "40": "40px",
      "48": "48px",
      "60": "60px",
      "77": "77px"
      },
      borderRadius: {
      "1": "3px",
      "2": "50%",
      "3": "0",
      "4": "2px",
      "5": "6px",
      "6": "4px",
      "7": "5px",
      "8": "var(--border-radius)"
      },
      boxShadow: {
      "1": "none",
      "2": "none !important",
      "3": "0 2px 6px rgba(0,0,0,.1)",
      "4": "0 0 10px 4px rgba(0,0,0,.1)",
      "5": "0 0 8px rgba(0,0,0,.6)",
      "6": "none!important"
      },
      screens: {
      "bp-480": "480px",
      "bp-481": "481px",
      "bp-601": "601px",
      "bp-768": "768px",
      "bp-959": "959px",
      "bp-992": "992px"
      },
    }
  }
};
