import { escapeHtml } from '../views/escapeHtml.js';

export function FormCard({
  id,
  fields = [],
  submitLabel = 'Submit',
  submitFull = false,
  statusId,
  formClass = '',
}) {
  const fieldsHtml = fields
    .map((f) => {
      const label = `
<label class="label">
  <span class="label-text">
    ${escapeHtml(f.label || f.name)}
  </span>
</label>`;

      let control;

      if (f.type === 'select') {
        const options = (f.options || [])
          .map(
            (opt) => `
<option
value="${escapeHtml(opt.value)}"
${opt.selected ? 'selected' : ''}>
${escapeHtml(opt.label)}
</option>`
          )
          .join('');

        control = `
<select
id="${id}-${escapeHtml(f.name)}"
name="${escapeHtml(f.name)}"
class="select select-bordered w-full"
${f.required ? 'required' : ''}>
${options}
</select>`;
      } else {
        control = `
<input
id="${id}-${escapeHtml(f.name)}"
type="${f.type || 'text'}"
name="${escapeHtml(f.name)}"
placeholder="${escapeHtml(f.placeholder || '')}"
class="input input-bordered w-full"
${f.required ? 'required' : ''}
${f.min !== undefined ? `min="${f.min}"` : ''}
${f.max !== undefined ? `max="${f.max}"` : ''}
/>`;
      }

      return `
<div class="${f.width === 'full' ? 'w-full' : 'flex-1 min-w-[180px]'}">
  ${label}
  ${control}
</div>`;
    })
    .join('');

  return `
<div class="card bg-base-100 shadow border border-base-300">
  <div class="card-body">

<form
id="${id}"
class="flex flex-wrap gap-4 ${formClass}">

${fieldsHtml}

<button
type="submit"
class="btn btn-primary ${submitFull ? 'w-full' : ''}">
${escapeHtml(submitLabel)}
</button>

</form>

${statusId ? `<p id="${statusId}" class="text-sm mt-2"></p>` : ''}

  </div>
</div>
`;
}