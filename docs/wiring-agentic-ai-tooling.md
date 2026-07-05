# Wiring Jira, Claude, GitHub, and Railway to Consume a Spec

This guide is for an engineering lead setting up the automation around Spec Driven Development,
not for someone filling in a spec's content. The other guides
([product owner](starting-a-feature-as-a-product-owner.md),
[designer](designing-a-feature-as-a-ux-designer.md),
[architect](architecting-a-feature-as-an-architect.md),
[engineer](implementing-a-feature-as-an-engineer.md)) describe what goes *in* a spec. This guide
describes how to make Jira, Claude, GitHub, and Railway actually read and act on it, using the
[Spec Driven Development playbook](spec-driven-development.md) and its YAML template as the
machine-readable contract between them.

The worked example is the same one used throughout: **letting a teacher save a lesson pack**,
`SDD-2026-001`, in [`docs/specs/example-save-packs.md`](specs/example-save-packs.md) and
[`docs/specs/example-save-packs.yaml`](specs/example-save-packs.yaml).

## The loop, end to end

```
Jira ticket  --transition-->  spec.yaml status
     ^                              |
     |                              v
  (status synced back)      Claude reads spec.md + spec.yaml
     |                              |
     |                              v
     |                    branch + commits + PR (spec_id referenced)
     |                              |
     |                              v
     |                    GitHub Actions validates spec + gates merge
     |                              |
     |                              v
     +------------------  Railway deploys per environment,
                           release_checklist gates production
```

Nothing here requires a bespoke integration platform. Jira, GitHub, and Railway all have plain
webhooks/APIs; Claude is invoked either as a Claude Code Remote session (bound to a trigger) or as
a GitHub Action. The spec's YAML file is the shared state all four tools read from and write back
to — treat it as the source of truth, not any one tool's internal state.

## 1. Jira: intake and status, not implementation detail

Jira should track *that* a spec exists and *what state* it's in — it should not duplicate the
spec's content.

- **Add two custom fields to your Jira issue type** (or reuse a "Spec" issue type):
  - `Spec ID` — free text, must match `spec_id` in the YAML exactly (e.g. `SDD-2026-001`).
  - `Spec path` — a link to `docs/specs/<file>.md` in GitHub, so anyone on the ticket can open the
    actual spec instead of a Jira description that goes stale.
- **Mirror the YAML `status` field as the Jira ticket status**, not the other way around. The YAML
  is authored in a pull request and reviewed like code; Jira's role is to reflect it, not decide
  it.
- **Jira Automation rule — "Ready for Build" kickoff:**
  - Trigger: issue transitions to a status equivalent to `ready-for-build`.
  - Action: "Send web request" to a GitHub `repository_dispatch` endpoint (or, if you're driving
    Claude Code Remote directly, to a `create_trigger`-style webhook), with a JSON payload:
    ```json
    {
      "event_type": "spec-ready-for-build",
      "client_payload": {
        "spec_id": "{{issue.customfield_spec_id}}",
        "spec_path": "{{issue.customfield_spec_path}}",
        "jira_key": "{{issue.key}}"
      }
    }
    ```
  - Store the GitHub token / trigger secret in Jira's automation secret store, not in the rule
    body.
- **Jira Automation rule — status sync back:** trigger on a GitHub webhook (see §3) that fires
  when the spec's YAML `status` changes in a merged PR; transition the linked Jira issue to the
  matching status using the Jira REST API (`POST /rest/api/3/issue/{issueIdOrKey}/transitions`).
  This keeps Jira honest without anyone manually clicking through both tools.
- **Do not let Jira comments become a second spec.** If a reviewer wants to change acceptance
  criteria or guardrails, that's a PR comment on the spec file, not a Jira comment — otherwise you
  get two sources of truth that drift.

## 2. Claude AI services: reading and updating the spec

Give Claude an explicit, repo-level instruction so any session — human-started or
trigger-started — knows the contract before it touches code. Add this to a root `CLAUDE.md` (create
one if it doesn't exist):

```md
## Spec Driven Development

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
```

Two ways to invoke Claude against a spec, both consuming the same file:

- **Triggered session (Claude Code Remote):** create a trigger that fires from the Jira webhook in
  §1 (or from a GitHub `repository_dispatch` event), with a prompt that names the spec explicitly
  rather than assuming Claude will find it:
  > "Implement `docs/specs/2026-07-05-save-packs.md` (spec ID SDD-2026-001), status
  > `ready-for-build`. Read the full spec first, including guardrails and open questions, before
  > writing any code. Open a PR referencing the spec ID when acceptance criteria are implemented
  > and tested."
- **GitHub Action (`claude-code-action` or equivalent):** for smaller, reactive work — responding
  to review comments, autofixing a failed check — run Claude in CI scoped to the PR, with the same
  "read the spec before acting" instruction baked into the workflow's prompt, not just relying on
  `CLAUDE.md` being picked up.

Either way, the spec's YAML is the thing Claude should be able to parse deterministically (field
names, `status` enum, `acceptance_criteria[].id`) — keep it valid YAML with the exact schema in the
template so tooling (Claude included) doesn't have to guess field meaning from prose.

## 3. GitHub: enforcement and traceability

GitHub is where the spec becomes a mechanical gate, not just a convention.

- **Branch naming carries the spec ID:** `spec/SDD-2026-001-save-packs`. This lets any workflow
  extract the spec ID from `github.head_ref` without parsing the PR body.
- **PR template** (`.github/pull_request_template.md`) should require:
  ```md
  - Spec: docs/specs/<file>.md (Spec ID: SDD-YYYY-NNN)
  - Acceptance criteria implemented: AC1, AC3, ...
  - Tests added/updated: <paths>
  - Deviations from approved spec: <none, or explain + link decision log entry>
  ```
- **A `validate-spec` GitHub Actions job** that runs on every PR touching `docs/specs/**` or
  application code, and fails the PR if:
  - The PR body or branch name doesn't contain a `spec_id` matching a file under `docs/specs/`.
  - The paired `.yaml` doesn't parse, or doesn't match the schema (validate with a small script —
    `js-yaml` or `pyyaml` plus a JSON Schema check).
  - Any `acceptance_criteria[].id` has zero entries in `tests` referencing it.
  - The PR is targeting `main` while `release_checklist.tests_passing` is `false`, if the spec's
    `status` is `validation` or later.

  Minimal example:
  ```yaml
  name: validate-spec
  on:
    pull_request:
      paths: ["docs/specs/**", "src/**", "server/**"]
  jobs:
    validate:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - run: |
            SPEC_YAML=$(git diff --name-only origin/main... | grep -E 'docs/specs/.*\.yaml' | head -n1)
            test -n "$SPEC_YAML" || { echo "No spec YAML changed or referenced"; exit 1; }
            node scripts/validate-spec.js "$SPEC_YAML"
  ```
- **Branch protection** requires `validate-spec` (and your normal test suite) to pass before
  merge — this is what turns "the spec says tests must pass" into something that actually blocks a
  merge instead of relying on reviewer memory.
- **CODEOWNERS** should route changes to spec sections 1–3 to product/design/architecture owners,
  and changes to sections 4–6 to engineering, so a spec edit gets reviewed by the same person who
  owns that section in real life.
- **Webhook back to Jira:** on `pull_request.closed` (merged) touching a spec YAML, read the new
  `status` value and call the Jira REST API to transition the linked issue (matched via `spec_id`
  → `Spec ID` custom field) — this is the other half of the Jira sync loop in §1.

## 4. Railway: deployment as a spec-respecting gate, not just a deploy button

Railway doesn't read the spec directly, so translate its rollout/guardrail fields into Railway
configuration explicitly:

- **Map `architecture.rollout.stages` to Railway environments.** If the spec lists `Internal
  validation → Limited teacher trial → General availability`, create matching Railway environments
  (e.g. `staging`, `trial`, `production`) rather than deploying every merge straight to production.
- **Gate production deploys on the spec's release checklist.** Use a GitHub Actions
  `environment: production` with required reviewers, and only call
  `railway up --environment production --service <service>` (via the Railway CLI or GitHub
  integration) from a job that first checks the merged spec YAML has
  `release_checklist.tests_passing: true` and `release_checklist.rollback_ready: true`. Don't rely
  on Railway's default auto-deploy-on-push for anything above the `staging` environment.
- **Persistent storage guardrail is a CI check, not a comment.** If the spec's guardrails include
  something like `railway_storage: production data must use the configured persistent volume`,
  add a CI step (or a startup assertion in the app) that fails if the configured data path isn't
  under the mounted volume path — catching an "it worked locally with SQLite in the container"
  regression before it reaches Railway.
- **New environment variables named in the spec must exist in Railway before deploy.** Add a CI
  check that diffs the spec's `architecture.api_changes` / guardrails against
  `railway variables --environment <env>` (via the Railway CLI, using a read-only token) and fails
  loudly if a variable the spec requires is missing, rather than failing at runtime.
- **Rollback trigger maps to Railway's rollback feature.** Document the exact mechanism in the
  spec's `rollout.rollback_trigger`, and in practice that means: use Railway's dashboard "Redeploy"
  on the previous successful deployment, or `railway rollback` via CLI — write the actual command
  in a runbook linked from the spec so an on-call engineer isn't guessing during an incident.
- **Observability the spec calls for should be visible where Railway surfaces it.** Point the
  spec's `observability.logs` / `metrics` events at whatever Railway forwards to (its own log
  viewer, or a webhook/OpenTelemetry sink) so "we said we'd log saved_pack_create_failure" is
  checkable in production, not just in code review.

## Recommended YAML additions

Add an `automation` block to the YAML template so the fields each tool needs are explicit and
reviewable, instead of living only in Jira/Railway UI configuration that nobody checks into git:

```yaml
automation:
  jira_key: <e.g. LMS-123>
  github:
    branch: spec/SDD-YYYY-NNN-short-name
    required_checks:
      - validate-spec
  railway:
    environments:
      - name: staging
        maps_to_stage: <rollout stage name>
      - name: production
        maps_to_stage: <rollout stage name>
    volumes:
      - <mount path referenced in guardrails>
    rollback_command: railway rollback --environment production
```

## Applying this to the saved-packs example

| Tool | What it reads from `SDD-2026-001` | What it does with it |
| --- | --- | --- |
| Jira | `spec_id`, `status: draft` → later `ready-for-build` | Ticket `Spec ID` field set to `SDD-2026-001`; transition to "Ready for Build" fires the GitHub `repository_dispatch` webhook |
| Claude | `docs/specs/example-save-packs.md` + `.yaml`, guardrail "do not send saved-pack contents to AI review unless explicitly requested" | Reads both files first, implements `TASK1`-`TASK4`, opens a PR on `spec/SDD-2026-001-save-packs` referencing the spec ID, updates `tests[].status` |
| GitHub | Branch name, PR body, `acceptance_criteria` vs `tests` | `validate-spec` blocks merge if any of AC1-AC5 lack a test; CODEOWNERS routes architecture-section edits to the tech lead |
| Railway | `rollout.stages`, `guardrails.railway_storage` | `staging` environment auto-deploys from the PR branch; `production` deploy requires `release_checklist.tests_passing` and a manual approval gate; persistent-volume check runs in CI before either deploy |

## Recap checklist

- [ ] `Spec ID` and `Spec path` custom fields exist on the Jira issue type, and the "Ready for
      Build" transition fires a webhook carrying `spec_id`.
- [ ] A GitHub webhook (or reverse Jira automation) syncs the spec's YAML `status` back to the
      linked Jira ticket on merge.
- [ ] A root `CLAUDE.md` (or equivalent instruction) tells any Claude session to read the spec
      before acting, reference the spec ID in commits/PRs, and update `tests[].status` /
      `release_checklist` as it works.
- [ ] Branch names and PR templates carry the spec ID; a `validate-spec` GitHub Actions job blocks
      merge on missing spec references, invalid YAML, or uncovered acceptance criteria.
- [ ] Railway environments map to the spec's `rollout.stages`; production deploys are gated on
      `release_checklist`, not on auto-deploy-on-push.
- [ ] Guardrails naming persistent storage or required environment variables are checked in CI
      against actual Railway configuration, not just written in prose.
