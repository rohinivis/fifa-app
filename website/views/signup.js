import { layout } from './layout.js';
import { FormCard } from '../components/FormCard.js';

export function renderSignup({ user, teams = [] } = {}) {
  const clubOptions = [{ value: '', label: '— Select a club —' }].concat(
    teams.map((t) => ({ value: t.name, label: t.name }))
  );

  const content = `
  <main class="max-w-3xl mx-auto px-6 py-14">
    <div class="max-w-sm mx-auto bg-pitch-dark border border-pitch-line border-t-[3px] border-t-gold rounded-md p-8">

      <h2 class="font-display text-3xl uppercase">Create Account</h2>
      <p class="text-gold text-xs uppercase tracking-wide mt-1 mb-4">Join FUT Club</p>

      <div id="signup-error" class="hidden bg-[#3a1414] border border-[#7a2e2e] text-[#f0b4b4] px-4 py-3 rounded-sm text-sm mb-3"></div>

      ${FormCard({
        id: 'signup-form',
        submitLabel: 'Create Account',
        submitFull: true,
        formClass: 'w-full mt-2',
        fields: [
          { name: 'username', label: 'Username', placeholder: 'Username', required: true, width: 'full' },
          { name: 'password', label: 'Password', type: 'password', required: true, width: 'full' },
          { name: 'favorite_club', label: 'Favorite Club', type: 'select', options: clubOptions, width: 'full' },
        ],
      })}

      <p class="text-muted text-sm mt-5 text-center">
        Already have an account?
        <a href="/login" class="text-gold-bright hover:underline">Log In</a>
      </p>
    </div>
  </main>
`;

  const footer = `
  <footer class="text-center py-8 text-muted text-xs border-t border-pitch-line">
    Built with Express, JS view modules, Postgres, and Tailwind — homework edition ⚽
  </footer>
`;

  const scripts = `<script src="/js/signup-form.js" defer></script>`;

  return layout({ title: 'Sign Up', content, footer, scripts });
}
