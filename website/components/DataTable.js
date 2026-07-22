export function DataTable({
  id,
  columns = [],
  rows = [],
  rowAttrs,
  emptyText = 'Nothing here yet.',
}) {
  const theadRow = columns
    .map(
      (col) =>
        `<th class="${col.thClass || ''}">${col.label}</th>`
    )
    .join('');

  const bodyRows =
    rows.length === 0
      ? `
      <tr>
        <td colspan="${columns.length}" class="text-center py-6 opacity-60">
          ${emptyText}
        </td>
      </tr>`
      : rows
          .map((row) => {
            const attrs =
              typeof rowAttrs === 'function'
                ? rowAttrs(row)
                : '';

            const cells = columns
              .map(
                (col) =>
                  `<td class="${col.tdClass || ''}">
                    ${col.value(row)}
                  </td>`
              )
              .join('');

            return `
              <tr ${attrs}>
                ${cells}
              </tr>
            `;
          })
          .join('');

  return `
<div class="overflow-x-auto rounded-lg border border-base-300">
  <table class="table table-zebra w-full">
    <thead>
      <tr>
        ${theadRow}
      </tr>
    </thead>

    <tbody ${id ? `id="${id}"` : ''}>
      ${bodyRows}
    </tbody>
  </table>
</div>
`;
}