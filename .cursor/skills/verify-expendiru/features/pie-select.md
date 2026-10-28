# Pie selection

Choosing a pie slice filters the transaction table to that bucket and does not scroll or pan the page, including when the finger drags a little during the tap.

## Sub-features

- `pie-tap` selects the slice under the finger.
- `pie-hold` keeps `window.scrollY` still across a short drag on the donut.
- `pie-filter` narrows the table to the chosen bucket.

## How to get to it (user POV)

- Open the fixture site. The spend section starts on Pie.
- Press the `Pie` chart-mode button if another mode is showing.

## Driving it with verify-expendiru

Preconditions:

- Doctor reports the fixture server at `http://127.0.0.1:4173`.
- The unfiltered count reads `6 transactions · $227.90 out`.

- **Open the pie.** The donut is the group named `Spending by bucket` inside `[data-chart-surface="pie"]`. Run `node scripts/verify-expendiru.mjs drive pie-select`. The helper scrolls that surface into view and records `window.scrollY`.
- **Touch a slice.** The helper touches `Show Household` when that slice is hit-tested, otherwise the first sampled slice, and drags a few pixels before release. The count becomes `1 transaction` for Household on the stub.
- **Touch another slice.** A second sampled slice is touched the same way. The table count changes again.
- **Proof.** `artifacts/verify-expendiru/pie-select/before.png`, `after-first.png`, `after-second.png`, and `result.json` exist. `result.json` shows scroll deltas of at most 1px and `filtered: true`. The page width does not exceed the viewport.

## Gotchas

- Mouse clicks do not reproduce the mobile pan. The drive uses touch events.
- Slice hit targets are the donut paths, not the legend. A legend click filters the table but does not prove the chart surface.
- Selecting the same slice twice clears the filter. The drive must touch two different slices.
- The stub's Household slice is one grocery row. A live feed has different counts; do not assert `$42.10` against live data.
