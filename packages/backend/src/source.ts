import { encodedHouseholdFixture, HouseholdSnapshot } from "@expendiru/domain";
import { SnapshotDecodeError } from "@expendiru/api";
import { Context, Effect, Layer, Schema } from "effect";
import { encodedLiveSnapshot } from "./live-snapshot.ts";

export interface Interface {
  readonly load: () => Effect.Effect<HouseholdSnapshot, SnapshotDecodeError>;
}

export class Service extends Context.Service<Service, Interface>()(
  "expendiru/HouseholdSource",
) {}

const layerFromEncoded = (
  encoded: typeof encodedHouseholdFixture | typeof encodedLiveSnapshot,
  span: string,
) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const load = Effect.fn(span)(function* () {
        return yield* Schema.decodeUnknownEffect(HouseholdSnapshot)(encoded).pipe(
          Effect.mapError(
            (cause) =>
              new SnapshotDecodeError({
                operation: span,
                detail: cause.message,
              }),
          ),
        );
      });

      return yield* Effect.succeed(Service.of({ load }));
    }),
  );

export const layer = layerFromEncoded(
  encodedHouseholdFixture,
  "HouseholdSource.load",
);

export const liveLayer = layerFromEncoded(
  encodedLiveSnapshot,
  "HouseholdSource.loadLive",
);

export * as HouseholdSource from "./source.ts";
