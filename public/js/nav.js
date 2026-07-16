// public/js/nav.js
//
// The nav is now a fully dynamic, independently-loaded component: every
// page just drops an empty <div id="nav-root"></div> and includes this
// script (see views/partials/nav-loader.ejs). The nav doesn't get told who's
// logged in by the page that includes it — it asks /api/session itself and
// builds its own markup from the answer, the same way a React/Vue nav
// component would. No .ejs view has to server-render user state into the
// nav anymore.

(function () {
  const root = document.getElementById('nav-root');
  if (!root) return;

  const currentPath = window.location.pathname;

  function linkClasses(href) {
    const active = currentPath === href;
    return [
      'font-body text-sm uppercase tracking-wide transition-colors',
      active ? 'text-gold-bright' : 'text-muted hover:text-gold-bright',
    ].join(' ');
  }

  function render(user) {
    const loggedOutLinks = `
      <a href="/login" class="${linkClasses('/login')}">Log In</a>
      <a href="/signup" class="${linkClasses('/signup')}">Sign Up</a>
    `;

    // The Admin panel link only shows up for accounts with is_admin = true —
    // being logged in as a regular fan is no longer enough (see
    // routes/admin.js's requireAdmin). Everyone else gets a low-key
    // "Admin Login" link instead, which goes to the separate admin login
    // form rather than /admin itself.
    const loggedInLinks = `
      <a href="/account" class="${linkClasses('/account')}">My Squad</a>
      <a href="/market" class="${linkClasses('/market')}">Market</a>
      ${user && user.is_admin ? `<a href="/admin" class="${linkClasses('/admin')}">Admin</a>` : ''}
      <a href="/logout" class="${linkClasses('/logout')}">Log Out</a>
    `;

    const adminLoginLink =
      user && user.is_admin
        ? ''
        : `<a href="/admin/login" class="${linkClasses('/admin/login')} opacity-70">Admin Login</a>`;

    root.innerHTML = `
      <nav class="flex items-center justify-between px-6 md:px-10 py-5 border-b-2 border-gold bg-pitch-dark">
        <a href="/" class="font-display text-3xl tracking-wide uppercase text-gold-bright no-underline">
          FUT<span class="text-offwhite">CLUB</span>
        </a>
        <div class="flex items-center gap-6">
          <a href="/" class="${linkClasses('/')}">Home</a>
          <a href="/about" class="${linkClasses('/about')}">About</a>
          ${user ? loggedInLinks : loggedOutLinks}
          ${adminLoginLink}
        </div>
      </nav>
    `;
  }

  // Render a logged-out-looking nav immediately so the page isn't blank
  // while the fetch is in flight, then swap in the real state once known.
  render(null);

  fetch('/api/session')
    .then((res) => res.json())
    .then((data) => render(data.user))
    .catch(() => render(null));
})();
