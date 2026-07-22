

window.FutModal = (function () {

  function freshConfirmButton(dialog) {
    const old = dialog.querySelector('[data-modal-confirm]');
    const fresh = old.cloneNode(true);
    old.replaceWith(fresh);
    return fresh;
  }

  function wireCancel(dialog) {
    const cancelBtn = dialog.querySelector('[data-modal-cancel]');
    if (cancelBtn) cancelBtn.onclick = () => dialog.close();
  }

  function confirmModal(modalId, message, onConfirm) {
    const dialog = document.getElementById(modalId);
    if (!dialog) return;

    const messageEl = dialog.querySelector('[data-modal-message]');
    if (messageEl) messageEl.textContent = message;

    wireCancel(dialog);
    const confirmBtn = freshConfirmButton(dialog);
    confirmBtn.addEventListener('click', () => {
      dialog.close();
      onConfirm();
    });

    dialog.showModal();
  }

  function promptModal(modalId, { message = '', value = '' } = {}, onSubmit) {
    const dialog = document.getElementById(modalId);
    if (!dialog) return;

    const messageEl = dialog.querySelector('[data-modal-message]');
    if (messageEl) messageEl.textContent = message;

    const input = dialog.querySelector('[data-modal-input]');
    input.value = value;

    wireCancel(dialog);
    const confirmBtn = freshConfirmButton(dialog);
    confirmBtn.addEventListener('click', () => {
      const newValue = input.value;
      dialog.close();
      onSubmit(newValue);
    });

    dialog.showModal();
    input.focus();
    input.select();
  }

  return { confirm: confirmModal, prompt: promptModal };
})();
