import { layout } from './layout.js';
import { FormCard } from '../components/FormCard.js';

export function renderLogin({ user } = {}) {
  const content = `
  <main class="max-w-3xl mx-auto px-6 py-14">

    <div class="card bg-base-100 shadow-xl max-w-sm mx-auto border border-base-300">
      <div class="card-body">

        <h2 class="card-title text-3xl justify-center">
          Log In
        </h2>

        <p class="text-center opacity-70 mb-4">
          Welcome back
        </p>

        <div
          id="login-error"
          class="alert alert-error hidden mb-4">
        </div>

        ${FormCard({
          id: 'login-form',
          submitLabel: 'Log In',
          submitFull: true,
          formClass: 'w-full mt-2',
          fields: [
            {
              name: 'username',
              label: 'Username',
              placeholder: 'Username',
              required: true,
              width: 'full',
            },
            {
              name: 'password',
              label: 'Password',
              type: 'password',
              required: true,
              width: 'full',
            },
          ],
        })}

        <p class="text-sm text-center mt-5">
          Don't have an account?
          <a href="/signup" class="link link-primary">
            Sign Up
          </a>
        </p>

        <div class="divider">
          Test Accounts
        </div>

        <div class="text-xs leading-relaxed space-y-2">
          <div>
            <code class="font-mono">messi_fan</code> /
            <code class="font-mono">goat123</code>
          </div>

          <div>
            <code class="font-mono">ronaldo_fan</code> /
            <code class="font-mono">siuuu2024</code>
          </div>

          <div>
            <code class="font-mono">mbappe_fan</code> /
            <code class="font-mono">speedster</code>
          </div>
        </div>

      </div>
    </div>

  </main>
`;

  const footer = `
  <footer class="text-center py-8 text-muted text-xs border-t border-pitch-line">
    Built with Express, JS view modules, Postgres, and Tailwind — homework edition ⚽
  </footer>
`;

  const scripts = `<script src="/js/login-form.js" defer></script>`;

  return layout({
    title: 'Log In',
    content,
    footer,
    scripts,
  });
}