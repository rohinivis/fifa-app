import { layout } from './layout.js';

export function renderAbout({ user } = {}) {
  const content = `
  <main class="max-w-3xl mx-auto px-6 py-14">
    <div class="mb-8">
      <div class="text-gold text-xs uppercase tracking-[0.2em]">About</div>
      <h1 class="font-display text-5xl uppercase mt-2">Who's Behind This</h1>
    </div>
    <div class="space-y-5 leading-relaxed">
      <p>Hi, I'm Rohini. This project is part of a hands-on backend development track I'm
        working through, where each assignment builds on the last — starting with
        containerizing a basic Node app in Docker and Kubernetes, then layering in routing,
        sessions, and a real database.</p>
      <p>FUT Club is that next step: an Express app with a login flow, protected routes, and
        a Postgres database behind it. I picked a FIFA Ultimate Team theme because pulling
        player cards is a lot more fun to build around than a to-do list.</p>
      <p>Under the hood it uses Express for routing, JS template modules for views (see
        views/ — no templating engine, just functions that return HTML strings),
        express-session for basic authentication, and Postgres for storing users, players,
        and who owns which card. Next up: password hashing, and eventually deploying this
        to the cloud.</p>
    </div>
  </main>
`;

  return layout({ title: 'About', content });
}
