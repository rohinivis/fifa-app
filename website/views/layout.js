import { headHtml } from './partials/head.js';
import { navLoaderHtml } from './partials/navLoader.js';

export function layout({ title, bodyExtra = '', content, footer = '', scripts = '' }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="luxury">
<head>
  ${headHtml({ title })}
</head>
<body class="bg-pitch-black text-offwhite font-body min-h-screen ${bodyExtra}">
  ${navLoaderHtml()}

  ${content}
  ${footer}
  ${scripts}
</body>
</html>
`;
}
