import { describe, expect, test, vi, beforeEach } from 'vitest';
import { createPacksRoutes } from './packsRoutes.js';

const OWNER = 'owner-token-aaaaaaaaaaaaaaaaa';
const OTHER_OWNER = 'owner-token-bbbbbbbbbbbbbbbbb';

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

function fakeStore() {
  return {
    insert: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    listByOwnerToken: vi.fn(),
  };
}

function reqWithAuth(token, rest = {}) {
  return { headers: token ? { authorization: `Bearer ${token}` } : {}, ...rest };
}

describe('POST /api/packs (createPack)', () => {
  let store;
  let routes;

  beforeEach(() => {
    store = fakeStore();
    routes = createPacksRoutes(store, () => {});
  });

  // AC1: a valid pack is stored and the teacher gets back an id + share URL.
  test('stores a valid pack with the caller owner token and returns 201', () => {
    store.insert.mockReturnValue({ id: 'abc123', createdAt: 1, updatedAt: 1 });
    const req = reqWithAuth(OWNER, { body: { title: 'Pack', items: [{ type: 'url', href: 'https://example.com', title: 'S' }] } });
    const res = mockResponse();

    routes.createPack(req, res);

    expect(store.insert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pack' }), OWNER);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 'abc123', url: '/pack/abc123' });
  });

  test('allows creating an unowned pack when no owner token is sent (backward compatible)', () => {
    store.insert.mockReturnValue({ id: 'abc123', createdAt: 1, updatedAt: 1 });
    const req = reqWithAuth(null, { body: { title: 'Pack', items: [{ type: 'url', href: 'https://example.com', title: 'S' }] } });
    const res = mockResponse();

    routes.createPack(req, res);

    expect(store.insert).toHaveBeenCalledWith(expect.anything(), null);
    expect(res.statusCode).toBe(201);
  });

  test('returns 400 validation errors without touching the store', () => {
    const req = reqWithAuth(OWNER, { body: { title: '', items: [] } });
    const res = mockResponse();

    routes.createPack(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(store.insert).not.toHaveBeenCalled();
  });
});

describe('PUT /api/packs/:id (updatePack)', () => {
  let store;
  let routes;

  beforeEach(() => {
    store = fakeStore();
    routes = createPacksRoutes(store, () => {});
  });

  test('rejects with 403 when no owner token is provided', () => {
    const req = reqWithAuth(null, { params: { id: 'abc123' }, body: { title: 'New', items: [] } });
    const res = mockResponse();

    routes.updatePack(req, res);

    expect(res.statusCode).toBe(403);
    expect(store.getById).not.toHaveBeenCalled();
  });

  test('returns 404 when the pack does not exist', () => {
    store.getById.mockReturnValue(null);
    const req = reqWithAuth(OWNER, { params: { id: 'missing' }, body: { title: 'New', items: [] } });
    const res = mockResponse();

    routes.updatePack(req, res);

    expect(res.statusCode).toBe(404);
  });

  // Security guardrail: a teacher must not be able to edit another teacher's saved pack.
  test('returns 403 when the owner token does not match the pack', () => {
    store.getById.mockReturnValue({ id: 'abc123', title: 'Old', items: [], ownerToken: OTHER_OWNER });
    const req = reqWithAuth(OWNER, { params: { id: 'abc123' }, body: { title: 'New', items: [] } });
    const res = mockResponse();

    routes.updatePack(req, res);

    expect(res.statusCode).toBe(403);
    expect(store.update).not.toHaveBeenCalled();
  });

  // AC3: editing a saved pack updates it in place and reflects the latest changes.
  test('updates the pack in place and returns the same id/url when the owner matches', () => {
    store.getById.mockReturnValue({ id: 'abc123', title: 'Old', items: [], ownerToken: OWNER });
    store.update.mockReturnValue({ updatedAt: 42 });
    const req = reqWithAuth(OWNER, {
      params: { id: 'abc123' },
      body: { title: 'New title', items: [{ type: 'url', href: 'https://example.com', title: 'S' }] },
    });
    const res = mockResponse();

    routes.updatePack(req, res);

    expect(store.update).toHaveBeenCalledWith('abc123', expect.objectContaining({ title: 'New title' }));
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ id: 'abc123', title: 'New title', updatedAt: 42, url: '/pack/abc123' });
  });

  test('returns 400 validation errors for the update body', () => {
    store.getById.mockReturnValue({ id: 'abc123', title: 'Old', items: [], ownerToken: OWNER });
    const req = reqWithAuth(OWNER, { params: { id: 'abc123' }, body: { title: '', items: [] } });
    const res = mockResponse();

    routes.updatePack(req, res);

    expect(res.statusCode).toBe(400);
    expect(store.update).not.toHaveBeenCalled();
  });
});

describe('GET /api/packs/:id (getPack)', () => {
  test('never includes the owner token in the public share-view response', () => {
    const store = fakeStore();
    store.getById.mockReturnValue({ id: 'abc123', title: 'Pack', items: [], createdAt: 1, updatedAt: 1, ownerToken: OWNER });
    const routes = createPacksRoutes(store, () => {});
    const res = mockResponse();

    routes.getPack({ params: { id: 'abc123' } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toHaveProperty('ownerToken');
    expect(res.body).not.toHaveProperty('owner_token');
  });

  test('returns 404 for a missing pack', () => {
    const store = fakeStore();
    store.getById.mockReturnValue(null);
    const routes = createPacksRoutes(store, () => {});
    const res = mockResponse();

    routes.getPack({ params: { id: 'missing' } }, res);

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/my-packs (listMyPacks)', () => {
  test('returns 401 without a valid owner token', () => {
    const store = fakeStore();
    const routes = createPacksRoutes(store, () => {});
    const req = reqWithAuth(null);
    const res = mockResponse();

    routes.listMyPacks(req, res);

    expect(res.statusCode).toBe(401);
    expect(store.listByOwnerToken).not.toHaveBeenCalled();
  });

  // AC2: the teacher sees their saved packs with enough info to choose the right one.
  test('scopes the list to the caller owner token and includes a share url per pack', () => {
    const store = fakeStore();
    store.listByOwnerToken.mockReturnValue([
      { id: 'abc123', title: 'Photosynthesis', itemCount: 3, createdAt: 1, updatedAt: 2 },
    ]);
    const routes = createPacksRoutes(store, () => {});
    const req = reqWithAuth(OWNER);
    const res = mockResponse();

    routes.listMyPacks(req, res);

    expect(store.listByOwnerToken).toHaveBeenCalledWith(OWNER);
    expect(res.statusCode).toBe(200);
    expect(res.body.packs).toEqual([
      { id: 'abc123', title: 'Photosynthesis', itemCount: 3, createdAt: 1, updatedAt: 2, url: '/pack/abc123' },
    ]);
  });
});
