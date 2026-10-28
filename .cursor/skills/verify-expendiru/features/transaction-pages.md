# Transaction pages

The transaction table shows 25 rows at a time, with Previous and Next, instead of rendering the whole filtered list.

## Sub-features

- `page-window` shows `1–N of total` for the current page.
- `page-step` moves to the next 25 rows when more exist.
- `page-reset` returns to the first page when the filter changes.

## How to get to it (user POV)

- Scroll to the `Transactions` heading under the chart.
- Use `Previous` and `Next` when the filtered list is longer than one page.

## Driving it with verify-expendiru

Preconditions:

- Doctor reports the fixture server at `http://127.0.0.1:4173`.
- On the stub, six rows match the default filter, so there is one page.

- **Read the pager.** Under the table named `Transactions`, the status reads `1–6 of 6`. `Previous` and `Next` are disabled.
- **Reset on filter.** Choose a pie slice. The pager follows the shorter list and stays on the first page.
- **Proof.** Screenshot the table and pager at 390px. The status text and both buttons are inside the viewport.

## Gotchas

- The stub cannot show a second page. A list longer than 25 rows is required before `Next` enables. Do not shrink the page size to force a second page.
- This drive is not wrapped by `verify-expendiru.mjs drive` yet. Do not mark it verified because the pie-select screenshots include the pager.
