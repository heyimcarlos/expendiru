import { SpendDecodeError } from "@expendiru/api";
import { SpendFeed, SpendFeedWire, spendFeedFromWire } from "@expendiru/domain";
import { Context, Effect, Layer, Schema } from "effect";
import { encodedSpendGenerated } from "./spend.generated.ts";

export interface Interface {
  readonly load: () => Effect.Effect<SpendFeed, SpendDecodeError>;
}

export class Service extends Context.Service<Service, Interface>()(
  "expendiru/SpendSource",
) {}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const load = Effect.fn("SpendSource.load")(function* () {
      const wire = yield* Schema.decodeUnknownEffect(SpendFeedWire)(
        encodedSpendGenerated,
      ).pipe(
        Effect.mapError(
          (cause) =>
            new SpendDecodeError({
              operation: "SpendSource.load",
              detail: cause.message,
            }),
        ),
      );

      return spendFeedFromWire(wire);
    });

    return yield* Effect.succeed(Service.of({ load }));
  }),
);

export * as SpendSource from "./spend-source.ts";
