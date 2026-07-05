# Spec: Save teacher lesson packs

- **Spec ID:** SDD-2026-001
- **Status:** draft
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
| Packs | Add owner/session metadata if private saved packs require identity | Preserve existing anonymous packs and generated share links | Retain until teacher deletes or retention policy is defined |

### Security, privacy, and compliance
- Decide whether saved packs require teacher accounts before implementation starts.
- A teacher must not be able to view or edit another teacher's private saved packs.
- Validate all URLs using existing `http(s)` pack validation rules.
- Do not send saved-pack contents to AI review unless the teacher explicitly clicks the AI review action.

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

- [ ] Confirm whether teacher identity is in scope for the first saved-pack release.
- [ ] Finalize Builder and **My packs** UI states.
- [ ] Define API routes and database migration.
- [ ] Implement save, list, reopen, and update flows.
- [ ] Add automated tests mapped to acceptance criteria.
- [ ] Update README or user-facing docs.
- [ ] Validate Railway deployment and rollback plan.

## 7. Guardrails

- Do not break existing generated share URLs.
- Do not introduce grade passback or roster management in this feature.
- Do not store data outside the configured Railway persistent volume for production.
- Keep validation rules for pack URLs at least as strict as the current implementation.
- Do not make AI review automatic as part of saving.

## 8. Decision log

| Date | Decision | Options considered | Owner |
| --- | --- | --- | --- |
| 2026-07-05 | Treat saved packs as a distinct product workflow that needs identity and persistence decisions before build | Anonymous browser-only saves, private account-based saves, or shared-link-only reuse | Product owner |

## 9. Open questions

- [ ] Do teachers sign in, or is the first version based on local browser/session ownership?
- [ ] Should editing a saved pack update the existing share URL or create a new version?
- [ ] Is delete/archive required for the first release?
- [ ] What retention policy should apply to saved packs?

## 10. Release checklist

- [ ] Product acceptance completed.
- [ ] Design acceptance completed.
- [ ] Architecture review completed.
- [ ] Automated tests added or updated.
- [ ] Accessibility checks completed.
- [ ] Railway persistent storage behavior confirmed.
- [ ] Rollback plan confirmed.
- [ ] User/admin/support documentation updated.
