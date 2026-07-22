import { layout } from './layout.js';

export function renderHome({ user } = {}) {
  const content = `
  <main class="max-w-3xl mx-auto px-6 py-20 text-center">
    <div class="text-gold text-xs uppercase tracking-[0.3em]">Season 26 · Pack Opened</div>
    <h1 class="font-display text-6xl md:text-7xl uppercase mt-3 mb-4 text-offwhite">Your Squad Awaits</h1>
    <p class="text-muted max-w-md mx-auto leading-relaxed">
      Every account has its own club, built from real pulls. Log in to see the cards you've collected.
    </p>
    <p class="text-muted text-sm mt-5" id="player-pool-count">Loading card pool…</p>
    <a href="/login" class="inline-block mt-7 px-8 py-3 rounded-sm bg-gradient-to-br from-gold-bright to-gold text-pitch-black font-semibold uppercase tracking-wide text-sm hover:brightness-110 transition">
      Enter the Club
    </a>
  </main>
`;

  const scripts = `
  <script>
    // Public read — no login needed. Demonstrates FutClubAPI being used
    // from a page nobody has to be logged in to view.
    FutClubAPI.getPlayers()
      .then((players) => {
        document.getElementById('player-pool-count').textContent =
          \`\${players.length} cards currently in the pool\`;
      })
      .catch(() => {
        document.getElementById('player-pool-count').textContent = '';
      });
  </script>
`;

  return layout({ title: 'Home', content, scripts });
}
