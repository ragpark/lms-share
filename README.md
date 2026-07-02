# LMS Share — Google Classroom & Microsoft Teams

Drop-in React components that let a teacher share a resource or assessment from your
platform into **Google Classroom** or **Microsoft Teams for Education**, plus a small
dev harness for testing against real sandbox tenants.

This is the **link-sharing tier**: no OAuth app registration, no admin consent, no
Classroom/Graph API keys. It shares a link (optionally pre-filling an assignment). It
does **not** pass grades back — that needs the server-side Classroom CourseWork API /
Graph `educationAssignment` integrations, which are a separate, heavier build.

## Contents

| File | What it is |
|------|-----------|
| `src/ShareToClass.jsx` | Combined control + `ShareToGoogleClassroom` / `ShareToTeams` named exports, and the vendor script loaders. |
| `src/ResourceShareMenu.jsx` | Deferred per-row "Assign ▾" menu + `toShareResource()` mapping, for dynamic per-course lists. |
| `src/ShareToClass.test.jsx` | Vitest + React Testing Library suite (mocks the vendor globals). |
| `src/App.jsx` | Dev harness: direct buttons + a mock course resource list. |

## Quick start (local)

Requires Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # run the unit tests once
```

> ⚠️ The Google (`platform.js`) and Teams (`launcher.js`) scripts require **https** and
> will not initialise on `http://localhost`. The buttons render, but the share flow only
> works from an https origin — so do manual testing on the Railway URL below, not locally.

## Add to a GitHub repo

```bash
cd lms-share
git init
git add .
git commit -m "LMS share: Classroom + Teams components, tests, dev harness"

# with the GitHub CLI:
gh repo create lms-share --private --source=. --push

# or manually: create an empty repo on github.com, then:
git remote add origin git@github.com:<you>/lms-share.git
git branch -M main
git push -u origin main
```

## Deploy to Railway

Railway gives you an **automatic https URL** (`*.up.railway.app`) — which is exactly what
the vendor scripts need, so this is the fastest way to get a testable environment.

**Option A — from GitHub (recommended):**
1. railway.com → **New Project** → **Deploy from GitHub repo** → pick `lms-share`.
2. Railway builds via Railpack: `npm install` → `npm run build`, then serves the built
   `dist/` with the start command in `railway.json` (`serve -s dist -l $PORT`).
3. Under the service → **Settings → Networking → Generate Domain** to get your https URL.
4. Push to `main` → Railway redeploys automatically.

**Option B — from the CLI:**
```bash
npm i -g @railway/cli
railway login
railway init            # name the project
railway up              # build + deploy from the current directory
railway domain          # generate the public https URL
```

### Why the explicit start command?

Vite is a build tool, not a server. On Railway the common failure is *"No start command
could be found"*, or an accidental dev server. This repo pins a real static server:

- `package.json` → `"start": "serve -s dist -l ${PORT:-3000}"` (`-s` gives SPA fallback,
  `$PORT` is provided by Railway).
- `railway.json` → `startCommand: "npm run start"` (runs via npm so `serve` is on `PATH`).

Don't swap this for `vite preview` or `vite` — those are development servers and will cost
you resources on Railway.

## Wire it into your platform

Copy `src/ShareToClass.jsx` and `src/ResourceShareMenu.jsx` into your app, then:

```jsx
import ResourceShareMenu, { toShareResource } from './ResourceShareMenu';

// inside your per-course resource list:
{resources.map((r) => (
  <li key={r.id}>
    <span>{r.title}</span>
    <ResourceShareMenu resource={toShareResource(r, course)} />
  </li>
))}
```

Adjust `toShareResource()` to your data model (it's the only bit you customise). For short
lists you can render `<ShareToClass resource={...} />` inline instead of the deferred menu.

## Manual test checklist (needs sandbox tenants)

- **Google**: test Google Workspace for Education domain, Classroom on, a course with a
  test teacher + student. Share → sign in → course picker → posts as an assignment with
  your title/body pre-filled → confirm it lands in Classwork.
- **Teams**: Microsoft 365 Education sandbox, classes provisioned via School Data Sync so
  the teacher **has associated classes** (or "Create an Assignment" won't appear). Desktop
  Edge/Chrome only. Share → pick team → post to channel, and → Create an Assignment.
- **Fallback**: block the vendor script in DevTools → the "Open resource" link should show.
- **List/SPA**: navigate between courses, open several menus, check the Network tab —
  `platform.js` and `launcher.js` should each load exactly once.

## Notes

- Google `itemType` can be `assignment` (default), `announcement`, `material`, or `question`.
- Teams share is desktop Edge/Chrome only; no guest/freemium accounts.
- When you're ready for grades in the gradebook, this is the layer you upgrade: Classroom
  CourseWork API + Graph assignment/submission, with the one-time admin consent.
