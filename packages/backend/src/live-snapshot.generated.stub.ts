import { encodedHouseholdFixture } from "@expendiru/domain";

/** CI / clone fallback. `scripts/sync-expendiru-feed.py` overwrites live-snapshot.generated.ts. */
export const encodedLiveSnapshot = encodedHouseholdFixture;
