import { expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { SpendSource } from "../src/spend-source.ts";

it.effect("loads a decoded spend feed", () =>
  Effect.gen(function* () {
    const source = yield* SpendSource.Service;
    const feed = yield* source.load();

    expect(feed.period.from <= feed.asOf).toBe(true);
    expect(feed.transactions.length).toBeGreaterThan(0);
    expect(feed.transactions[0]?.currency).toBe("CAD");
  }).pipe(Effect.provide(SpendSource.layer)),
);
