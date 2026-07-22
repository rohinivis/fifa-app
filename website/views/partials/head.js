import { escapeHtml } from '../escapeHtml.js';

/************************************* USAGE *************************************************
INPUTS: { title } -> STRING, GOES INTO <title>{title} — FUT Club</title>
OUTPUTS: STRING OF <head> CONTENTS (NO <head> TAGS THEMSELVES — CALLER WRAPS THOSE)
FUNCTION: REPLACES views/partials/head.ejs. FONTS, DAISYUI, TAILWIND CONFIG (BRAND TOKENS
          INSTEAD OF TAILWIND DEFAULTS), AND THE APP STYLESHEET — IDENTICAL MARKUP, JUST A
          JS TEMPLATE LITERAL INSTEAD OF AN EJS INCLUDE.
************************************* USAGE **************************************************/
export function headHtml({ title }) {
  return `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — FUT Club</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">

<!-- DaisyUI — free Tailwind component library. Gives us real components
     (table, form controls, navbar, menu, dropdown, btn, badge) instead of
     hand-building each one from scratch. Loaded before Tailwind's CDN
     script so Tailwind's JIT compiler sees DaisyUI's class names too. -->
<link href="https://cdn.jsdelivr.net/npm/daisyui@4/dist/full.min.css" rel="stylesheet" type="text/css">

<!-- Tailwind (Play CDN — no build step needed for this project) -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  // Map Tailwind's utility classes onto FUT Club's own brand tokens instead of
  // Tailwind's default palette/fonts, so adopting the library doesn't flatten
  // the site's identity into generic Tailwind-blue defaults.
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          pitch: { black: '#0c1710', dark: '#12241a', line: '#1d3826' },
          gold: { DEFAULT: '#c9a227', bright: '#e8c860' },
          card: { navy: '#16243a', deep: '#0c1526' },
          offwhite: '#eef1ea',
          muted: '#9aa89e',
        },
        fontFamily: {
          display: ['Teko', 'Georgia', 'serif'],
          body: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace'],
        },
      },
    },
  };
</script>

<link rel="stylesheet" href="/css/style.css">
`;
}
