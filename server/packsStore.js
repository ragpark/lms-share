// SQLite-backed persistence for packs, isolated from Express so it can be
// unit-tested against a throwaway file and swapped for a fake store in route tests.
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';

// node:sqlite is experimental and prefix-only (see README); loaded via createRequire
// so Vite/vitest's static import analysis (which predates this builtin) doesn't
// mis-resolve it as a regular package during tests.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

export const shortId = () => randomBytes(6).toString('base64url'); // ~8 url-safe chars

export function createPacksStore(dbPath) {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS packs (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      items      TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Additive migration for pre-existing databases (SDD-2026-001): owner_token stays
  // NULL on legacy rows so their share URLs keep working; they just won't appear
  // in anyone's My packs list.
  const columns = db.prepare('PRAGMA table_info(packs)').all().map((c) => c.name);
  if (!columns.includes('owner_token')) db.exec('ALTER TABLE packs ADD COLUMN owner_token TEXT;');
  if (!columns.includes('updated_at')) db.exec('ALTER TABLE packs ADD COLUMN updated_at INTEGER;');

  const insertStmt = db.prepare('INSERT INTO packs (id, title, items, created_at, updated_at, owner_token) VALUES (?, ?, ?, ?, ?, ?)');
  const selectByIdStmt = db.prepare('SELECT id, title, items, created_at, updated_at, owner_token FROM packs WHERE id = ?');
  const updateStmt = db.prepare('UPDATE packs SET title = ?, items = ?, updated_at = ? WHERE id = ?');
  const selectByOwnerStmt = db.prepare('SELECT id, title, items, created_at, updated_at FROM packs WHERE owner_token = ? ORDER BY updated_at DESC');

  const rowToPack = (row) => ({
    id: row.id,
    title: row.title,
    items: JSON.parse(row.items),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at ?? row.created_at),
    ownerToken: row.owner_token ?? null,
  });

  return {
    insert(pack, ownerToken) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const id = shortId();
        const now = Date.now();
        try {
          insertStmt.run(id, pack.title, JSON.stringify(pack.items), now, now, ownerToken || null);
          return { id, createdAt: now, updatedAt: now };
        } catch (err) {
          if (!/UNIQUE/.test(String(err))) throw err; // collision → retry
        }
      }
      return null;
    },

    getById(id) {
      const row = selectByIdStmt.get(id);
      return row ? rowToPack(row) : null;
    },

    update(id, pack) {
      const updatedAt = Date.now();
      updateStmt.run(pack.title, JSON.stringify(pack.items), updatedAt, id);
      return { updatedAt };
    },

    listByOwnerToken(ownerToken) {
      return selectByOwnerStmt.all(ownerToken).map((row) => ({
        id: row.id,
        title: row.title,
        itemCount: JSON.parse(row.items).length,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at ?? row.created_at),
      }));
    },
  };
}
