import { encodedHouseholdFixture, HouseholdSnapshot } from "@expendiru/domain";
import { SnapshotDecodeError } from "@expendiru/api";
import { Context, Effect, Layer, Schema } from "effect";

export interface Interface {
  readonly load: () => Effect.Effect<HouseholdSnapshot, SnapshotDecodeError>;
}

export class Service extends Context.Service<Service, Interface>()(
  "expendiru/HouseholdSource",
) {}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const load = Effect.fn("HouseholdSource.load")(function* () {
      return yield* Schema.decodeUnknownEffect(HouseholdSnapshot)(
        encodedHouseholdFixture,
      ).pipe(
        Effect.mapError(
          (cause) =>
            new SnapshotDecodeError({
              operation: "HouseholdSource.load",
              detail: cause.message,
            }),
        ),
      );
    });

    return yield* Effect.succeed(Service.of({ load }));
  }),
);

export * as HouseholdSource from "./source.ts";
