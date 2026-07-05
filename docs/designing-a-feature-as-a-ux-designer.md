# Designing a Feature as a UX Designer

This guide is for a designer who has been handed a spec that a product owner has already started.
The product brief — problem, goals, non-goals, users, and success metrics — is written. Your job
is to turn that plain-language intent into the **"2. Experience and design"** section of the same
spec, using the
[Spec Driven Development playbook](spec-driven-development.md) and its markdown template.

You are not expected to touch architecture, data, or code. You are expected to fill in one
section of an existing document, in enough detail that engineers can build from it without
guessing.

The worked example throughout this guide is the same one used in the product owner guide:
**letting a teacher save a lesson pack**. You can read the finished result at any time in
[`docs/specs/example-save-packs.md`](specs/example-save-packs.md) — this guide walks through how
the design section of that document came to exist.

## Before you start

- Read the whole product brief first (`## 1. Product brief`) before you design anything. Every
  goal and non-goal in that section is a constraint on what you're about to design.
- If anything in the product brief is ambiguous or missing — for example, it's unclear whether
  teachers need accounts — flag it back to the product owner rather than guessing. Add it to the
  spec's **"9. Open questions"** section instead of quietly deciding it yourself.
- You do not need to know how the feature will be built. Do not describe database fields, API
  routes, or component names — that is the architect's and engineers' job, later.
- Treat the **Non-goals** list as final unless the product owner changes it. If your design starts
  to require something on that list (for example, accounts, in order to show "your" packs), that's
  a decision to send back to product, not something to solve unilaterally in the design.

## Step-by-step instructions

1. **Re-read the product brief and restate it as user journeys.**
   For each goal in the product brief, write the step-by-step path a user takes to reach it,
   including the parts before and after the feature itself (how they got there, what they do
   next). Include the happy path and at least one important alternate or failure path.

   > Example, from the goal "Let a teacher save a pack they have built":
   > 1. Teacher builds a pack, selects **Save pack**, receives confirmation, and can still use the
   >    existing share URL.
   > 2. Teacher opens **My packs**, selects a saved pack, edits it, saves changes, and shares it
   >    again.
   > 3. Teacher attempts to save while offline or during a server error and sees a clear error
   >    without losing draft content.

2. **Name every state the interface can be in, not just the success case.**
   Walk through empty, loading, success, error, and permission-denied states for each new piece of
   UI. This is the part most often skipped, and the part engineers most need to build the feature
   correctly the first time.

   > Example:
   > - Empty: **My packs** explains that saved packs will appear after the teacher saves one.
   > - Loading: Save and list actions show progress without duplicating submissions.
   > - Success: The Builder shows that the current pack is saved.
   > - Error: The Builder explains that saving failed and keeps the teacher's unsaved content
   >   visible.
   > - Permission denied: If accounts are required, the teacher is prompted to sign in before
   >   viewing private saved packs.

3. **Write the actual words the user will see.**
   Draft labels, button text, helper text, and error copy. Note anything that needs
   localization or that depends on user role. You do not need final visual polish — you need the
   words a developer would otherwise have to invent themselves.

4. **Set accessibility expectations explicitly.**
   For each new interaction, state what must be true for keyboard-only use, screen readers, color
   contrast, and reduced motion. Write these as requirements ("must be reachable by keyboard"),
   not as a promise to check later.

   > Example:
   > - Save controls must be reachable by keyboard.
   > - Save status updates must be announced to screen readers.
   > - Error messages must identify what failed and what the teacher can do next.
   > - Focus should move predictably after opening or closing **My packs**.

5. **Attach or describe your design artifacts.**
   Link mockups, prototypes, or design tokens/components if they exist. If they don't exist yet,
   write enough of the journeys and states above that engineering isn't blocked waiting on a
   pixel-perfect file.

6. **Add your section to the spec file, not a new document.**
   Open the spec file the product owner created in `docs/specs/`. Fill in `## 2. Experience and
   design` — User journeys, UI states, Content requirements, Accessibility requirements, and
   Design artifacts — using steps 1–5. Leave `## 3. Architecture` and everything after it as
   blank template text.

7. **Update the spec header, don't just add content.**
   Set `Design owner` to your name. If the product brief already looks right and your design is
   complete enough for architecture to start, move `Status` from `draft` to `design-review`, per
   the [lifecycle table](spec-driven-development.md#recommended-lifecycle).

8. **Send it back to the product owner before it moves on.**
   Confirm with the product owner that your journeys and states still deliver the outcomes they
   asked for, and that you haven't reintroduced something from the non-goals list. Only then hand
   the spec to an architect or tech lead for `architecture-review`.

9. **Stay involved through later stages.**
   When architecture or engineering raises a constraint that affects what the user sees or does
   (for example, "accounts are required for private saved packs" or "saving can't be instant"),
   that changes your design section. Update it rather than letting the implementation quietly
   drift from what's written.

10. **Check the shipped feature against your design, not just the product outcome.**
    When the spec reaches `released`, verify the UI states, copy, and accessibility behavior in
    the real product match what you specified — or that any deviation was documented as a decision
    in the spec's decision log.

## What you are not responsible for

| Section | Who fills it in |
| --- | --- |
| Problem, goals, non-goals, users, success metrics | Product owner |
| API routes, data model changes | Architect / technical lead |
| Security, privacy, observability, rollout/rollback | Architect / technical lead |
| Acceptance criteria phrased as Given/When/Then | Engineering, informed by your journeys and states |
| Test plan | Engineering |
| Implementation tasks | Engineering |

## Worked example: from product brief to design section

Here is how the product owner's brief for saved packs turned into the design section of
[`docs/specs/example-save-packs.md`](specs/example-save-packs.md):

| Product owner wrote | Designer added |
| --- | --- |
| Goal: "Let a teacher save a pack they have built" | User journey 1: build → **Save pack** → confirmation → share URL still works |
| Goal: "Let a teacher reopen saved packs from a simple experience" | User journey 2: open **My packs** → select → edit → save → share again |
| User pain: "Unsure whether recent changes are stored" | UI states: saved / unsaved / saving / failed-save, each spelled out |
| Non-goal: "No collaborative editing" | No multi-user editing states designed; kept out of scope |
| (implicit, from goals) | Accessibility requirements for save controls, status announcements, and focus |

Everything from `## 3. Architecture` onward in that document was added later, by the architect and
engineers, once the design section above was in place.

## Recap checklist

Before you hand the spec to architecture, confirm you have:

- [ ] Re-read the product brief and non-goals, and flagged any ambiguity as an open question
      instead of guessing.
- [ ] Written at least one happy-path and one alternate/failure user journey per goal.
- [ ] Defined empty, loading, success, error, and permission-denied states for each new UI surface.
- [ ] Drafted the actual copy for labels, confirmations, and error messages.
- [ ] Written explicit keyboard, screen reader, contrast, and reduced-motion requirements.
- [ ] Linked or described design artifacts (mockups, prototypes, tokens).
- [ ] Filled in `## 2. Experience and design` in the existing spec file — not a separate document.
- [ ] Set yourself as `Design owner` and, if ready, moved `Status` to `design-review`.
- [ ] Confirmed with the product owner that the design still matches their intent before passing
      it on.

Once those boxes are checked, your job is to stay engaged as the spec moves through architecture,
build, and validation — updating your section if implementation reveals a constraint that changes
what the user sees or does.
