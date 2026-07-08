import { describe, test, expect, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createPacksStore } from './packsStore.js';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

let dir;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

function tempDbPath() {
  dir = mkdtempSync(path.join(tmpdir(), 'packs-store-test-'));
  return path.join(dir, 'packs.db');
}

describe('createPacksStore', () => {
  test('inserts an owned pack and returns it via getById', () => {
    const store = createPacksStore(tempDbPath());
    const pack = { title: 'Photosynthesis', items: [{ type: 'url', href: 'https://example.com', title: 'Step' }] };

    const created = store.insert(pack, 'owner-token-1234567890ab');
    const row = store.getById(created.id);

    expect(row.title).toBe('Photosynthesis');
    expect(row.items).toEqual(pack.items);
    expect(row.ownerToken).toBe('owner-token-1234567890ab');
  });

  test('inserts an unowned pack when no owner token is given (legacy/anonymous save)', () => {
    const store = createPacksStore(tempDbPath());
    const created = store.insert({ title: 'Anon pack', items: [] }, null);
    const row = store.getById(created.id);
    expect(row.ownerToken).toBeNull();
  });

  test('update() changes title/items and bumps updatedAt without changing the id', () => {
    const store = createPacksStore(tempDbPath());
    const created = store.insert({ title: 'Old', items: [] }, 'owner-token-1234567890ab');

    const { updatedAt } = store.update(created.id, { title: 'New', items: [{ type: 'url', href: 'https://example.com', title: 'S' }] });
    const row = store.getById(created.id);

    expect(row.id).toBe(created.id);
    expect(row.title).toBe('New');
    expect(row.items).toHaveLength(1);
    expect(row.updatedAt).toBe(updatedAt);
  });

  test('listByOwnerToken only returns packs owned by that token, newest-updated first', () => {
    const store = createPacksStore(tempDbPath());
    const a = store.insert({ title: 'Mine 1', items: [] }, 'owner-aaaaaaaaaaaaaaaaaaaaaa');
    store.insert({ title: 'Someone else', items: [] }, 'owner-bbbbbbbbbbbbbbbbbbbbbb');
    const c = store.insert({ title: 'Mine 2', items: [{ type: 'url', href: 'https://example.com', title: 'S' }] }, 'owner-aaaaaaaaaaaaaaaaaaaaaa');

    store.update(a.id, { title: 'Mine 1 updated', items: [] }); // bump a's updatedAt after c was created

    const list = store.listByOwnerToken('owner-aaaaaaaaaaaaaaaaaaaaaa');
    expect(list.map((p) => p.title)).toEqual(['Mine 1 updated', 'Mine 2']);
    expect(list.find((p) => p.title === 'Mine 2').itemCount).toBe(1);
  });

  test('migrates a pre-existing database missing owner_token/updated_at without data loss', () => {
    const dbPath = tempDbPath();
    const legacyDb = new DatabaseSync(dbPath);
    legacyDb.exec(`
      CREATE TABLE packs (
        id         TEXT PRIMARY KEY,
        title      TEXT NOT NULL,
        items      TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    legacyDb.prepare('INSERT INTO packs (id, title, items, created_at) VALUES (?, ?, ?, ?)')
      .run('legacy1', 'Legacy pack', JSON.stringify([]), 1700000000000);
    legacyDb.close();

    const store = createPacksStore(dbPath);
    const row = store.getById('legacy1');

    expect(row.title).toBe('Legacy pack');
    expect(row.ownerToken).toBeNull(); // legacy rows are unowned but still readable
    expect(row.updatedAt).toBe(row.createdAt); // falls back to created_at
    expect(store.listByOwnerToken('any-owner-token-value12')).toEqual([]);
  });
});
