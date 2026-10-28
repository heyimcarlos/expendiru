import { Api } from "@expendiru/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { HouseholdSource } from "./source.ts";

export const HouseholdLive = HttpApiBuilder.group(
  Api,
  "Household",
  Effect.fn("Household.handlers")(function* (handlers) {
    const source = yield* HouseholdSource.Service;

    return handlers.handle(
      "getSnapshot",
      Effect.fn("Household.getSnapshot")(function* () {
        return yield* source.load();
      }),
    );
  }),
);
