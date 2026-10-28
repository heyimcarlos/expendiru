# Stacked area

Line mode draws a monthly stacked area for Household, Together, Carlos, and Maria, with end-of-series percent callouts and no axis or grid.

## Sub-features

- `line-open` switches the chart to the monthly area.
- `line-series` shows the four buckets stacked from the monthly fixture.
- `line-callouts` labels the October shares at the right edge.

## How to get to it (user POV)

- Open the fixture site. Line is the chart already showing.
- Press `Line` again if you came from Pie or Bar.

## Driving it with verify-expendiru

Preconditions:

- Doctor reports the fixture server at `http://127.0.0.1:4173`.
- The fixture includes July–October monthly buckets. The stub transactions are not the series.

- **Show the area.** Press `Line`. The group named `Spending by month` is visible and the title reads `By month`.
- **Read the series.** The accessible names `Show Household`, `Show Together`, `Show Carlos`, and `Show Maria` are on the areas. Callouts read `Household 13.0%`, `Together 11.5%`, `Carlos 52.8%`, and `Maria 22.6%`.
- **Proof.** Screenshot the group at 390px width. The image shows stacked fills, month labels Jul through Oct, and the four callouts. There is no y-axis and no gridline.

## Gotchas

- The area ignores the six stub transactions. Hiding a legend entry removes that band; the callout percents are October's share of October, not the pie's share of all buckets.
- Move is not a band. It remains on the pie.
- This drive is not wrapped by `verify-expendiru.mjs drive` yet. Follow the handles above in the same Chrome session the helper uses for `pie-select`, and do not claim `pie-select` proved this feature.
