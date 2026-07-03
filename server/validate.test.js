import { describe, test, expect } from 'vitest';
import { validatePack, isHttpUrl } from './validate.js';

describe('isHttpUrl', () => {
  test('accepts http/https, rejects other schemes', () => {
    expect(isHttpUrl('https://example.com/x')).toBe(true);
    expect(isHttpUrl('http://example.com')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('ftp://example.com')).toBe(false);
    expect(isHttpUrl('not a url')).toBe(false);
  });
});

describe('validatePack', () => {
  test('normalises a valid pack and defaults item title to href', () => {
    const { errors, pack } = validatePack({
      title: '  Photosynthesis pack ',
      items: [
        { type: 'url', href: 'https://bbc.co.uk/bitesize', title: '  BBC Bitesize ' },
        { type: 'url', href: 'https://example.com/quiz' },
      ],
    });
    expect(errors).toHaveLength(0);
    expect(pack.title).toBe('Photosynthesis pack');
    expect(pack.items[0].title).toBe('BBC Bitesize');
    expect(pack.items[1].title).toBe('https://example.com/quiz'); // falls back to href
  });

  test('rejects a missing title and empty items', () => {
    const { errors } = validatePack({ title: '', items: [] });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  test('rejects non-http URLs and non-url item types', () => {
    const { errors } = validatePack({
      title: 'Bad',
      items: [
        { type: 'url', href: 'javascript:alert(1)' },
        { type: 'file', href: 'https://example.com' },
      ],
    });
    expect(errors.some((e) => /valid http/.test(e))).toBe(true);
    expect(errors.some((e) => /only URL items/.test(e))).toBe(true);
  });
});
