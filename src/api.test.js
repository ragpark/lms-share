import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { reviewDraftPack, createPack, updatePack, fetchMyPacks } from './api';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('reviewDraftPack API helper', () => {
  test('returns parsed review JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ summary: 'Reviewed' }), { status: 200 })));

    await expect(reviewDraftPack({ title: 'Pack', items: [] })).resolves.toEqual({ summary: 'Reviewed' });
  });

  test('uses backend error messages when available', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'AI review is not configured.' }), { status: 503 })));

    await expect(reviewDraftPack({ title: 'Pack', items: [] })).rejects.toThrow('AI review is not configured.');
  });

  test('does not expose raw Response.json empty-body errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));

    await expect(reviewDraftPack({ title: 'Pack', items: [] })).rejects.toThrow('AI review did not return a usable response. Please try again.');
  });
});

describe('createPack API helper', () => {
  test('sends the browser owner token as a bearer credential and mints one if none exists yet', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'abc123', url: '/pack/abc123' }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createPack({ title: 'Pack', items: [] })).resolves.toEqual({ id: 'abc123', url: '/pack/abc123' });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toMatch(/^Bearer .{16,}$/);
    expect(localStorage.getItem('lms-share:owner-token')).toBeTruthy();
  });

  test('reuses the same owner token across calls', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'abc123', url: '/pack/abc123' }), { status: 201 })));

    await createPack({ title: 'Pack', items: [] });
    await createPack({ title: 'Pack 2', items: [] });

    const calls = vi.mocked(fetch).mock.calls;
    expect(calls[0][1].headers.Authorization).toBe(calls[1][1].headers.Authorization);
  });
});

describe('updatePack API helper', () => {
  test('PUTs to /api/packs/:id with the owner token and returns updated metadata', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'abc123', title: 'New', items: [], updatedAt: 42, url: '/pack/abc123' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updatePack('abc123', { title: 'New', items: [] })).resolves.toMatchObject({ title: 'New', updatedAt: 42 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/packs/abc123');
    expect(options.method).toBe('PUT');
    expect(options.headers.Authorization).toMatch(/^Bearer .+$/);
  });

  test('surfaces a permission error when the owner token does not match', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'You do not have permission to edit this pack.' }), { status: 403 })));

    await expect(updatePack('abc123', { title: 'New', items: [] })).rejects.toThrow('You do not have permission to edit this pack.');
  });
});

describe('fetchMyPacks API helper', () => {
  test('GETs /api/my-packs with the owner token and returns the pack list', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ packs: [{ id: 'abc123', title: 'Pack' }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchMyPacks()).resolves.toEqual({ packs: [{ id: 'abc123', title: 'Pack' }] });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/my-packs');
    expect(options.headers.Authorization).toMatch(/^Bearer .+$/);
  });

  test('surfaces a sign-in style error on 401', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'A valid owner token is required to view saved packs.' }), { status: 401 })));

    await expect(fetchMyPacks()).rejects.toThrow('A valid owner token is required to view saved packs.');
  });
});
