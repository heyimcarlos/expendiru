import { SpendFeed } from "@expendiru/domain";
import { Schema } from "effect";
import { HttpApiEndpoint } from "effect/http-api";

export class SpendDecodeError extends Schema.TaggedError<SpendDecodeError>()(
  "SpendSource.SpendDecodeError",
  {
    operation: Schema.String,
    detail: Schema.String,
  },
) {}

export const GetSpend = HttpApiEndpoint.get("getSpend", "/spend", {
  success: SpendFeed,
  error: SpendDecodeError,
});
