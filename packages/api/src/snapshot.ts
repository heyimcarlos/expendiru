import { HouseholdSnapshot } from "@expendiru/domain";
import { Schema } from "effect";
import { HttpApiEndpoint } from "effect/http-api";

export class SnapshotDecodeError extends Schema.TaggedError<SnapshotDecodeError>()(
  "HouseholdSource.SnapshotDecodeError",
  {
    operation: Schema.String,
    detail: Schema.String,
  },
) {}

export const GetSnapshot = HttpApiEndpoint.get("getSnapshot", "/snapshot", {
  success: HouseholdSnapshot,
  error: SnapshotDecodeError,
});
