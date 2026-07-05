import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { validatePack } from './validate.js';
import { handleReviewDraft } from './reviewDraftRoute.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Persist to a Railway volume in production (set DATA_DIR=/data + mount a volume),
// or ./data locally. Without a volume on Railway the SQLite file is EPHEMERAL.
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'packs.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec(`
  CREATE TABLE IF NOT EXISTS packs (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    items      TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

const insert = db.prepare('INSERT INTO packs (id, title, items, created_at) VALUES (?, ?, ?, ?)');
const selectById = db.prepare('SELECT id, title, items, created_at FROM packs WHERE id = ?');

const shortId = () => randomBytes(6).toString('base64url'); // ~8 url-safe chars

const app = express();
app.use(express.json({ limit: '256kb' }));

// --- API ---------------------------------------------------------------
app.post('/api/packs', (req, res) => {
  const { errors, pack } = validatePack(req.body);
  if (errors.length) return res.status(400).json({ errors });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = shortId();
    try {
      insert.run(id, pack.title, JSON.stringify(pack.items), Date.now());
      return res.status(201).json({ id, url: `/pack/${id}` });
    } catch (err) {
      if (!/UNIQUE/.test(String(err))) throw err; // collision → retry
    }
  }
  return res.status(500).json({ error: 'Could not allocate a pack id, please retry.' });
});

app.post('/api/packs/review-draft', handleReviewDraft);

app.get('/api/packs/:id', (req, res) => {
  const row = selectById.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Pack not found' });
  res.json({
    id: row.id,
    title: row.title,
    items: JSON.parse(row.items),
    createdAt: Number(row.created_at),
  });
});

// Unknown API routes → JSON 404 (so they don't fall through to the SPA).
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// --- Static SPA + client-side routing fallback -------------------------
const dist = path.join(ROOT, 'dist');
app.use(express.static(dist));
app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`lms-share listening on :${port} (data: ${DATA_DIR})`));
