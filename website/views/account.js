import { layout } from './layout.js';
import { escapeHtml } from './escapeHtml.js';
import { PlayerCard } from '../components/PlayerCard.js';
import { ConfirmModal, PromptModal } from '../components/Modal.js';

export function renderAccount({ user, players = [] }) {
  const heading =
    user.login_count <= 1
      ? `<div class="text-gold text-xs uppercase tracking-[0.2em]">Welcome, ${escapeHtml(user.username)}</div>
         <h1 class="font-display text-5xl uppercase mt-2">My Squad</h1>`
      : `<div class="text-gold text-xs uppercase tracking-[0.2em]">Welcome back, ${escapeHtml(user.username)} · visit #${escapeHtml(user.login_count)}</div>
         <h1 class="font-display text-5xl uppercase mt-2">My Squad</h1>`;

  const emptyNotice =
    players.length === 0
      ? `
    <div class="bg-pitch-dark border border-pitch-line border-l-4 border-l-gold rounded-sm px-5 py-4 mb-8">
      <p class="text-offwhite font-semibold">Your squad is empty.</p>
      <p class="text-muted text-sm mt-1">Head to the <a href="/market" class="text-gold-bright hover:underline">Market</a> to add your first players and start building your squad.</p>
    </div>`
      : '';

  const content = `
  <main class="max-w-5xl mx-auto px-6 py-14">
    <div class="mb-8">
      ${heading}
      <p class="text-muted mt-1">Favorite club: ${escapeHtml(user.favorite_club || '—')} · ${players.length} card${players.length === 1 ? '' : 's'} owned</p>
    </div>

    ${emptyNotice}

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      ${players.map((p) => PlayerCard({ ...p, footer: squadCardFooter() })).join('')}
    </div>

    <div class="mt-12 mb-4">
      <h2 class="font-display text-3xl uppercase">Add a New Player to the Pool</h2>
      <p class="text-muted text-sm mt-1">Uses the standalone CRUD API (routes/api.js) — protected, requires login.</p>
    </div>
    <form id="add-player-form" class="flex flex-wrap gap-3 items-end max-w-2xl">
      <input type="text" name="name" placeholder="Player name" required
        class="flex-1 min-w-[140px] px-3 py-2.5 bg-pitch-dark border border-pitch-line rounded-sm text-offwhite focus:outline-none focus:ring-2 focus:ring-gold">
      <input type="text" name="position" placeholder="Position (e.g. ST)" required
        class="w-32 px-3 py-2.5 bg-pitch-dark border border-pitch-line rounded-sm text-offwhite focus:outline-none focus:ring-2 focus:ring-gold">
      <input type="number" name="rating" placeholder="Rating" min="1" max="99" required
        class="w-24 px-3 py-2.5 bg-pitch-dark border border-pitch-line rounded-sm text-offwhite focus:outline-none focus:ring-2 focus:ring-gold">
      <button type="submit" class="px-5 py-2.5 text-xs uppercase tracking-wide rounded-sm border border-gold text-gold-bright hover:bg-gold hover:text-pitch-black transition">
        Add Player
      </button>
    </form>
    <p id="add-player-status" class="text-muted text-sm mt-3"></p>

    ${ConfirmModal({
      id: 'remove-confirm-modal',
      title: 'Remove Player',
      confirmLabel: 'Remove',
      confirmClass: 'btn-error',
    })}
    ${PromptModal({
      id: 'trade-modal',
      title: 'Trade Card',
      label: 'Trade to which username?',
    })}
  </main>
`;

  const scripts = `
  <script>
    // POST via the CRUD API — protected, requires login (enforced server-side).
    document.getElementById('add-player-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const status = document.getElementById('add-player-status');
      try {
        const player = await FutClubAPI.addPlayer({
          name: form.name.value,
          position: form.position.value,
          rating: Number(form.rating.value),
        });
        status.textContent = \`Added \${player.name} (\${player.rating} OVR) to the pool.\`;
        form.reset();
      } catch (err) {
        status.textContent = \`Error: \${err.message}\`;
      }
    });

    // DELETE via the squad-scoped endpoint — only removes this player from
    // YOUR OWN squad (a user_players row). It does not touch the players
    // table, so it can't affect anyone else's squad or the market listing.
    // (See routes/squad.js — this used to call FutClubAPI.deletePlayer,
    // which deletes the player globally; that's now reserved for /admin.)
    // One #remove-confirm-modal (see ConfirmModal above) is reused for
    // every card — FutModal.confirm() fills in the message and wires the
    // confirm button fresh on each click.
    document.querySelectorAll('.remove-player-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.player-card');
        const playerId = card.dataset.playerId;
        FutModal.confirm('remove-confirm-modal', 'Remove this player from your squad?', async () => {
          try {
            await FutClubAPI.removeFromSquad(playerId);
            card.remove();
          } catch (err) {
            alert(\`Error: \${err.message}\`);
          }
        });
      });
    });

    // Trades a card to another user by username. The card disappears from
    // this squad the moment the trade succeeds (routes/squad.js moves the
    // user_players row inside a transaction, so it can't end up owned by
    // both or neither user). One #trade-modal (see PromptModal above) is
    // reused for every card, same pattern as remove-confirm-modal.
    document.querySelectorAll('.trade-player-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.player-card');
        const playerId = card.dataset.playerId;
        FutModal.prompt('trade-modal', { message: 'Enter the username to trade this card to.' }, async (toUsername) => {
          if (!toUsername) return;
          try {
            const result = await FutClubAPI.tradeToUser(playerId, toUsername.trim());
            card.remove();
            document.getElementById('add-player-status').textContent =
              \`Traded \${result.player.name} to \${result.toUsername}.\`;
          } catch (err) {
            alert(\`Error: \${err.message}\`);
          }
        });
      });
    });
  </script>
`;

  return layout({ title: 'My Squad', content, scripts });
}

function squadCardFooter() {
  return `
        <div class="flex gap-2 mt-3">
          <button type="button" class="trade-player-btn flex-1 px-3 py-2 text-xs uppercase tracking-wide rounded-sm border border-gold text-gold-bright hover:bg-gold hover:text-pitch-black transition">
            Trade
          </button>
          <button type="button" class="remove-player-btn flex-1 px-3 py-2 text-xs uppercase tracking-wide rounded-sm border border-[#f0b4b4] text-[#f0b4b4] hover:bg-[#f0b4b4] hover:text-pitch-black transition">
            Remove
          </button>
        </div>`;
}
