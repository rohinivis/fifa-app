(function () {
  const root = document.getElementById('nav-root');
  if (!root) return;

  const currentPath = window.location.pathname;

  function linkClasses(href) {
    const active = currentPath === href;
    return active ? 'text-gold-bright' : 'text-muted hover:text-gold-bright';
  }

   function navLinks(user) {
    const links = [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
    ];
    if (user) {
      links.push({ href: '/account', label: 'My Squad' });
      links.push({ href: '/market', label: 'Market' });
      if (user.is_admin) links.push({ href: '/admin', label: 'Admin' });
      links.push({ href: '/logout', label: 'Log Out' });
    } else {
       links.push({ href: '/login', label: 'Log In / Sign Up' });
    }
    if (!(user && user.is_admin)) {
      links.push({ href: '/admin/login', label: 'Admin Login', muted: true });
    }
    return links;
  }

  function menuItem(link) {
    return `
      <li>
        <a href="${link.href}" class="${linkClasses(link.href)} ${link.muted ? 'opacity-70' : ''} font-body text-sm uppercase tracking-wide">
          ${link.label}
        </a>
      </li>
    `;
  }

  function render(user) {
    const links = navLinks(user);

     root.innerHTML = `
      <nav class="navbar bg-pitch-dark border-b-2 border-gold px-6 md:px-10">
        <div class="navbar-start">
          <div class="dropdown lg:hidden">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle text-gold-bright">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <ul tabindex="0" class="menu dropdown-content z-10 mt-3 w-52 gap-1 rounded-box bg-pitch-dark border border-pitch-line p-3 shadow-lg">
              ${links.map(menuItem).join('')}
            </ul>
          </div>
          <a href="/" class="font-display text-3xl tracking-wide uppercase text-gold-bright no-underline ml-1">
            FUT<span class="text-offwhite">CLUB</span>
          </a>
        </div>
        <div class="navbar-end hidden lg:flex">
          <ul class="menu menu-horizontal flex-nowrap gap-4 px-1 whitespace-nowrap">
            ${links.map(menuItem).join('')}
          </ul>
        </div>
      </nav>
    `;
  }

render(null);

  fetch('/api/session')
    .then((res) => res.json())
    .then((data) => render(data.user))
    .catch(() => render(null));
})();
