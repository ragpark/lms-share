import { describe, expect, test, vi } from 'vitest';
import { handleReviewDraft } from './reviewDraftRoute.js';

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

describe('POST /api/packs/review-draft handler', () => {
  test('returns validation errors as 400 without calling AI', async () => {
    const res = mockResponse();
    const review = vi.fn();
    await handleReviewDraft({ body: { title: '', items: [] } }, res, review);
    expect(res.statusCode).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(review).not.toHaveBeenCalled();
  });

  test('returns 503 when AI review is not configured', async () => {
    const res = mockResponse();
    const err = new Error('AI review is not configured.');
    err.status = 503;
    await handleReviewDraft({ body: { title: 'Pack', items: [{ type: 'url', href: 'https://example.com', title: 'Step' }] } }, res, async () => { throw err; });
    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: 'AI review is not configured.' });
  });

  test('returns structured review JSON for a valid draft and does not persist', async () => {
    const res = mockResponse();
    await handleReviewDraft({ body: { title: 'Pack', items: [{ type: 'url', href: 'https://example.com', title: 'Step' }] } }, res, async (pack) => ({ summary: `Reviewed ${pack.items.length} step`, limitations: ['Metadata only.'] }));
    expect(res.statusCode).toBe(200);
    expect(res.body.summary).toBe('Reviewed 1 step');
  });
});
