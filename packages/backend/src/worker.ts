import { Api } from "@expendiru/api";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Http from "alchemy/Http";
import { Effect, Layer } from "effect";
import * as HttpRouter from "effect/http/HttpRouter";
import { HttpServerRequest } from "effect/http/HttpServerRequest";
import * as HttpServerResponse from "effect/http/HttpServerResponse";
import { HttpApiBuilder } from "effect/http-api";
import { HouseholdLive } from "./household.ts";
import { HouseholdSource } from "./source.ts";

const apiLayer = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(HouseholdLive),
  Layer.provide(HouseholdSource.layer),
  Layer.provide(Http.Platform),
  Layer.provide(
    HttpRouter.cors({
      allowedOrigins: ["*"],
      allowedMethods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    }),
  ),
);

export default Cloudflare.Worker(
  "Api",
  {
    main: import.meta.url,
    compatibility: { date: "2026-10-28" },
  },
  Effect.gen(function* () {
    const api = yield* HttpRouter.toHttpEffect(apiLayer);

    const fetch = Effect.fn("Api.fetch")(function* () {
      const request = yield* HttpServerRequest;
      const path = new URL(request.url, "http://worker").pathname;

      if (path === "/health") {
        return HttpServerResponse.text("ok");
      }

      return yield* api;
    });

    return {
      fetch: fetch(),
    };
  }).pipe(Effect.provide(Cloudflare.Telemetry())),
);
