
(function () {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return; 

  const signupError = document.getElementById('signup-error');

  function showError(message) {
    signupError.textContent = message;
    signupError.classList.remove('hidden');
  }

  function setBusy(busy) {
    signupForm.querySelectorAll('button, input, select').forEach((el) => {
      el.disabled = busy;
    });
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.classList.add('hidden');

    const data = Object.fromEntries(new FormData(signupForm));
    setBusy(true);
    try {
      await window.FutClubAPI.signup(data.username, data.password, data.favorite_club);
      window.location.href = '/account';
    } catch (err) {
      showError(err.message);
      setBusy(false);
    }
  });
})();
