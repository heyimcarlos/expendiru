import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import Api from "@expendiru/backend";

export default Alchemy.Stack(
  "Expendiru",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const api = yield* Api;

    const web = yield* Cloudflare.Website.Foldkit("Web", {
      rootDir: "packages/frontend",
      compatibility: { date: "2026-10-28" },
      env: {
        VITE_API_URL: api.url.as<string>(),
      },
    });

    return {
      apiUrl: api.url,
      url: web.url,
    };
  }),
);
