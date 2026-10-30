/** Häcker Küchen — Tailwind theme extracted from https://www.haecker-kuechen.com @ 2026-10-26 */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
      "neutral-1": "#000000",
      "neutral-2": "#222222",
      "neutral-3": "#7a7a7a",
      "neutral-4": "#969696",
      "neutral-5": "#f7f7f7",
      "neutral-6": "#ffffff"
      },
      fontFamily: {
      "Nunito Sans": [
            "Nunito Sans"
      ],
      "ACaslonPro": [
            "ACaslonPro"
      ]
      },
      fontSize: {
      "14": "14px",
      "15": "15px",
      "16": "16px",
      "18": "18px",
      "32": "32px",
      "36": "36px",
      "45": "45px",
      "90": "90px",
      "30.6": "30.6px",
      "30.01": "30.01px",
      "25.2": "25.2px",
      "23.4": "23.4px",
      "15.84": "15.84px",
      "15.75": "15.75px",
      "14.63": "14.63px",
      "14.4": "14.4px",
      "13.86": "13.86px",
      "12.6": "12.6px"
      },
      borderRadius: {
      "1": "0",
      "2": "100%",
      "3": "50px",
      "4": "10px",
      "5": "10em",
      "6": "5px",
      "7": "4px",
      "8": "20px"
      },
      boxShadow: {
      "1": "none",
      "2": "0 0 0 .2rem rgba(0,0,0,.25)",
      "3": "0 0 0 .2rem rgba(40,167,69,.25)",
      "4": "0 0 0 .2rem rgba(220,53,69,.25)",
      "5": "0 0 0 .2rem rgba(38,38,38,.5)",
      "6": "0 0 0 .2rem rgba(0,0,0,.5)"
      },
      screens: {
      "bp-350": "350px",
      "bp-550": "550px",
      "bp-576": "576px",
      "bp-768": "768px",
      "bp-1200": "1200px",
      "bp-1400": "1400px",
      "bp-1600": "1600px",
      "bp-1850": "1850px"
      },
    }
  }
};
