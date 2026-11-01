import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as GitHub from "alchemy/GitHub";
import * as Output from "alchemy/Output";
import { householdAllowPolicy } from "@expendiru/backend/access";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import Api from "@expendiru/backend";

export default Alchemy.Stack(
  "Expendiru",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const api = yield* Api;
    const stage = yield* Alchemy.Stage;

    const website = {
      rootDir: "packages/frontend",
      main: "src/edge.ts",
      compatibility: { date: "2026-10-28" },
      access: {
        policies: [householdAllowPolicy],
      },
      env: {
        VITE_API_URL: "same-origin",
        API: api,
      },
      assets: {
        runWorkerFirst: true,
      },
    };

    // Only prod owns the custom hostname; preview stages stay on workers.dev.
    const web = yield* Cloudflare.Website.Foldkit(
      "Web",
      stage === "prod"
        ? {
            ...website,
            domain: {
              name: "expendiru.tryagent.ca",
              zoneId: "6b062010219e582b6e8c5f8ab436430b",
            },
          }
        : website,
    );

    const github = yield* GitHub.GitHubEnv;

    if (github?.pr !== undefined) {
      yield* GitHub.Comment("PreviewComment", {
        owner: github.owner,
        repository: github.repository,
        issueNumber: github.pr,
        body: Output.interpolate`
          ## Preview deployed

          **App:** ${web.url}

          **API:** ${api.url}

          Built from commit ${github.sha.slice(0, 7)}.

          ---
          _This comment updates automatically with each push._
        `,
      });
    }

    return {
      apiUrl: api.url,
      url: web.url,
    };
  }),
);
