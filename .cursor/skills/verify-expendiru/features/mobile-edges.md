# Mobile edges

At a phone width, the spend page, chart, and transaction table stay inside the viewport. Nothing bleeds past the side edges.

## Sub-features

- `edge-page` keeps `scrollWidth` within the viewport width.
- `edge-table` lets the date, merchant, category, and amount columns wrap or share the card instead of widening the page.
- `edge-chart` keeps the pie and the stacked area inside the card padding.

## How to get to it (user POV)

- Open the spend page at about 390px wide.
- Scroll from the chart mode tabs through the table.

## Driving it with verify-expendiru

Preconditions:

- Doctor reports the fixture server at `http://127.0.0.1:4173`.
- The viewport is 390×844.

- **Measure the page.** After load, `document.documentElement.scrollWidth` is at most `clientWidth + 1` on Pie, Line, and the transaction table.
- **Proof.** Screenshots of the pie, the line chart, and the table show padding on both sides and no horizontal scrollbar.

## Gotchas

- `pie-select`'s `result.json` records the width check for the pie screen only. Line and the table still need their own screenshots before this feature is verified.
- A clipped overflow that hides text is not a pass. Labels have to remain readable inside the padding.
