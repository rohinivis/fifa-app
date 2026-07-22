import { escapeHtml } from '../views/escapeHtml.js';

export function PlayerCard({
  id,
  rating,
  position,
  name,
  club,
  footer = '',
}) {
  return `
    <div
      data-player-id="${escapeHtml(String(id ?? ''))}"
      class="player-card card bg-pitch-dark shadow-xl border border-pitch-line"
    >
      <div class="card-body">

        <h2 class="card-title">
          ${escapeHtml(name)}
          <div class="badge badge-primary">
            ${escapeHtml(position)}
          </div>
        </h2>

        <p>
          <strong>Club:</strong>
          ${escapeHtml(club)}
        </p>

        <p>
          <strong>Overall:</strong>
          <span class="badge badge-secondary">
            ${rating}
          </span>
        </p>

        <div class="card-actions justify-end">
          ${footer}
        </div>

      </div>
    </div>
  `;
}