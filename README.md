# LMS Share — Google Classroom & Microsoft Teams, with Lesson Packs

Teachers assemble a **sequence of links** into a lesson pack; the pack resolves to a single
URL that they share into **Google Classroom** or **Microsoft Teams for Education** using the
built-in share buttons.

- **Builder** (`/`) — title the pack, add/reorder link steps, optionally request an advisory Phase 1 AI review, create it, share the URL.
- **Viewer** (`/pack/:id`) — a step-through player for students; the single shareable link.
- **Share** — `ShareToClass` (Classroom + Teams) surfaces automatically once a pack is created.
- **Browser extension** (`extension/`) — Chrome/Edge helper that sends the current tab URL into
  the Builder using `?addUrl=...&addTitle=...`.

This version supports **URL items only** (file upload is a later step). Sharing is still the
link tier — no grade passback yet.

## Architecture

A single Express service:

- serves the built React SPA (`dist/`),
- exposes a small JSON API (`POST /api/packs`, `POST /api/packs/review-draft`, `GET /api/packs/:id`),
- persists packs in **SQLite via Node's built-in `node:sqlite`** — a file on a mounted volume.

```
server/
  index.js        Express: pack API + AI draft review route + SQLite + static SPA serving
  aiReview.js     Server-side OpenAI draft lesson-pack review helper
  validate.js     Pure pack validation (http(s) only, caps) — unit-tested
src/
  PackBuilder.jsx Build + create + share
  PackViewer.jsx  Resolve + step through
  ShareToClass.jsx / ResourceShareMenu.jsx   (unchanged share components)
  api.js          fetch helpers
extension/
  manifest.json   Chrome/Edge Manifest V3 extension
  popup.*         Reads the active tab and opens the Builder with addUrl/addTitle params
```

> **Why `node:sqlite` and Node 22?** It's SQLite without a native module — no compile step,
> no prebuilt-binary lottery on deploy. It's still marked experimental in Node 22, hence the
> `--experimental-sqlite` flag in the scripts and the pinned Node version. On Node 24 it's
> stable and the flag can be dropped. If you'd rather use a non-experimental library, swap in
> `better-sqlite3` (it compiles fine on Railway); the `server/index.js` API calls line up closely.

## Local development

Requires Node 22 (`.nvmrc` provided).

```bash
npm install
npm run dev     # Vite on :5173, API on :8787 (Vite proxies /api → the server)
npm test        # frontend + server validation tests
```

> ⚠️ The Google/Teams share scripts require **https** and won't initialise on
> `http://localhost`. The pack builder/viewer work locally; test the *share* step on the
> deployed Railway URL.

## Phase 1 AI lesson-pack review

The Builder includes an optional teacher-facing **Review lesson with AI** button. It reviews a
draft before the pack is created and returns structured advice on likely lesson structure, best
suited learner type, pedagogical approach, metacognitive support, strengths, risks/gaps,
suggested improvements, per-step notes, and limitations.

Phase 1 is deliberately metadata-only: the server sends the pack title, ordered step titles,
pupil instructions, durations, resource URLs, and extracted URL domains to the AI provider. It
**does not fetch, scrape, crawl, or inspect actual web page contents**, and the review is worded
as inference from teacher-entered metadata and URL/domain signals. The review is advisory; the
teacher remains responsible for checking resources and deciding whether to change the pack.
Review results are not persisted to SQLite and normal pack creation is not blocked if review
fails.

Configuration:

- `OPENAI_API_KEY` enables the AI review endpoint. If it is missing, `/api/packs/review-draft`
  returns `503 { error: "AI review is not configured." }`, and teachers can still create packs.
- `OPENAI_MODEL` optionally chooses the model; the server defaults to `gpt-4o-mini`.

Privacy/safety: URLs and teacher-entered metadata may be sent to the configured AI provider when
a teacher clicks the review button. Do not put sensitive pupil data in pack titles, step titles,
or pupil instructions.

## Chrome / Edge extension

The `extension/` directory contains an unpacked Manifest V3 extension that helps teachers add
the current browser tab to a pack:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select the `extension/` directory.
4. Start the app with `npm run dev`.
5. Visit an `http(s)` page, click the LMS Share toolbar button, then choose **Add to Lesson Pack**.

The extension opens the Builder with `addUrl` and `addTitle` query parameters. `PackBuilder`
prefills the draft step, removes those query parameters from the address bar, and waits for
the teacher to review and add the step before creating a pack.

Before publishing the extension, update `APP_BASE_URL` in `extension/popup.js` from the local
dev server to the deployed LMS Share origin.

## Add to a GitHub repo

```bash
git init && git add . && git commit -m "Lesson packs: URL sequences resolving to one shareable link"
gh repo create lms-share --private --source=. --push
# or: git remote add origin git@github.com:<you>/lms-share.git && git push -u origin main
```

## Deploy to Railway

Railway builds with Railpack: `npm install` → `npm run build`, then starts with
`npm run start` (`node --experimental-sqlite server/index.js`), which serves both the SPA and
the API on `$PORT`. You get an automatic **https** `*.up.railway.app` domain — which the share
scripts need.

**⚠️ Add a volume, or packs vanish on every redeploy.** SQLite writes to a file; without a
persistent volume that file lives in the ephemeral container.

1. New Project → **Deploy from GitHub repo** → pick `lms-share`.
2. Service → **Settings → Volumes → Add Volume**, mount path `/data`.
3. Service → **Variables** → add `DATA_DIR=/data`.
4. Service → **Settings → Networking → Generate Domain**.
5. Push to `main` → auto-redeploys, and the pack database survives because it lives on `/data`.

CLI equivalent:
```bash
npm i -g @railway/cli
railway login && railway init
railway volume add --mount-path /data     # then set DATA_DIR=/data in the dashboard/variables
railway up
railway domain
```

## API

| Method | Route | Body / result |
|--------|-------|---------------|
| `POST` | `/api/packs` | `{ title, items: [{ type:'url', href, title, instruction, duration }] }` → `201 { id, url }` |
| `POST` | `/api/packs/review-draft` | Same draft shape as pack creation → structured advisory AI review; does not persist |
| `GET`  | `/api/packs/:id` | `200 { id, title, items, createdAt }` or `404` |

Validation (in `server/validate.js`): title required, ≤ 50 items, each item must be a valid
`http(s)` URL. Non-http schemes (e.g. `javascript:`) are rejected.

## Spec Driven Development

Future product, design, architecture, engineering, testing, and release guardrails can be coordinated through the Spec Driven Development playbook in `docs/spec-driven-development.md`. Start each meaningful change with a spec in `docs/specs/`, move it through product, design, architecture, build, validation, and release stages, and map acceptance criteria directly to tests before implementation.

- **Non-technical product owner starting a new idea?** Follow
  [`docs/starting-a-feature-as-a-product-owner.md`](docs/starting-a-feature-as-a-product-owner.md)
  for step-by-step instructions on writing a feature development intent — no code, no technical
  detail required.
- **UX designer picking up a spec from product?** Follow
  [`docs/designing-a-feature-as-a-ux-designer.md`](docs/designing-a-feature-as-a-ux-designer.md)
  for step-by-step instructions on turning the approved product brief into user journeys, UI
  states, content, and accessibility requirements — no code required.
- **Architect or tech lead picking up a spec from product and design?** Follow
  [`docs/architecting-a-feature-as-an-architect.md`](docs/architecting-a-feature-as-an-architect.md)
  for step-by-step instructions on turning the approved product brief and design section into API,
  data, security, observability, and rollout decisions — no code required.
- **Want a finished example?** [`docs/specs/example-save-packs.md`](docs/specs/example-save-packs.md)
  (with a matching [`docs/specs/example-save-packs.yaml`](docs/specs/example-save-packs.yaml)) is a
  fully worked spec for letting a teacher save a lesson pack, from product intent through
  architecture and acceptance criteria.

## Notes & guardrails

- The viewer is a **launch-list**, not an iframe embed. Most sites block being framed
  (`X-Frame-Options` / CSP `frame-ancestors`), and that's enforced by the browser on the
  destination's instruction — it can't be overridden from our side — so each step opens in a
  new tab. Per-step progress is tracked in `localStorage`. (Optional future upgrade: a
  server-side header probe at create time to inline-embed only the subset of URLs that permit
  framing; note the SSRF considerations before adding server-side fetches of arbitrary URLs.)
- URL-only for now — `type:'file'` is reserved in the model for when uploads are added
  (that step needs blob storage on the volume + upload handling).
- Grade passback remains the later upgrade (Classroom CourseWork API / Graph assignments).
