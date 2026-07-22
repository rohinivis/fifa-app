
(function () {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return; 

  const loginError = document.getElementById('login-error');

  function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
  }

  function setBusy(busy) {
    loginForm.querySelectorAll('button, input, select').forEach((el) => {
      el.disabled = busy;
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');

    const data = Object.fromEntries(new FormData(loginForm));
    setBusy(true);
    try {
      await window.FutClubAPI.login(data.username, data.password);
      window.location.href = '/account';
    } catch (err) {
      showError(err.message);
      setBusy(false);
    }
  });
})();
