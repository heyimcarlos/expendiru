# Expendiru

Effect code follows `.cursor/skills/effect` (kitlangton's Effect v4 guide). Read `SKILL.md` and the matching `references/*.md` before writing or changing Effect. Match those defaults: `Effect.gen` workflows, `Effect.fn` for service operations, `Context.Service` with `Layer.effect` and `Service.of`, `Schema.Struct` plus a same-name interface, `Schema.TaggedError`, and `Config` instead of `process.env`.

Foldkit owns the UI program (`defineMessageUnion`, Story, Scene). Do not replace that with a parallel Effect UI style.

The pinned `effect` package wins if a skill example disagrees with it.
