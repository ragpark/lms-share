# Spec Driven Development Playbook

Spec Driven Development (SDD) keeps product decisions, design intent, architecture, implementation, tests, and release guardrails in one reviewable trail. The goal is not to slow iteration; it is to make each iteration explicit enough that product managers, designers, architects, and engineers can agree what is changing before code becomes the source of truth.

> **Non-technical product owner?** Start with
> [Starting a Feature as a Non-Technical Product Owner](starting-a-feature-as-a-product-owner.md)
> for plain-language, step-by-step instructions on how to turn an idea — such as letting a
> teacher save a lesson pack — into the first draft of a spec, without writing any code.

## How to proceed

1. **Create one spec per meaningful product change.** Use `docs/specs/YYYY-MM-DD-short-name.md` for narrative context and, when machine-readable gates help, pair it with `docs/specs/YYYY-MM-DD-short-name.yaml`.
2. **Start with outcomes, not implementation.** Product owns the problem statement, target users, success metrics, non-goals, and release criteria.
3. **Add design intent early.** Designers own user journeys, content states, accessibility expectations, responsive behavior, and any links to mockups or prototypes.
4. **Review architecture before build.** Architects or senior engineers own system boundaries, data model changes, API contracts, security/privacy considerations, migration strategy, observability, and rollback plans.
5. **Turn acceptance criteria into tests.** Engineers map each user-facing requirement to unit, integration, end-to-end, accessibility, and manual checks before implementation begins.
6. **Track decisions and changes in the spec.** Use a decision log so later contributors understand why trade-offs were made.
7. **Make the spec a release gate.** Pull requests should cite the spec, update implementation status, and explain any variance from the approved acceptance criteria.

## Recommended lifecycle

| Stage | Primary owner | Required reviewers | Exit criteria |
| --- | --- | --- | --- |
| `draft` | Product | Designer, architect | Problem, users, goals, non-goals, risks, and rough scope are documented. |
| `design-review` | Designer | Product, engineering | User flows, UI states, accessibility requirements, and content expectations are documented. |
| `architecture-review` | Architect | Engineering, product | Data, API, security, operational, and migration impacts are documented. |
| `ready-for-build` | Engineering lead | Product, designer, architect | Acceptance criteria and test plan are complete and estimable. |
| `in-build` | Engineers | Engineering lead | Implementation references the spec and keeps status current. |
| `validation` | QA/engineers | Product, designer | Automated and manual checks prove acceptance criteria. |
| `released` | Product | Engineering lead | Rollout, monitoring, support notes, and follow-up items are recorded. |

## Markdown spec template

```md
# Spec: <feature or change name>

- **Spec ID:** SDD-YYYY-NNN
- **Status:** draft | design-review | architecture-review | ready-for-build | in-build | validation | released | superseded
- **Owner:** <product owner>
- **Design owner:** <designer>
- **Architecture owner:** <architect or tech lead>
- **Engineering owner:** <engineer or team>
- **Created:** YYYY-MM-DD
- **Target release:** <date, milestone, or TBD>
- **Related links:** <tickets, mockups, dashboards, prior specs>

## 1. Product brief

### Problem
<What user or business problem are we solving?>

### Goals
- <Outcome-oriented goal>

### Non-goals
- <Explicitly out-of-scope item>

### Users and jobs to be done
| User | Job | Current pain | Desired outcome |
| --- | --- | --- | --- |
| <persona> | <job> | <pain> | <outcome> |

### Success metrics
| Metric | Baseline | Target | Measurement source |
| --- | --- | --- | --- |
| <metric> | <baseline> | <target> | <analytics/log/dashboard> |

## 2. Experience and design

### User journeys
1. <Step-by-step happy path>
2. <Important alternate path>

### UI states
- Empty:
- Loading:
- Success:
- Error:
- Permission denied:

### Content requirements
- <Labels, helper text, error copy, localization notes>

### Accessibility requirements
- Keyboard:
- Screen reader:
- Color/contrast:
- Reduced motion:

### Design artifacts
- Mockups:
- Prototype:
- Design tokens/components:

## 3. Architecture

### System context
<Describe touched systems and boundaries. Add diagram link if useful.>

### API changes
| Method | Path | Request | Response | Errors |
| --- | --- | --- | --- | --- |
| <GET/POST> | </api/...> | <shape> | <shape> | <codes> |

### Data model changes
| Entity/table | Change | Migration/backfill | Retention |
| --- | --- | --- | --- |
| <name> | <change> | <strategy> | <policy> |

### Security, privacy, and compliance
- Data classification:
- Auth/authz:
- Input validation:
- Abuse cases:
- Audit/logging:

### Observability
- Logs:
- Metrics:
- Alerts:
- Dashboards:

### Rollout and rollback
- Feature flag:
- Rollout stages:
- Rollback trigger:
- Data recovery plan:

## 4. Acceptance criteria

Use Given/When/Then statements that can be mapped directly to tests.

- **AC1:** Given <context>, when <action>, then <observable result>.
- **AC2:** Given <context>, when <action>, then <observable result>.

## 5. Test plan

| Requirement/AC | Test type | Test file or tool | Owner | Status |
| --- | --- | --- | --- | --- |
| AC1 | unit | <path or planned path> | <owner> | planned |
| AC1 | integration/e2e | <path or planned path> | <owner> | planned |
| Accessibility | manual/a11y | <tool/checklist> | <owner> | planned |

## 6. Implementation plan

- [ ] <Task 1>
- [ ] <Task 2>
- [ ] <Docs/support update>

## 7. Guardrails

- Performance budget:
- Browser/device support:
- Dependency policy:
- Backward compatibility:
- Feature flag required:
- Documentation required:

## 8. Decision log

| Date | Decision | Options considered | Owner |
| --- | --- | --- | --- |
| YYYY-MM-DD | <decision> | <trade-offs> | <owner> |

## 9. Open questions

- [ ] <Question, owner, due date>

## 10. Release checklist

- [ ] Product acceptance completed.
- [ ] Design acceptance completed.
- [ ] Architecture review completed.
- [ ] Automated tests added or updated.
- [ ] Accessibility checks completed.
- [ ] Observability added or confirmed unnecessary.
- [ ] Rollback plan confirmed.
- [ ] User/admin/support documentation updated.
```

## YAML spec template

Use YAML when you want automated checks in CI, dashboards, or issue generation. Keep prose-heavy design context in Markdown and link it from `links.design_spec`.

```yaml
spec_id: SDD-YYYY-NNN
name: <feature or change name>
status: draft # draft | design-review | architecture-review | ready-for-build | in-build | validation | released | superseded
created: YYYY-MM-DD
target_release: TBD
owners:
  product: <name>
  design: <name>
  architecture: <name>
  engineering: <name or team>
links:
  markdown_spec: docs/specs/YYYY-MM-DD-short-name.md
  issue: <url>
  design_spec: <url>
  prototype: <url>
  dashboard: <url>
product:
  problem: <one paragraph>
  goals:
    - <outcome-oriented goal>
  non_goals:
    - <out-of-scope item>
  users:
    - persona: <persona>
      job_to_be_done: <job>
      pain: <pain>
      desired_outcome: <outcome>
  success_metrics:
    - name: <metric>
      baseline: <baseline>
      target: <target>
      source: <analytics/log/dashboard>
design:
  journeys:
    - name: happy_path
      steps:
        - <step>
  ui_states:
    empty: <expectation>
    loading: <expectation>
    success: <expectation>
    error: <expectation>
    permission_denied: <expectation>
  accessibility:
    keyboard: <expectation>
    screen_reader: <expectation>
    contrast: <expectation>
    reduced_motion: <expectation>
  content:
    localization: <notes>
    error_copy: <notes>
architecture:
  touched_systems:
    - <system/module>
  api_changes:
    - method: POST
      path: /api/example
      request_schema: <schema or link>
      response_schema: <schema or link>
      error_codes: [400, 401, 500]
  data_changes:
    - entity: <table/entity>
      change: <description>
      migration: <strategy>
      retention: <policy>
  security_privacy:
    data_classification: <classification>
    authz: <requirements>
    input_validation: <requirements>
    abuse_cases:
      - <case>
  observability:
    logs:
      - <event>
    metrics:
      - <metric>
    alerts:
      - <alert or none>
  rollout:
    feature_flag: <flag or none>
    stages:
      - <stage>
    rollback_trigger: <condition>
acceptance_criteria:
  - id: AC1
    given: <context>
    when: <action>
    then: <observable result>
tests:
  - ac: AC1
    type: unit
    path: <test path or planned>
    owner: <name>
    status: planned # planned | implemented | passing | blocked | waived
  - ac: AC1
    type: e2e
    path: <test path or planned>
    owner: <name>
    status: planned
guardrails:
  performance_budget: <budget>
  browser_support: <policy>
  dependency_policy: <policy>
  backward_compatibility: <requirements>
  documentation_required: true
implementation:
  tasks:
    - id: TASK1
      description: <task>
      owner: <name>
      status: todo # todo | doing | done | blocked
open_questions:
  - question: <question>
    owner: <name>
    due: YYYY-MM-DD
decisions:
  - date: YYYY-MM-DD
    decision: <decision>
    options_considered:
      - <option>
    owner: <name>
release_checklist:
  product_acceptance: false
  design_acceptance: false
  architecture_acceptance: false
  tests_passing: false
  accessibility_checked: false
  observability_ready: false
  rollback_ready: false
  docs_updated: false
```

## Real-world example: teacher saved packs

Imagine you are the product owner for LMS Share and you want teachers to save packs they have built so they can return later, edit, reuse, and share them again. The spec should translate that plain-language intent into a shared agreement that people and automation can both understand.

### What the product owner writes in plain English

Start by describing the teacher outcome without prescribing the database or code solution:

> Teachers invest time building lesson packs. They need a simple way to save a pack, find it again later, and reuse or edit it without rebuilding from scratch.

Then add the boundaries that prevent accidental scope creep:

- This first version is for saving and reopening a teacher's own packs.
- It does not need class rosters, grade passback, collaborative editing, or public search.
- A teacher should understand whether a pack is saved, unsaved, saving, or failed to save.
- A teacher should not lose work if a save fails.

### What the designer adds

The designer turns that intent into visible product behavior:

- Where the **Save pack** action appears in the Builder.
- What teachers see after a successful save.
- How the app shows saved, unsaved, saving, and error states.
- How a teacher finds previously saved packs, for example a **My packs** page.
- Keyboard, screen reader, focus, and error-message expectations.

### What architects and engineers add

Architects and engineers translate the experience into safe implementation boundaries:

- Whether teachers need accounts before saved packs can be private.
- Which API routes are needed, such as creating, updating, listing, and retrieving saved packs.
- Which database fields are needed, such as owner, title, items, timestamps, and share URL.
- What happens to existing anonymous shared packs.
- How data is backed up and retained on Railway's persistent volume.
- Which logs or metrics show saves succeeding or failing.
- How the feature can be rolled back without losing teacher-created content.

### What Coding AI needs from the spec

A Coding AI can follow the spec better when the work is expressed as precise, testable instructions rather than broad wishes. Include:

- A stable spec ID, for example `SDD-2026-001`, that the Coding AI must reference in commits and pull requests.
- Acceptance criteria written as Given/When/Then statements.
- Exact files or areas likely to change, if known, such as `src/PackBuilder.jsx`, `server/index.js`, and validation tests.
- Required tests for each acceptance criterion.
- Guardrails such as "do not add grade passback" or "do not send saved-pack contents to AI review unless the teacher explicitly requests review."
- Migration and rollback notes so the AI does not make a change that only works on a clean local database.

### What GitHub CI/CD can understand

GitHub can enforce parts of the spec if the spec includes machine-readable fields:

- `spec_id` lets pull requests prove they are tied to an approved change.
- `status: ready-for-build` tells reviewers and CI that implementation can begin.
- `acceptance_criteria` and `tests` let a workflow check that planned tests exist.
- `release_checklist.tests_passing: true` can become a merge requirement.
- PR templates can require links to the Markdown spec, YAML spec, screenshots for UI changes, and notes on any spec deviation.

### What Railway deployment can respect

Railway will not read product intent directly, so the spec should call out deployment-sensitive requirements in concrete terms:

- Persistent data must live on the configured Railway volume, not ephemeral container storage.
- Any new environment variables must be named and documented.
- Database migrations must run safely against existing pack data.
- Rollback instructions must explain whether old code can read data written by new code.
- Health checks, logs, or metrics should make save failures visible after deployment.

See `docs/specs/example-save-packs.md` for a filled-in human-readable spec and `docs/specs/example-save-packs.yaml` for a matching machine-readable draft that a future GitHub workflow could validate.

## Pull request guardrail

Every implementation pull request should include:

- Spec link and current spec status.
- Acceptance criteria implemented.
- Tests added or updated for each acceptance criterion.
- Product/design/architecture deviations from the approved spec.
- Screenshots or recordings for visible UI changes.
- Rollout, observability, and rollback notes.

A lightweight CI check can later validate that changed application files reference a spec ID in the pull request body and that any YAML spec is valid.
