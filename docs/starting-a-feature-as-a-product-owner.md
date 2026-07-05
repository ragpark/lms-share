# Starting a Feature as a Non-Technical Product Owner

This guide is for a product owner who has an idea for how LMS Share should change, but does not
write code and does not want to think about databases, APIs, or components. It explains, as a
plain list of instructions, how to turn an idea into a **feature development intent** that
designers, architects, and engineers can pick up through the
[Spec Driven Development playbook](spec-driven-development.md).

You are not expected to fill in every section of a spec. You are expected to fill in one section,
in your own words, and then hand it off.

The worked example throughout this guide is a real one already in this repository: **letting a
teacher save a lesson pack**. You can read the finished result at any time in
[`docs/specs/example-save-packs.md`](specs/example-save-packs.md) — this guide walks through how
that document came to exist in the first place.

## Before you start

- You do not need to know what an API, a database migration, or a component is. Skip any part of
  a template that asks for those things — that is someone else's job, later.
- You do not need to decide the final visual design. Describe the outcome you want; the designer
  turns it into screens.
- You are not writing code, and nothing in this guide asks you to.
- If you can describe the idea in a sentence to a colleague, you can write a feature intent.

## Step-by-step instructions

1. **Write down the problem in one or two plain sentences.**
   Describe who is affected and what is frustrating or missing today. Do not mention buttons,
   screens, or technology.

   > Example: "Teachers invest time building lesson packs. They need a simple way to save a pack,
   > find it again later, and reuse or edit it without rebuilding from scratch."

2. **List what "done" looks like, as outcomes, not features.**
   Write short bullet points starting with "Let a teacher..." or "A teacher can...". Avoid
   describing how it works — only what becomes possible.

   > Example:
   > - Let a teacher save a pack they have built.
   > - Let a teacher see that the pack is saved and safe to reuse.
   > - Let a teacher reopen saved packs later.

3. **List what you are deliberately leaving out.**
   This is the most valuable part of an intent, because it stops the idea from quietly growing
   into a much bigger project. Name anything you know you do NOT want yet, even if it seems
   obvious.

   > Example:
   > - No grade passback.
   > - No collaborative editing between teachers.
   > - No public marketplace or searchable pack library.

4. **Name who benefits and what they are struggling with today.**
   One line per type of user is enough: who they are, what they are trying to do, what is
   currently painful, and what a better outcome looks like.

   > Example: "Teacher — wants to save a lesson pack for later reuse — currently has to keep the
   > generated link somewhere else or rebuild the pack — should be able to save, find, reopen,
   > edit, and share it again."

5. **Say how you'd know it worked, in plain terms.**
   You do not need a dashboard or a metric name. A sentence like "more teachers come back and
   reuse a pack instead of rebuilding one" is enough. The team will turn this into something
   measurable later.

6. **Put your four notes into a new spec file.**
   - Copy the "Markdown spec template" from
     [`docs/spec-driven-development.md`](spec-driven-development.md).
   - Save it as `docs/specs/YYYY-MM-DD-short-name.md` (for example,
     `docs/specs/2026-07-05-save-lesson-packs.md`).
   - Fill in **only** the header fields and the **"1. Product brief"** section — Problem, Goals,
     Non-goals, Users and jobs to be done, and Success metrics — using the notes from steps 1–5.
   - Leave every other section (Experience and design, Architecture, Acceptance criteria, Test
     plan, and so on) exactly as blank template text. Do not guess at those parts — that is what
     the next steps are for.
   - Set `Status: draft` and put your own name as `Owner`. Leave `Design owner`,
     `Architecture owner`, and `Engineering owner` blank for now.

7. **Hand the intent off for review instead of sitting on it.**
   Share the spec file with the team (for example, by opening a pull request or sharing the file
   link) and ask a designer and an architect/tech lead to be assigned as reviewers. This moves the
   spec from `draft` toward `design-review`.

8. **Stay involved as the spec moves through its stages.**
   You do not need to write the design, architecture, or test sections yourself, but you should
   read each addition and confirm it still matches your original intent. If a reviewer's proposal
   changes what teachers can or cannot do, that is a product decision — it comes back to you.
   The stages, in order, are: `draft` → `design-review` → `architecture-review` →
   `ready-for-build` → `in-build` → `validation` → `released`. These are defined in the
   [lifecycle table](spec-driven-development.md#recommended-lifecycle) in the playbook.

9. **Give a clear go/no-go before build starts.**
   When the spec reaches `ready-for-build`, re-read the acceptance criteria engineering has
   written. Confirm each one still matches what you meant in step 2, then approve the status
   change. This is the last checkpoint before implementation work begins.

10. **Check the outcome once it ships, not just the plan.**
    When the spec reaches `released`, confirm the success signal you described in step 5 is being
    tracked, and that the non-goals from step 3 were actually left out.

## What you are not responsible for

Everything below is filled in by someone else, later in the process — you never need to write
these yourself:

| Section | Who fills it in |
| --- | --- |
| User journeys, screens, and UI states | Designer |
| Accessibility and content requirements | Designer |
| API routes, data model changes | Architect / technical lead |
| Security, privacy, observability, rollout/rollback | Architect / technical lead |
| Acceptance criteria phrased as Given/When/Then | Engineering, from your goals |
| Test plan | Engineering |
| Implementation tasks | Engineering |

## Worked example: from idea to intent

Here is how the four plain-language notes above became the product brief that opens
[`docs/specs/example-save-packs.md`](specs/example-save-packs.md):

| Your note | Where it landed in the spec |
| --- | --- |
| The one/two sentence problem | `## 1. Product brief` → `### Problem` |
| The "let a teacher..." outcomes | `### Goals` |
| What you're leaving out | `### Non-goals` |
| Who benefits and their pain | `### Users and jobs to be done` table |
| How you'd know it worked | `### Success metrics` table |

Everything after that point in the document — experience and design, architecture, acceptance
criteria, test plan, guardrails, decision log, and release checklist — was added by the designer,
architect, and engineers during the later review stages, not by the product owner.

## Recap checklist

Before you hand off a feature intent, confirm you have:

- [ ] A one- or two-sentence problem statement, in plain language.
- [ ] A short list of outcome-oriented goals ("Let a teacher...").
- [ ] An explicit list of non-goals, even ones that feel obvious.
- [ ] At least one user/job/pain/outcome row.
- [ ] A plain-language description of how you'd know it worked.
- [ ] A new file at `docs/specs/YYYY-MM-DD-short-name.md` with only the header and product brief
      filled in, `Status: draft`, and yourself listed as `Owner`.
- [ ] The spec shared with a designer and an architect/tech lead for review.

Once those boxes are checked, your job is to stay engaged as a reviewer and decision-maker through
each stage — not to write the technical sections yourself.
