import { layout } from './layout.js';
import { DataTable } from '../components/DataTable.js';
import { FormCard } from '../components/FormCard.js';
import { ConfirmModal, PromptModal } from '../components/Modal.js';
import { escapeHtml as esc } from './escapeHtml.js';

export function renderAdmin({ user, teams = [], players = [] } = {}) {
  // ---- Teams table
  const teamColumns = [
    { label: 'Name', value: (t) => esc(t.name), tdClass: 'font-semibold' },
    { label: 'League', value: (t) => esc(t.league || '—'), tdClass: 'text-muted' },
    { label: 'Country', value: (t) => esc(t.country || '—'), tdClass: 'text-muted' },
    { label: 'Players', value: (t) => t.player_count, tdClass: 'font-mono' },
    {
      label: '',
      tdClass: 'text-right whitespace-nowrap',
      value: () =>
        '<div class="space-x-2">' +
        '<button type="button" class="edit-team-btn btn btn-ghost btn-xs text-gold-bright">Edit</button>' +
        '<button type="button" class="delete-team-btn btn btn-ghost btn-xs text-[#f0b4b4]">Delete</button>' +
        '</div>',
    },
  ];
  const teamRowAttrs = (t) => ` data-team-id="${esc(t.id)}" data-team-name="${esc(t.name)}"`;

  // ---- Players table
  function teamSelectMarkup(p) {
    let opts = '<option value="">Free agent</option>';
    teams.forEach((t) => {
      opts += `<option value="${esc(t.id)}"${p.team_id === t.id ? ' selected' : ''}>${esc(t.name)}</option>`;
    });
    return `<select class="team-select select select-bordered select-xs bg-pitch-dark border-pitch-line text-offwhite focus:outline-none focus:ring-2 focus:ring-gold">${opts}</select>`;
  }
  const playerColumns = [
    { label: 'Name', value: (p) => esc(p.name), tdClass: 'font-semibold' },
    { label: 'Team', value: teamSelectMarkup },
    { label: 'Position', value: (p) => esc(p.position), tdClass: 'text-muted' },
    { label: 'Rating', value: (p) => `<span class="rating-value font-mono">${esc(p.rating)}</span>` },
    {
      label: '',
      tdClass: 'text-right whitespace-nowrap',
      value: () =>
        '<div class="space-x-2">' +
        '<button type="button" class="edit-rating-btn btn btn-ghost btn-xs text-gold-bright">Edit Rating</button>' +
        '<button type="button" class="delete-player-btn btn btn-ghost btn-xs text-[#f0b4b4]">Delete</button>' +
        '</div>',
    },
  ];
  const playerRowAttrs = (p) => ` data-player-id="${esc(p.id)}"`;

  // ---- Add-team / add-player forms: describe the fields, hand them to FormCard.
  const addTeamFields = [
    { name: 'name', label: 'Team name', placeholder: 'Team name', required: true },
    { name: 'league', label: 'League', placeholder: 'League' },
    { name: 'country', label: 'Country', placeholder: 'Country' },
  ];
  const addPlayerFields = [
    { name: 'name', label: 'Player name', placeholder: 'Player name', required: true },
    {
      name: 'team_id',
      label: 'Team',
      type: 'select',
      options: [{ value: '', label: 'Free agent' }].concat(teams.map((t) => ({ value: t.id, label: t.name }))),
    },
    { name: 'position', label: 'Position', placeholder: 'Position', required: true },
    { name: 'rating', label: 'Rating', type: 'number', placeholder: 'Rating', min: 1, max: 99, required: true },
  ];

  const content = `
  <main class="max-w-5xl mx-auto px-6 py-14">
    <div class="mb-10">
      <div class="text-gold text-xs uppercase tracking-[0.2em]">Admin</div>
      <h1 class="font-display text-5xl uppercase mt-2">Manage Squads &amp; Data</h1>
      <p class="text-muted mt-1 text-sm max-w-xl">
        Manage the underlying teams and player pool directly — separate from
        <a href="/account" class="text-gold-bright hover:underline">My Squad</a>, which only
        controls what's in your own account.
      </p>
    </div>

    <!-- TEAMS -->
    <section class="mb-14">
      <h2 class="font-display text-3xl uppercase mb-4">Teams</h2>

      ${DataTable({
        id: 'teams-table-body',
        columns: teamColumns,
        rows: teams,
        rowAttrs: teamRowAttrs,
        emptyText: 'No teams yet.',
      })}

      ${FormCard({
        id: 'add-team-form',
        fields: addTeamFields,
        submitLabel: 'Add Team',
        statusId: 'add-team-status',
        formClass: 'max-w-2xl mt-4',
      })}
    </section>

    <!-- PLAYERS -->
    <section>
      <h2 class="font-display text-3xl uppercase mb-4">Players</h2>

      ${DataTable({
        id: 'players-table-body',
        columns: playerColumns,
        rows: players,
        rowAttrs: playerRowAttrs,
        emptyText: 'No players yet.',
      })}

      ${FormCard({
        id: 'add-player-form',
        fields: addPlayerFields,
        submitLabel: 'Add Player',
        statusId: 'add-player-status',
        formClass: 'max-w-3xl mt-4',
      })}
    </section>

    ${PromptModal({
      id: 'team-name-modal',
      title: 'Rename Team',
      label: 'Team name',
    })}
    ${ConfirmModal({
      id: 'delete-team-modal',
      title: 'Delete Team',
      confirmLabel: 'Delete',
      confirmClass: 'btn-error',
    })}
    ${PromptModal({
      id: 'rating-modal',
      title: 'Edit Rating',
      label: 'New rating (1-99)',
      inputType: 'number',
    })}
    ${ConfirmModal({
      id: 'delete-player-modal',
      title: 'Delete Player',
      confirmLabel: 'Delete',
      confirmClass: 'btn-error',
    })}
  </main>
`;

  const scripts = `
  <script>
    // Event wiring below is unchanged from before — it still targets the
    // same ids/classes (teams-table-body, edit-team-btn, team-select,
    // etc.). DataTable/FormCard just generate that markup from data now
    // instead of it being written out by hand on this page.

    // ---- Teams ----

    document.getElementById('add-team-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const status = document.getElementById('add-team-status');
      try {
        await FutClubAPI.addTeam({
          name: form.name.value,
          league: form.league.value || null,
          country: form.country.value || null,
        });
        status.textContent = 'Team added. Reloading…';
        setTimeout(() => location.reload(), 400);
      } catch (err) {
        status.textContent = \`Error: \${err.message}\`;
      }
    });

    document.querySelectorAll('.edit-team-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        const teamId = row.dataset.teamId;
        const currentName = row.dataset.teamName;
        FutModal.prompt('team-name-modal', { value: currentName }, async (nextName) => {
          if (nextName === currentName || !nextName) return;
          try {
            await FutClubAPI.updateTeam(teamId, { name: nextName });
            row.querySelector('td').textContent = nextName;
            row.dataset.teamName = nextName;
          } catch (err) {
            alert(\`Error: \${err.message}\`);
          }
        });
      });
    });

    document.querySelectorAll('.delete-team-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        const teamId = row.dataset.teamId;
        const teamName = row.dataset.teamName;
        FutModal.confirm(
          'delete-team-modal',
          \`Delete \${teamName}? Its players become free agents, not deleted.\`,
          async () => {
            try {
              await FutClubAPI.deleteTeam(teamId);
              location.reload();
            } catch (err) {
              alert(\`Error: \${err.message}\`);
            }
          }
        );
      });
    });

    // ---- Players ----

    document.getElementById('add-player-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const status = document.getElementById('add-player-status');
      try {
        await FutClubAPI.addPlayer({
          name: form.name.value,
          team_id: form.team_id.value || null,
          position: form.position.value,
          rating: Number(form.rating.value),
        });
        status.textContent = 'Player added. Reloading…';
        setTimeout(() => location.reload(), 400);
      } catch (err) {
        status.textContent = \`Error: \${err.message}\`;
      }
    });

    document.querySelectorAll('.team-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const row = select.closest('tr');
        const playerId = row.dataset.playerId;
        try {
          await FutClubAPI.updatePlayer(playerId, { team_id: select.value || null });
        } catch (err) {
          alert(\`Error: \${err.message}\`);
        }
      });
    });

    document.querySelectorAll('.edit-rating-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        const playerId = row.dataset.playerId;
        const ratingEl = row.querySelector('.rating-value');
        FutModal.prompt('rating-modal', { value: ratingEl.textContent }, async (next) => {
          if (!next) return;
          try {
            const updated = await FutClubAPI.updatePlayer(playerId, { rating: Number(next) });
            ratingEl.textContent = updated.rating;
          } catch (err) {
            alert(\`Error: \${err.message}\`);
          }
        });
      });
    });

    document.querySelectorAll('.delete-player-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        const playerId = row.dataset.playerId;
        FutModal.confirm('delete-player-modal', 'Delete this player entirely? This cannot be undone.', async () => {
          try {
            await FutClubAPI.deletePlayer(playerId);
            row.remove();
          } catch (err) {
            alert(\`Error: \${err.message}\`);
          }
        });
      });
    });
  </script>
`;

  return layout({ title: 'Admin', content, scripts });
}
