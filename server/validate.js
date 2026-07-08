// Pure validation for pack payloads — no DB, so it's unit-testable in isolation.

export const MAX_ITEMS = 50;
export const MAX_TITLE = 200;
export const MAX_INSTRUCTION = 500;
export const MAX_DURATION = 40;

// Owner tokens are minted client-side (see src/ownerToken.js) as base64url random bytes.
export const OWNER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export function isValidOwnerToken(token) {
  return typeof token === 'string' && OWNER_TOKEN_PATTERN.test(token);
}

export function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate and normalise an incoming pack.
 * @returns {{ errors: string[], pack: { title: string, items: Array<{type:'url',href:string,title:string,instruction?:string,duration?:string}> } }}
 */
export function validatePack(body) {
  const errors = [];
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!title) errors.push('A pack title is required.');
  if (title.length > MAX_TITLE) errors.push(`Title must be ${MAX_TITLE} characters or fewer.`);

  const raw = Array.isArray(body?.items) ? body.items : null;
  const items = [];
  if (!raw) {
    errors.push('items must be an array.');
  } else {
    if (raw.length === 0) errors.push('Add at least one item.');
    if (raw.length > MAX_ITEMS) errors.push(`A pack can hold at most ${MAX_ITEMS} items.`);
    raw.forEach((it, i) => {
      if (it?.type !== 'url') {
        errors.push(`Item ${i + 1}: only URL items are supported in this version.`);
        return;
      }
      if (!isHttpUrl(it.href)) {
        errors.push(`Item ${i + 1}: must be a valid http(s) URL.`);
        return;
      }
      const t = typeof it.title === 'string' ? it.title.trim().slice(0, MAX_TITLE) : '';
      const instruction = typeof it.instruction === 'string' ? it.instruction.trim().slice(0, MAX_INSTRUCTION) : '';
      const duration = typeof it.duration === 'string' ? it.duration.trim().slice(0, MAX_DURATION) : '';
      items.push({ type: 'url', href: it.href, title: t || it.href, ...(instruction && { instruction }), ...(duration && { duration }) });
    });
  }

  return { errors, pack: { title: title.slice(0, MAX_TITLE), items } };
}
