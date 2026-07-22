import { escapeHtml } from '../views/escapeHtml.js';

export function ConfirmModal({
  id,
  title,
  confirmLabel = 'Confirm',
  confirmClass = 'btn-error',
}) {
  return `
<dialog id="${escapeHtml(id)}" class="modal">

<div class="modal-box">

<h3 class="font-bold text-lg">
${escapeHtml(title)}
</h3>

<p class="py-4" data-modal-message></p>

<div class="modal-action">

<button
type="button"
class="btn"
data-modal-cancel>
Cancel
</button>

<button
type="button"
class="btn ${confirmClass}"
data-modal-confirm>
${escapeHtml(confirmLabel)}
</button>

</div>

</div>

<form method="dialog" class="modal-backdrop">
<button>close</button>
</form>

</dialog>
`;
}

export function PromptModal({
  id,
  title,
  label,
  inputType = 'text',
  confirmLabel = 'Save',
}) {
  return `
<dialog id="${escapeHtml(id)}" class="modal">

<div class="modal-box">

<h3 class="font-bold text-lg">
${escapeHtml(title)}
</h3>

<p class="py-2" data-modal-message></p>

<label class="label">
<span class="label-text">
${escapeHtml(label)}
</span>
</label>

<input
type="${escapeHtml(inputType)}"
data-modal-input
class="input input-bordered w-full"
/>

<div class="modal-action">

<button
type="button"
class="btn"
data-modal-cancel>
Cancel
</button>

<button
type="button"
class="btn btn-primary"
data-modal-confirm>
${escapeHtml(confirmLabel)}
</button>

</div>

</div>

<form method="dialog" class="modal-backdrop">
<button>close</button>
</form>

</dialog>
`;
}