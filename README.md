# LMS Share — Google Classroom & Microsoft Teams, with Lesson Packs

Teachers assemble a **sequence of links** into a lesson pack; the pack resolves to a single
URL that they share into **Google Classroom** or **Microsoft Teams for Education** using the
built-in share buttons.

- **Builder** (`/`) — title the pack, add/reorder link steps, create it, share the URL.
- **Viewer** (`/pack/:id`) — a step-through player for students; the single shareable link.
- **Share** — `ShareToClass` (Classroom + Teams) surfaces automatically once a pack is created.

This version supports **URL items only** (file upload is a later step). Sharing is still the
link tier — no grade passback yet.

## Architecture

A single Express service:

- serves the built React SPA (`dist/`),
- exposes a small JSON API (`POST /api/packs`, `GET /api/packs/:id`),
- persists packs in **SQLite via Node's built-in `node:sqlite`** — a file on a mounted volume.

```
server/
  index.js        Express: pack API + SQLite + static SPA serving
  validate.js     Pure pack validation (http(s) only, caps) — unit-tested
src/
  PackBuilder.jsx Build + create + share
  PackViewer.jsx  Resolve + step through
  ShareToClass.jsx / ResourceShareMenu.jsx   (unchanged share components)
  api.js          fetch helpers
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
| `POST` | `/api/packs` | `{ title, items: [{ type:'url', href, title }] }` → `201 { id, url }` |
| `GET`  | `/api/packs/:id` | `200 { id, title, items, createdAt }` or `404` |

Validation (in `server/validate.js`): title required, ≤ 50 items, each item must be a valid
`http(s)` URL. Non-http schemes (e.g. `javascript:`) are rejected.

## Notes & guardrails

- The viewer embeds each URL in a **sandboxed iframe**; many sites refuse to be framed
  (`X-Frame-Options`/CSP), so every step also has a guaranteed **Open in new tab** link.
- URL-only for now — `type:'file'` is reserved in the model for when uploads are added
  (that step needs blob storage on the volume + upload handling).
- Grade passback remains the later upgrade (Classroom CourseWork API / Graph assignments).
