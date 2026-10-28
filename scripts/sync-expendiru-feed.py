#!/usr/bin/env python3
"""Map /workspace/finance/expendiru-feed → packages/backend/src/live-snapshot.generated.ts"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
FEED = Path("/workspace/finance/expendiru-feed")
OUT = REPO / "packages/backend/src/live-snapshot.generated.ts"

BUCKET_MAP = [
    ("household", "household", "Household"),
    ("together", "together", "Together"),
    ("carlos", "carlos_personal", "Carlos"),
    ("maria", "maria_personal", "Maria"),
]


def cad(dollars: float) -> dict[str, object]:
    return {"cents": int(round(float(dollars) * 100)), "currency": "CAD"}


def main() -> None:
    summary = json.loads((FEED / "summary.json").read_text())
    budget = json.loads((FEED / "budget.json").read_text())
    txs = json.loads((FEED / "transactions.json").read_text())
    visa = summary["visa_utilization"]
    balances = summary["balances"]
    as_of = summary["as_of"]
    year, month, day = (int(p) for p in as_of.split("-"))
    days_in_month = 31 if month in {1, 3, 5, 7, 8, 10, 12} else 30 if month != 2 else 28
    month_prefix = f"{year}-{month:02d}"
    period_label = f"{['','January','February','March','April','May','June','July','August','September','October','November','December'][month]} {year}"
    as_of_label = f"{day} {['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month]} {year}"

    oct_spend: dict[str, float] = defaultdict(float)
    for t in txs:
        if t.get("counts_toward_budget") != "yes":
            continue
        if not str(t.get("date", "")).startswith(month_prefix):
            continue
        amt = float(t["amount"])
        if amt >= 0:
            continue
        oct_spend[t.get("budget_bucket") or "uncategorized"] += -amt

    bucket_budget = {b["id"]: b["monthly"] for b in budget["buckets"]}
    # Liquid rainy-day cash only. Carlos savings and the Wealthsimple TFSA
    # stay out of this card; the TFSA is long-term. emergency_liquid_target
    # is the liquid goal. emergency_fund_target is the combined safety net
    # (liquid plus TFSA) and is not this card's target.
    saved = balances["Maria savings"]

    snap = {
        "householdName": "Carlos & Maria",
        "city": "Toronto",
        "periodLabel": period_label,
        "asOfLabel": as_of_label,
        "dayOfMonth": day,
        "daysInMonth": days_in_month,
        "source": "live",
        "emergencyFund": {
            "name": "Emergency fund",
            "saved": cad(saved),
            "target": cad(budget["goals"]["emergency_liquid_target"]),
        },
        "cards": [
            {
                "id": "scotia-visa-carlos",
                "label": "Scene+ Visa · Carlos",
                "holder": "Carlos",
                "limit": cad(visa["Carlos Scene+ Visa"]["limit"]),
                "balance": cad(visa["Carlos Scene+ Visa"]["balance"]),
            },
            {
                "id": "scotia-visa-maria",
                "label": "Scene+ Visa · Maria",
                "holder": "Maria",
                "limit": cad(visa["Maria Scene+ Visa"]["limit"]),
                "balance": cad(visa["Maria Scene+ Visa"]["balance"]),
            },
        ],
        "buckets": [
            {
                "id": dom,
                "name": label,
                "budget": cad(bucket_budget[feed_id]),
                "spent": cad(oct_spend.get(feed_id, 0.0)),
            }
            for dom, feed_id, label in BUCKET_MAP
        ],
    }

    OUT.write_text(
        "// Generated from /workspace/finance/expendiru-feed — do not commit.\n"
        f"export const encodedLiveSnapshot = {json.dumps(snap, indent=2)} as const;\n"
    )
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
