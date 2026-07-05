# CLAUDE.md

Repo overview, local dev, and architecture are documented in `README.md` — read that first.

## Spec Driven Development

This repo coordinates product, design, architecture, and engineering work through specs in
`docs/specs/` (see `docs/spec-driven-development.md` for the full playbook).

Before implementing anything tied to an `SDD-YYYY-NNN` spec ID:

1. Read `docs/specs/<id>.md` in full, and its paired `.yaml` if one exists.
2. Treat sections 1-3 (product, design, architecture) and `## 7. Guardrails` as fixed constraints.
   Do not resolve open questions in `## 9. Open questions` yourself — ask, or implement both
   branches and record the assumption in `## 8. Decision log`.
3. Reference the spec ID in every commit message and in the pull request description.
4. As you implement, update the YAML's `tests[].status` and `release_checklist` fields in the same
   PR — the spec should reflect reality after your changes merge, not before.
5. Do not mark `release_checklist.tests_passing: true` unless the tests you added are actually
   passing in CI.
6. Only start implementation once a spec's `status` is `ready-for-build` or later. If it's still
   `draft`/`design-review`/`architecture-review`, that stage's owner needs to finish it first.
