# Implementing a Feature as an Engineer

This guide is for an engineer or engineering lead who has been handed a spec that product,
design, and architecture have already worked through. The product brief, the experience/design
section, and the architecture section are written. Your job is to turn that agreed intent into
the **"4. Acceptance criteria"**, **"5. Test plan"**, and **"6. Implementation plan"** sections of
the same spec — and then into working, tested code — using the
[Spec Driven Development playbook](spec-driven-development.md) and its markdown template.

Unlike the product, design, and architecture guides, you are expected to write code. But you
still start by filling in the spec, not by opening an editor, so the acceptance criteria and test
plan exist before implementation begins and can be reviewed independently of the diff.

The worked example throughout this guide is the same one used in the earlier guides: **letting a
teacher save a lesson pack**. You can read the finished result at any time in
[`docs/specs/example-save-packs.md`](specs/example-save-packs.md) — this guide walks through how
the acceptance criteria, test plan, and implementation plan of that document came to exist, and
how they turn into a pull request.

## What you need as input

Before you start, the spec should already give you:

- A completed **`## 1. Product brief`** — problem, goals, non-goals, users, and success metrics.
- A completed **`## 2. Experience and design`** — user journeys, UI states, content, and
  accessibility requirements.
- A completed **`## 3. Architecture`** — system context, API changes, data model changes,
  security/privacy/compliance, observability, and rollout/rollback.

Treat all three sections as fixed constraints, not suggestions. Specifically, you need:

- Every **user journey and UI state**, because each one becomes at least one acceptance
  criterion.
- Every **API change and data model change**, because each one needs a test that proves it works
  and a test that proves it fails safely.
- Every **non-goal and guardrail**, because each one is something your implementation must not do,
  not just something nobody asked for.

If the architecture section leaves something as an **open question** (for example, "decide whether
saved packs require teacher accounts before implementation starts"), do not silently resolve it in
code. Either get it answered by the product owner or architect before writing the acceptance
criteria that depend on it, or write the acceptance criteria for both outcomes and flag which
assumption you built against in the decision log.

## What you don't need to produce

- You do not rewrite the product brief, design section, or architecture section. If implementing
  the feature reveals that one of them is wrong or incomplete (a very common outcome), update that
  section and record why in **"8. Decision log"** — don't quietly build something different from
  what's written and leave the spec stale.
- You do not need to resolve product or design ambiguity yourself. Send it back to the relevant
  owner with a specific question, the same way design sends architecture questions back to
  product.
- You do not need pixel-perfect UI polish beyond what the design section specifies. Match the
  states, copy, and accessibility requirements that are written down; anything visual beyond that
  is a design decision, not an engineering one.

## Step-by-step instructions

1. **Read the product brief, design section, and architecture section fully before writing
   acceptance criteria.**
   List every user journey, every UI state, and every API/data change as a working list. Each item
   on that list needs at least one acceptance criterion below.

2. **Turn each user journey and UI state into a Given/When/Then acceptance criterion.**
   Write acceptance criteria so they describe an observable result a test can check, not an
   implementation detail.

   > Example, from the design section's journeys and UI states:
   > - **AC1:** Given a teacher has built a valid pack, when they select **Save pack**, then the
   >   pack is stored and the teacher sees a saved confirmation.
   > - **AC4:** Given saving fails, when the teacher remains in the Builder, then their unsaved
   >   draft remains visible and an actionable error message is shown.

3. **Add a regression acceptance criterion for anything the architecture said must keep working.**
   If the architecture section calls out preserving existing behavior (for example, "existing
   share URLs must keep working"), write that as its own acceptance criterion instead of assuming
   it's covered implicitly.

   > Example: **AC5:** Given a student opens an existing share URL, when the saved-pack feature is
   > enabled, then the student viewing experience still works as before.

4. **Map every acceptance criterion to at least one planned test in the test plan table.**
   For each AC, name the test type (unit, integration, component, e2e, manual/a11y), the test file
   or tool (a real path if you know it, a planned path if you don't yet), and an owner. Leave
   `Status` as `planned` until the test exists.

   > Example:
   > | Requirement/AC | Test type | Test file or tool | Owner | Status |
   > | --- | --- | --- | --- | --- |
   > | AC1 | unit/integration | Server pack save tests | Engineering | planned |
   > | AC4 | component | Save failure UI test | Engineering | planned |
   > | Accessibility | manual/a11y | Keyboard and screen reader checklist | Design/engineering | planned |

5. **Write the implementation plan as an ordered, checkable task list.**
   Break the work into tasks small enough to review independently — resolving open questions,
   building API routes, writing the migration, wiring up UI states, adding tests, updating docs.
   Order tasks so that anything blocking (like an unresolved open question about accounts) comes
   first.

6. **Add your sections to the spec file, not a new document.**
   Open the same spec file in `docs/specs/` that product, design, and architecture have been
   building. Fill in `## 4. Acceptance criteria`, `## 5. Test plan`, and `## 6. Implementation
   plan`. Add any implementation-specific guardrails you discover to `## 7. Guardrails` alongside
   the ones architecture already wrote.

7. **Update the spec header and advance its status.**
   Set `Engineering owner` to your name or team. Once acceptance criteria and the test plan are
   complete and estimable, move `Status` from `architecture-review` to `ready-for-build`. Get the
   product owner's go/no-go (per their guide) before moving to `in-build`.

8. **Implement in small, spec-referencing increments.**
   Reference the spec ID (for example, `SDD-2026-001`) in commit messages and pull request
   descriptions. Each pull request should say which acceptance criteria it implements and which
   tests it adds, so reviewers can check the diff against the spec instead of against your memory
   of the conversation.

9. **Write the test for each acceptance criterion as you implement it, not after.**
   Update the test plan's `Status` column as tests move from `planned` to `implemented` to
   `passing`. A criterion without a passing test is not done, regardless of whether the code
   "looks right."

10. **Respect every guardrail from architecture and design as a non-negotiable constraint.**
    Guardrails like "do not break existing generated share URLs" or "do not send saved-pack
    contents to AI review unless the teacher explicitly requests review" should be checked in code
    review and, where practical, enforced by a test — not just remembered.

11. **Update observability as specified.**
    Add the logs, metrics, or alerts the architecture section called for (for example, save
    success/failure events) so the team can tell after release whether the feature is working, not
    just whether it compiled.

12. **Move the spec to `validation`, then close the loop with product and design.**
    Once acceptance criteria are implemented and tested, move `Status` to `validation`. Walk
    through **"10. Release checklist"** — tests, accessibility checks, observability, rollback
    plan, and documentation — before asking product and design to confirm the shipped feature
    matches what they specified, per their guides.

13. **Update the decision log for anything that changed along the way.**
    If implementation forced a change to an API shape, a data model decision, or a UI detail,
    record it in `## 8. Decision log` with the date, the decision, the options considered, and who
    owned it — rather than letting the spec and the shipped code quietly diverge.

## What you are not responsible for

| Section | Who fills it in |
| --- | --- |
| Problem, goals, non-goals, users, success metrics | Product owner |
| User journeys, UI states, content, accessibility | Designer |
| System context, API/data changes, security, observability, rollout | Architect / technical lead |
| Final go/no-go before build and after release | Product owner |

## Worked example: from architecture section to acceptance criteria, tests, and implementation

Here is how the architecture section for saved packs turned into engineering's sections of
[`docs/specs/example-save-packs.md`](specs/example-save-packs.md):

| Architecture input | Engineering added |
| --- | --- |
| `POST /api/packs` (or `/api/saved-packs`) plus "existing share URLs must keep working" | AC1 (save produces a confirmation) and AC5 (existing share URL still works), each with a mapped regression test |
| `PUT /api/packs/:id` and `GET /api/packs` (or `/api/my-packs`) | AC2 (My packs lists saved packs) and AC3 (editing and re-saving reflects the latest changes), each with integration/component tests |
| UI states: saved / unsaved / saving / failed-save | AC4 (failed save keeps the draft visible with an actionable error) with a component test |
| Security note: "do not send saved-pack contents to AI review unless the teacher explicitly requests review" | Guardrail carried into `## 7. Guardrails`, to be checked in code review |
| Open question: "decide whether saved packs require teacher accounts" | Listed first in `## 6. Implementation plan` as a blocking task, since AC2's "list of their saved packs" depends on the answer |

Everything from `## 4. Acceptance criteria` onward in that document is engineering's responsibility
to keep accurate as implementation proceeds — including updating it if a criterion turns out to be
wrong once real code and tests exist.

## Recap checklist

Before you open a pull request, confirm you have:

- [ ] Read the full product brief, design section, and architecture section, and raised any open
      question that blocks an acceptance criterion instead of guessing.
- [ ] Written a Given/When/Then acceptance criterion for every user journey and UI state, plus one
      for every "must keep working" requirement from architecture.
- [ ] Mapped every acceptance criterion to at least one planned test with a type, file/tool, and
      owner.
- [ ] Written an ordered implementation plan with blocking tasks (like unresolved open questions)
      first.
- [ ] Filled in `## 4. Acceptance criteria`, `## 5. Test plan`, and `## 6. Implementation plan` in
      the existing spec file — not a separate document.
- [ ] Set yourself as `Engineering owner` and advanced `Status` through `ready-for-build` and
      `in-build` as work proceeds.
- [ ] Referenced the spec ID in commits and pull requests, and named which acceptance criteria and
      tests each pull request covers.
- [ ] Implemented every guardrail from `## 7. Guardrails`, adding your own where implementation
      revealed a new one.
- [ ] Added the logging, metrics, or alerts the architecture section specified.
- [ ] Updated the decision log for anything that changed from the approved architecture.
- [ ] Moved `Status` to `validation` and walked through `## 10. Release checklist` before asking
      product and design to confirm the shipped feature against their sections.

Once those boxes are checked, your job is to stay engaged through validation and release —
updating the spec if real usage reveals a gap, rather than treating the merged pull request as the
end of the process.
