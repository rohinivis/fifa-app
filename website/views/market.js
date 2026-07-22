import { layout } from './layout.js';
import { escapeHtml } from './escapeHtml.js';
import { PlayerCard } from '../components/PlayerCard.js';

export function renderMarket({ user, players = [], added = null } = {}) {
  const banner = '';

  const cardsHtml =
    players.length === 0
      ? `<p class="text-muted text-sm">You already own every card in the pool. Check back later for new drops.</p>`
      : `
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        ${players.map((p) => PlayerCard({ ...p, footer: marketCardFooter(p) })).join('')}
      </div>`;

  const content = `
  <main class="max-w-5xl mx-auto px-6 py-14">
    <div class="mb-8">
      <div class="text-gold text-xs uppercase tracking-[0.2em]">Card Market</div>
      <h1 class="font-display text-5xl uppercase mt-2">Add to Your Squad</h1>
      <p class="text-muted mt-1">${players.length} card${players.length === 1 ? '' : 's'} available to add</p>
    </div>

    ${banner}
    ${cardsHtml}
  </main>
`;

  return layout({ title: 'Market', content });
}

function marketCardFooter(p) {
  return `
          <form action="/market/add/${escapeHtml(p.id)}" method="POST" class="mt-3">
            <button type="submit" class="w-full px-3 py-2 text-xs uppercase tracking-wide rounded-sm bg-gradient-to-br from-gold-bright to-gold text-pitch-black font-semibold hover:brightness-110 transition">
              Add to Squad
            </button>
          </form>`;
}
