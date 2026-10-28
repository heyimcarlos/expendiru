# Expendiru

Effect code follows `.cursor/skills/effect` (kitlangton's Effect v4 guide). Read `SKILL.md` and the matching `references/*.md` before writing or changing Effect. Match those defaults: `Effect.gen` workflows, `Effect.fn` for service operations, `Context.Service` with `Layer.effect` and `Service.of`, `Schema.Struct` plus a same-name interface, `Schema.TaggedError`, and `Config` instead of `process.env`.

Foldkit owns the UI program (`defineMessageUnion`, Story, Scene). Do not replace that with a parallel Effect UI style.

The pinned `effect` package wins if a skill example disagrees with it. If `.cursor/rules/effect-fence.mdc` disagrees with the skill, follow the skill.

## Lint

Oxlint loads vendored anti-slop from `tools/oxlint/anti-slop/` (see `UPSTREAM.md` there), including every Effect rule in that snapshot. `pnpm lint` is the gate. Do not weaken those rules to get a commit through.

## CI is not a household member

GitHub Actions installs, typechecks, lints, tests, and deploys. It is not Carlos or Maria. Do not record product analytics from a workflow, and do not treat `GITHUB_ACTOR` as a person using the dashboard. If analytics are added later, they stay out of CI and honor `DO_NOT_TRACK`.

Merge-ready checks are `pnpm typecheck`, `pnpm lint`, and `pnpm test`. Deploy is a separate workflow and needs Cloudflare secrets. It does not replace those checks.
