import { afterEach, describe, expect, test, vi } from 'vitest';
import { reviewDraftPack } from './api';

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
