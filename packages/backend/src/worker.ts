import { Api } from "@expendiru/api";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Http from "alchemy/Http";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpRouter from "effect/http/HttpRouter";
import { HttpServerRequest } from "effect/http/HttpServerRequest";
import * as HttpServerResponse from "effect/http/HttpServerResponse";
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder";
import { HouseholdLive } from "./household.ts";
import { FixtureHouseholdSource } from "./source.ts";

export default Cloudflare.Worker(
  "Api",
  {
    main: import.meta.url,
    compatibility: { date: "2026-10-28" },
  },
  Effect.gen(function* () {
    const api = yield* HttpRouter.toHttpEffect(
      HttpApiBuilder.layer(Api).pipe(
        Layer.provide(HouseholdLive),
        Layer.provide(FixtureHouseholdSource),
        Layer.provide(Http.Platform),
        Layer.provide(
          HttpRouter.cors({
            allowedOrigins: ["*"],
            allowedMethods: ["GET", "POST", "OPTIONS"],
            allowedHeaders: ["Content-Type"],
          }),
        ),
      ),
    );

    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest;
        const path = new URL(request.url, "http://worker").pathname;

        if (path === "/health") {
          return HttpServerResponse.text("ok");
        }

        return yield* api;
      }).pipe(Effect.withSpan("expendiru.api.fetch")),
    };
  }).pipe(Effect.provide(Cloudflare.Telemetry())),
);
