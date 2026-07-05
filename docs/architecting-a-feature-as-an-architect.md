# Architecting a Feature as an Architect / Tech Lead

This guide is for an architect or technical lead who has been handed a spec that product and
design have already worked through. The product brief and the experience/design section are
written. Your job is to turn that intent into the **"3. Architecture"** section of the same spec,
using the [Spec Driven Development playbook](spec-driven-development.md) and its markdown
template — so that engineering can build without discovering unresolved technical decisions
mid-implementation.

You are not expected to write code or open a pull request against the application yet. You are
expected to fill in one section of an existing document, in enough detail that engineers can
implement, test, and deploy the feature without having to reverse-engineer decisions you
implicitly made.

The worked example throughout this guide is the same one used in the earlier guides: **letting a
teacher save a lesson pack**. You can read the finished result at any time in
[`docs/specs/example-save-packs.md`](specs/example-save-packs.md) — this guide walks through how
the architecture section of that document came to exist.

## What you need as input

Before you start, the spec should already give you:

- A completed **`## 1. Product brief`** — problem, goals, non-goals, users, and success metrics,
  written by the product owner.
- A completed **`## 2. Experience and design`** — user journeys, UI states, content, and
  accessibility requirements, written by the designer.

Treat both sections as fixed constraints, not suggestions. Specifically, you need:

- Every **goal**, because each one implies something the system must support.
- Every **non-goal**, because each one is a boundary you should design against, not quietly
  design past (for example, "no collaborative editing" rules out realtime sync as a concern).
- Every **user journey and UI state**, because each one implies a request, a response, an error
  path, or a piece of state that has to live somewhere.

If either section is missing, thin, or internally inconsistent — for example, a UI state implies
private ownership but the product brief never mentions accounts — send it back to product or
design with a specific question rather than resolving the ambiguity yourself. Record it in the
spec's **"9. Open questions"** section so the resolution is visible to everyone, not just decided
in your head.

## What you don't need to produce

- You do not write the acceptance criteria (`## 4. Acceptance criteria`) or test plan
  (`## 5. Test plan`) — those belong to engineering, though you should make sure your architecture
  section gives them enough to write both without guessing.
- You do not write implementation code, open pull requests, or write the actual database
  migration files. You describe the shape of the change; engineering builds it.
- You do not redesign the UI. If your architecture reveals a UI consequence (for example, "saving
  can't be instant" or "accounts are required for private packs"), that goes back to the designer
  and product owner as a decision, not a silent change to their sections.
- You do not need final numbers for capacity, latency budgets, or cost unless the product brief's
  success metrics specifically require them. Write down what's known and mark the rest as an open
  question rather than inventing precision that doesn't exist yet.

## Step-by-step instructions

1. **Read the product brief and design section fully before writing anything.**
   List, for yourself, every noun that will need to be stored, every action that will need an
   endpoint, and every non-goal that rules out an approach. This becomes your working list for the
   steps below.

2. **Describe the system context in plain terms.**
   Name which parts of the existing system the feature touches — which frontend surfaces, which
   services, which datastore, which deployment environment. Keep it to a paragraph; a diagram link
   is a bonus, not a requirement.

   > Example: "The feature affects the React Builder experience, server pack APIs, SQLite
   > persistence, and Railway deployment assumptions about persistent storage."

3. **List the API changes implied by the user journeys.**
   For each action a user takes in the design section (save, reopen, edit, list), name the method,
   path, request, response, and error codes. You do not need exact final route names — a
   reasonable option with an alternative noted (for example, `/api/packs` or `/api/saved-packs`)
   is enough for engineering to finalize.

   > Example:
   > | Method | Path | Request | Response | Errors |
   > | --- | --- | --- | --- | --- |
   > | `POST` | `/api/packs` or `/api/saved-packs` | Pack title and items | Saved pack ID and share URL | `400`, `500` |
   > | `PUT` | `/api/packs/:id` | Updated title and items | Updated pack metadata | `400`, `403`, `404`, `500` |
   > | `GET` | `/api/packs` or `/api/my-packs` | Teacher identity or session context | List of saved packs | `401`, `500` |

4. **List the data model changes, including what happens to existing data.**
   Name the entity or table, what changes, how existing data is migrated or backfilled, and how
   long the data is retained. Explicitly state what happens to data that already exists today —
   this is the detail engineering is most likely to get wrong without your input.

   > Example: "Packs — add owner/session metadata if private saved packs require identity —
   > preserve existing anonymous packs and generated share links — retain until teacher deletes or
   > retention policy is defined."

5. **Work through security, privacy, and compliance explicitly.**
   State what must be decided before implementation starts (for example, whether accounts are
   required), what one user must never be able to do to another user's data, which existing
   validation rules still apply, and any limits on what data reaches third parties (such as an AI
   provider).

6. **State what should be observable after release.**
   Name the events or error rates that should be logged or measured so the team can tell whether
   the feature is working after it ships, tying back to the product owner's success metrics where
   possible.

7. **Write the rollout and rollback plan.**
   State whether a feature flag is needed, what must be true for database migrations to be safe
   against existing production data, and what rollback looks like — including whether packs
   created during the rollout survive a rollback.

8. **Add your section to the spec file, not a new document.**
   Open the same spec file in `docs/specs/` that product and design have been building. Fill in
   `## 3. Architecture` — System context, API changes, Data model changes, Security/privacy/
   compliance, Observability, and Rollout and rollback. Leave `## 4. Acceptance criteria` onward as
   blank template text; that's engineering's section to complete next.

9. **Update the spec header and advance its status.**
   Set `Architecture owner` to your name. If your section is complete and consistent with product
   and design, move `Status` from `design-review` to `architecture-review`, and once you and the
   product owner agree it's ready to build, to `ready-for-build`, per the
   [lifecycle table](spec-driven-development.md#recommended-lifecycle).

10. **Add any technical guardrails engineering must not cross.**
    Use the spec's `## 7. Guardrails` section for constraints like "do not break existing generated
    share URLs" or "do not store data outside the configured persistent volume in production."
    These are the rules a Coding AI or engineer should treat as non-negotiable.

11. **Stay involved once build starts.**
    If engineering discovers your architecture doesn't quite work once they start building (a
    common and expected outcome), update the spec's decision log and architecture section rather
    than letting the implementation silently diverge from what's written.

## What you are not responsible for

| Section | Who fills it in |
| --- | --- |
| Problem, goals, non-goals, users, success metrics | Product owner |
| User journeys, UI states, content, accessibility | Designer |
| Acceptance criteria phrased as Given/When/Then | Engineering, informed by your architecture |
| Test plan | Engineering |
| Implementation tasks and actual code | Engineering |

## Worked example: from design section to architecture section

Here is how the design section for saved packs turned into the architecture section of
[`docs/specs/example-save-packs.md`](specs/example-save-packs.md):

| Product/design input | Architect added |
| --- | --- |
| Journey: build → **Save pack** → confirmation → share URL still works | `POST /api/packs` (or `/api/saved-packs`) endpoint, plus a note that existing share URLs must keep working |
| Journey: open **My packs** → select → edit → save again | `PUT /api/packs/:id` and `GET /api/packs` (or `/api/my-packs`) endpoints |
| UI state: saved / unsaved / saving / failed-save | Error codes (`400`, `403`, `404`, `500`) for each endpoint, and an observability note to log save success/failure |
| Non-goal: "No public marketplace or searchable pack library" | No search index or public listing designed into the data model |
| Open question implied by "My packs" (whose packs?) | Security/privacy note: "Decide whether saved packs require teacher accounts before implementation starts," recorded as an open question rather than assumed |

Everything from `## 4. Acceptance criteria` onward in that document was added later, by engineering,
once the architecture section above was in place.

## Recap checklist

Before you hand the spec to engineering, confirm you have:

- [ ] Read the full product brief and design section, and raised any ambiguity as an open question
      instead of resolving it silently.
- [ ] Described the system context in a short paragraph.
- [ ] Listed API changes covering every user action in the design section, with request/response
      shapes and error codes.
- [ ] Listed data model changes, including what happens to existing data.
- [ ] Addressed security, privacy, and compliance, including any decision that must be made before
      build starts.
- [ ] Stated what should be logged, measured, or alerted on after release.
- [ ] Written a rollout and rollback plan that accounts for existing production data.
- [ ] Added any non-negotiable guardrails to `## 7. Guardrails`.
- [ ] Filled in `## 3. Architecture` in the existing spec file — not a separate document.
- [ ] Set yourself as `Architecture owner` and advanced `Status` if the section is complete.

Once those boxes are checked, your job is to stay engaged through build and validation — updating
the architecture section and decision log if implementation reveals something your design didn't
anticipate, rather than letting the code and the spec drift apart.
