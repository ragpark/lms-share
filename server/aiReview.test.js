import { describe, expect, test } from 'vitest';
import { buildDraftReviewPrompt, extractDomain, reviewDraftPack } from './aiReview.js';

const pack = {
  title: 'Photosynthesis revision',
  items: [{ type: 'url', href: 'https://www.example.com/quiz', title: 'Retrieval quiz', instruction: 'Try first, then check.', duration: '10 mins' }],
};

describe('AI review helper', () => {
  test('extracts domains without fetching URL content', () => {
    expect(extractDomain('https://www.bbc.co.uk/bitesize')).toBe('bbc.co.uk');
  });

  test('builds a metadata-only prompt with explicit URL-content limitation', () => {
    const prompt = buildDraftReviewPrompt(pack);
    expect(prompt).toContain('Do not fetch, scrape, crawl, open, or claim to inspect');
    expect(prompt).toContain('example.com');
    expect(prompt).toContain('Retrieval quiz');
  });

  test('throws a configured 503-style error when no API key is present', async () => {
    await expect(reviewDraftPack(pack, { apiKey: '', fetch: () => { throw new Error('should not call'); } })).rejects.toMatchObject({
      message: 'AI review is not configured.',
      status: 503,
    });
  });

  test('normalises a mocked OpenAI JSON response', async () => {
    const review = await reviewDraftPack(pack, {
      apiKey: 'test-key',
      fetch: async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: JSON.stringify({ summary: 'Looks coherent.', coherence: { rating: 'strong', comment: 'Clear sequence.' }, metacognition: { rating: 'moderate', comment: 'Some reflection.', missingPrompts: ['Add confidence check.'] }, limitations: [] }) } }] }),
      }),
    });
    expect(review.summary).toBe('Looks coherent.');
    expect(review.limitations[0]).toMatch(/not inspected/i);
  });
});
