# anti-slop provenance

Source repository: https://github.com/dmmulroy/anti-slop

Source commit: `13909c9e07590f5a85d93c62712259fe14a883f7` (branch `main` at install time).

Installed by `skills/install-anti-slop/scripts/install.mjs` from that checkout. The copied tree is `tools/oxlint/anti-slop/`, including `vendor/eslint-stylistic/LICENSE` and `vendor/eslint-stylistic/UPSTREAM.md`.

Oxlint and `@oxlint/plugins` are pinned together at `1.89.0`, the version already resolved in `pnpm-lock.yaml`.

## Configuration

Root `.oxlintrc.json` registers:

- `anti-slop` from `./tools/oxlint/anti-slop/index.ts`
- `anti-slop-effect` from `./tools/oxlint/anti-slop/effect/index.ts`

Every generic anti-slop rule listed by the install skill is `error`, plus native `oxc/no-accumulating-spread`. Every Effect rule shipped in this snapshot is `error`:

- `anti-slop-effect/no-manual-effect-error-tag`
- `anti-slop-effect/no-manual-tag-comparison`
- `anti-slop-effect/no-manual-tagged-construction`
- `anti-slop-effect/no-service-constructor-imports`
- `anti-slop-effect/prefer-effect-match`

`effect` is a direct dependency, so the Effect plugin is in scope. The service-constructor rule only sees relative imports. Package-alias imports such as `@expendiru/domain` are not enforced by that rule.

## Deviations

None in the vendored sources. Agent directories (`.cursor/**` and the install skill's other agent-tool paths) and this plugin directory are ignored so installed skills are not linted as application source.
