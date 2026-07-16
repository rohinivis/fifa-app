/**
 * FutClubAPI — a small wrapper around the /api endpoints (see routes/api.js).
 * Loaded as a plain script (not a module) so any .ejs page can drop in
 *   <script src="/js/api-client.js"></script>
 * and immediately call window.FutClubAPI.* from an inline script or another
 * file, without needing to know the fetch() details or repeat error handling.
 *
 * Write operations (add/update/delete) require the user to be logged in —
 * the server enforces this too, so this is a convenience, not the real gate.
 * A 401 response means "not logged in"; every function throws a normal Error
 * with the server's message so calling code can catch() and show it.
 */
window.FutClubAPI = (function () {
  async function request(path, options = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // some responses (e.g. a plain 500) might not be JSON — that's fine,
      // we fall through to the generic error below
    }

    if (!res.ok) {
      const message = (data && data.error) || `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data;
  }

  return {
    // Reads — public, no login required
    getPlayers: () => request('/api/players'),
    getPlayer: (id) => request(`/api/players/${id}`),
    getTeams: () => request('/api/teams'),

    // Writes — require login; server returns 401 if not logged in
    addPlayer: (player) =>
      request('/api/players', { method: 'POST', body: JSON.stringify(player) }),

    updatePlayer: (id, updates) =>
      request(`/api/players/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

    deletePlayer: (id) => request(`/api/players/${id}`, { method: 'DELETE' }),

    addTeam: (team) =>
      request('/api/teams', { method: 'POST', body: JSON.stringify(team) }),

    updateTeam: (id, updates) =>
      request(`/api/teams/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

    deleteTeam: (id) => request(`/api/teams/${id}`, { method: 'DELETE' }),

    // Squad-scoped — removes a card from the CURRENT user's own squad only
    // (deletes a user_players row). Distinct from deletePlayer above, which
    // deletes the player from the whole game and is only used on /admin.
    removeFromSquad: (playerId) => request(`/api/squad/${playerId}`, { method: 'DELETE' }),

    // Trades a card from the CURRENT user's squad to another user's squad by
    // username. Moves the user_players row rather than copying it — the
    // sender loses the card, the recipient gains it.
    tradeToUser: (playerId, toUsername) =>
      request(`/api/squad/${playerId}/trade`, { method: 'POST', body: JSON.stringify({ toUsername }) }),
  };
})();
