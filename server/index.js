import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { createPacksStore } from './packsStore.js';
import { createPacksRoutes } from './packsRoutes.js';
import { handleReviewDraft } from './reviewDraftRoute.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Persist to a Railway volume in production (set DATA_DIR=/data + mount a volume),
// or ./data locally. Without a volume on Railway the SQLite file is EPHEMERAL.
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const store = createPacksStore(path.join(DATA_DIR, 'packs.db'));
const packsRoutes = createPacksRoutes(store);

const app = express();
app.use(express.json({ limit: '256kb' }));

// --- API ---------------------------------------------------------------
app.post('/api/packs', packsRoutes.createPack);
app.put('/api/packs/:id', packsRoutes.updatePack);
app.get('/api/my-packs', packsRoutes.listMyPacks);
app.post('/api/packs/review-draft', handleReviewDraft);
app.get('/api/packs/:id', packsRoutes.getPack);

// Unknown API routes → JSON 404 (so they don't fall through to the SPA).
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// --- Static SPA + client-side routing fallback -------------------------
const dist = path.join(ROOT, 'dist');
app.use(express.static(dist));
app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`lms-share listening on :${port} (data: ${DATA_DIR})`));
