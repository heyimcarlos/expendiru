import { Api } from "@expendiru/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { SpendSource } from "./spend-source.ts";
import { HouseholdSource } from "./source.ts";

export const HouseholdLive = HttpApiBuilder.group(
  Api,
  "Household",
  Effect.fn("Household.handlers")(function* (handlers) {
    const source = yield* HouseholdSource.Service;
    const spend = yield* SpendSource.Service;

    return handlers
      .handle(
        "getSnapshot",
        Effect.fn("Household.getSnapshot")(function* () {
          return yield* source.load();
        }),
      )
      .handle(
        "getSpend",
        Effect.fn("Household.getSpend")(function* () {
          return yield* spend.load();
        }),
      );
  }),
);
