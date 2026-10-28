import { expect, it } from "@effect/vitest";
import edge from "./edge.ts";

interface RecordedCall {
  readonly binding: "API" | "ASSETS";
  readonly method: string;
  readonly url: string;
}

const harness = () => {
  const calls: Array<RecordedCall> = [];

  const binding = (name: "API" | "ASSETS") => ({
    fetch: (request: Request): Promise<Response> => {
      calls.push({ binding: name, method: request.method, url: request.url });

      return Promise.resolve(new Response(name));
    },
  });

  return {
    calls,
    env: {
      API: binding("API"),
      ASSETS: binding("ASSETS"),
    },
  };
};

const text = (response: Response): Promise<string> => response.text();

it("proxies household GET paths to the api binding", async () => {
  const { calls, env } = harness();

  const snapshot = await edge.fetch(new Request("https://web.example/snapshot"), env);
  const spend = await edge.fetch(new Request("https://web.example/spend?from=2026-07"), env);
  const health = await edge.fetch(new Request("https://web.example/health"), env);

  expect(await text(snapshot)).toBe("API");
  expect(await text(spend)).toBe("API");
  expect(await text(health)).toBe("API");
  expect(calls.map((call) => call.url)).toEqual([
    "https://web.example/snapshot",
    "https://web.example/spend?from=2026-07",
    "https://web.example/health",
  ]);
});

it("serves every other request from assets", async () => {
  const { calls, env } = harness();

  const page = await edge.fetch(new Request("https://web.example/"), env);
  const post = await edge.fetch(new Request("https://web.example/snapshot", { method: "POST" }), env);
  const nested = await edge.fetch(new Request("https://web.example/snapshot/extra"), env);

  expect(await text(page)).toBe("ASSETS");
  expect(await text(post)).toBe("ASSETS");
  expect(await text(nested)).toBe("ASSETS");
  expect(calls.every((call) => call.binding === "ASSETS")).toBe(true);
});
