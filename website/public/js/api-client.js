
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

    // Auth — drives the standalone /login and /signup pages (see
    // public/js/login-form.js and public/js/signup-form.js).
    login: (username, password) =>
      request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

    signup: (username, password, favorite_club) =>
      request('/signup', {
        method: 'POST',
        body: JSON.stringify({ username, password, favorite_club }),
      }),

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

   removeFromSquad: (playerId) => request(`/api/squad/${playerId}`, { method: 'DELETE' }),

    tradeToUser: (playerId, toUsername) =>
      request(`/api/squad/${playerId}/trade`, { method: 'POST', body: JSON.stringify({ toUsername }) }),
  };
})();
