import { Api } from "@expendiru/api";
import * as Effect from "effect/Effect";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { HouseholdSource } from "./source.ts";

export const HouseholdLive = HttpApiBuilder.group(
  Api,
  "Household",
  Effect.fn("HouseholdLive")(function* (handlers) {
    const source = yield* HouseholdSource;

    return handlers.handle(
      "getSnapshot",
      Effect.fn("Household.getSnapshot")(function* () {
        return yield* source.load;
      }),
    );
  }),
);
