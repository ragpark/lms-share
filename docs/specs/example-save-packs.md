# Spec: Save teacher lesson packs

- **Spec ID:** SDD-2026-001
- **Status:** ready-for-build
- **Owner:** Product owner
- **Design owner:** Product designer
- **Architecture owner:** Technical lead
- **Engineering owner:** LMS Share engineering
- **Created:** 2026-07-05
- **Target release:** TBD
- **Related links:** `docs/spec-driven-development.md`, `docs/specs/example-save-packs.yaml`

## 1. Product brief

### Problem
Teachers can build and share lesson packs, but they do not yet have an obvious product workflow for saving their own packs and returning to them later. This means a teacher may need to keep a generated URL somewhere else or rebuild a pack when they want to reuse or improve it.

### Goals
- Let a teacher save a pack they have built.
- Let a teacher see that the pack is saved and safe to reuse.
- Let a teacher reopen saved packs from a simple **My packs** experience.
- Preserve the current share-link behavior for students and classroom sharing.

### Non-goals
- No grade passback.
- No collaborative editing.
- No public marketplace or searchable pack library.
- No class roster management.
- No file upload changes.

### Users and jobs to be done
| User | Job | Current pain | Desired outcome |
| --- | --- | --- | --- |
| Teacher | Save a lesson pack for later reuse | Must keep the generated URL manually or rebuild the pack | Can save, find, reopen, edit, and share the pack again |
| Teacher | Confirm work is safe | Unsure whether recent changes are stored | Sees clear saved, unsaved, saving, and failed-save states |

### Success metrics
| Metric | Baseline | Target | Measurement source |
| --- | --- | --- | --- |
| Saved packs created | TBD | Increase after launch | Server logs or analytics event |
| Save failure rate | TBD | Below agreed threshold | Server logs or error tracking |
| Teachers returning to saved packs | TBD | Increase after launch | API logs or analytics event |

## 2. Experience and design

### User journeys
1. Teacher builds a pack, selects **Save pack**, receives confirmation, and can still use the existing share URL.
2. Teacher opens **My packs**, selects a saved pack, edits it, saves changes, and shares it again.
3. Teacher attempts to save while offline or during a server error and sees a clear error without losing draft content.

### UI states
- Empty: **My packs** explains that saved packs will appear after the teacher saves one.
- Loading: Save and list actions show progress without duplicating submissions.
- Success: The Builder shows that the current pack is saved.
- Error: The Builder explains that saving failed and keeps the teacher's unsaved content visible.
- Permission denied: If accounts are required, the teacher is prompted to sign in before viewing private saved packs.

### Accessibility requirements
- Save controls must be reachable by keyboard.
- Save status updates must be announced to screen readers.
- Error messages must identify what failed and what the teacher can do next.
- Focus should move predictably after opening or closing **My packs**.

## 3. Architecture

### System context
The feature affects the React Builder experience, server pack APIs, SQLite persistence, and Railway deployment assumptions about persistent storage.

### API changes
| Method | Path | Request | Response | Errors |
| --- | --- | --- | --- | --- |
| `POST` | `/api/packs` or `/api/saved-packs` | Pack title and items | Saved pack ID and share URL | `400`, `500` |
| `PUT` | `/api/packs/:id` | Updated title and items | Updated pack metadata | `400`, `403`, `404`, `500` |
| `GET` | `/api/packs` or `/api/my-packs` | Teacher identity or session context | List of saved packs | `401`, `500` |

### Data model changes
| Entity/table | Change | Migration/backfill | Retention |
| --- | --- | --- | --- |
| Packs | Add nullable `owner_token TEXT` column | Existing rows get `owner_token = NULL` (unowned/legacy packs); their share URLs keep working via `GET /api/packs/:id`, they just won't appear in anyone's **My packs** list | Retain indefinitely in v1 — no delete/archive and no automatic expiry (see decision log) |

### Security, privacy, and compliance
- **Decided:** no teacher accounts in this first release. Ownership is a per-pack, per-browser
  **owner token**: a random token minted client-side on save, stored in `localStorage`, and sent
  as a bearer credential on `PUT`/`GET /api/my-packs`. There is no login step and no server-side
  user identity. See decision log.
- A teacher must not be able to view or edit another teacher's saved packs — enforced by requiring
  the matching owner token on `PUT` (`403` if it doesn't match) and by scoping `GET /api/my-packs`
  to packs whose owner token matches the caller's.
- Validate all URLs using existing `http(s)` pack validation rules.
- Do not send saved-pack contents to AI review unless the teacher explicitly clicks the AI review action.
- Owner tokens are a bearer secret scoped to "can this browser edit/list this teacher's saved
  packs," not an identity system — losing the token (e.g. clearing browser storage) means losing
  edit/list access to previously saved packs, same as today's behavior for anonymous share links.

### Observability
- Log save success and save failure events without sensitive student data.
- Track API error rates for save and list endpoints.
- Add alerts or deployment checks if save failures spike after release.

### Rollout and rollback
- Prefer a feature flag if the UI is released before the full saved-pack workflow is ready.
- Database migrations must be safe for existing Railway SQLite data on the persistent volume.
- Rollback must preserve packs saved during the rollout or document any manual recovery step.

## 4. Acceptance criteria

- **AC1:** Given a teacher has built a valid pack, when they select **Save pack**, then the pack is stored and the teacher sees a saved confirmation.
- **AC2:** Given a teacher has saved packs, when they open **My packs**, then they see a list of their saved packs with enough information to choose the correct one.
- **AC3:** Given a teacher opens a saved pack, when they change the title or items and save again, then the saved pack reflects the latest changes.
- **AC4:** Given saving fails, when the teacher remains in the Builder, then their unsaved draft remains visible and an actionable error message is shown.
- **AC5:** Given a student opens an existing share URL, when the saved-pack feature is enabled, then the student viewing experience still works as before.

## 5. Test plan

| Requirement/AC | Test type | Test file or tool | Owner | Status |
| --- | --- | --- | --- | --- |
| AC1 | unit/integration | Server pack save tests | Engineering | planned |
| AC2 | component/e2e | Builder or My packs UI tests | Engineering | planned |
| AC3 | integration | Update saved pack API tests | Engineering | planned |
| AC4 | component | Save failure UI test | Engineering | planned |
| AC5 | regression | Pack viewer tests | Engineering | planned |
| Accessibility | manual/a11y | Keyboard and screen reader checklist | Design/engineering | planned |

## 6. Implementation plan

- [ ] Add the `owner_token` column and migration; mint/store the token client-side per the decided
      session/browser-based ownership model (no accounts).
- [ ] Finalize Builder and **My packs** UI states.
- [ ] Define API routes (`PUT /api/packs/:id`, `GET /api/my-packs`) and wire owner-token auth.
- [ ] Implement save, list, reopen, and update flows (update-in-place, same share URL — see
      decision log).
- [ ] Add automated tests mapped to acceptance criteria.
- [ ] Update README or user-facing docs.
- [ ] Validate Railway deployment and rollback plan.

## 7. Guardrails

- Do not break existing generated share URLs.
- Do not introduce grade passback or roster management in this feature.
- Do not store data outside the configured Railway persistent volume for production.
- Keep validation rules for pack URLs at least as strict as the current implementation.
- Do not make AI review automatic as part of saving.
- Do not build teacher accounts/login in this feature — ownership is the owner-token model
  decided in `## 8. Decision log`.
- Do not add delete/archive or a real retention policy in this feature — explicitly deferred to a
  follow-up spec.
- Never log or expose an owner token in a way another teacher's browser could read it (e.g. don't
  echo it in `GET /api/packs/:id`, the public share-view route).

## 8. Decision log

| Date | Decision | Options considered | Owner |
| --- | --- | --- | --- |
| 2026-07-05 | Treat saved packs as a distinct product workflow that needs identity and persistence decisions before build | Anonymous browser-only saves, private account-based saves, or shared-link-only reuse | Product owner |
| 2026-07-05 | Ownership: no teacher accounts in v1. Use a random owner token minted client-side on save and stored in `localStorage`, sent as a bearer credential to edit or list packs. Rationale: the app has no auth/session system today (confirmed in `server/index.js`), and adding one is a much larger change than this feature's stated goals justify; a token keeps the "no login" feel of the current share-link flow while still scoping edit/list to the teacher who created the pack. | Local browser/session-token ownership, full account system with login, no ownership (fully public my-packs) | Product owner |
| 2026-07-05 | Editing a saved pack updates it **in place** — same `id`, same share URL — rather than creating a new version. Rationale: matches AC3 ("the saved pack reflects the latest changes") and preserves the existing share-link contract (goal: "preserve the current share-link behavior") instead of forcing teachers or students to track multiple URLs per pack. | Update in place, create a new pack + new share URL per save, keep version history | Product owner |
| 2026-07-05 | Delete/archive is out of scope for the first release. | Ship delete/archive in v1, defer to a follow-up spec | Product owner |
| 2026-07-05 | Retention: saved packs (and existing anonymous packs) are retained indefinitely in v1 — no automatic expiry. A real retention/delete policy is deferred to the same follow-up as delete/archive. | Indefinite retention, time-boxed expiry, defer to follow-up spec | Product owner |

## 9. Open questions

None blocking `ready-for-build`. All four questions raised during architecture review were
resolved above (`## 8. Decision log`, 2026-07-05). Delete/archive and a real retention policy are
explicitly deferred — track them as a follow-up spec once the first saved-pack release ships, not
as silent scope creep into this one.

## 10. Release checklist

- [ ] Product acceptance completed.
- [ ] Design acceptance completed.
- [ ] Architecture review completed.
- [ ] Automated tests added or updated.
- [ ] Accessibility checks completed.
- [ ] Railway persistent storage behavior confirmed.
- [ ] Rollback plan confirmed.
- [ ] User/admin/support documentation updated.
