// No-accounts ownership model (SDD-2026-001): a random token minted once per browser,
// stored in localStorage, sent as a bearer credential to create/edit/list saved packs.
// Losing it (e.g. clearing browser storage) means losing edit/list access to those packs,
// same as today's behavior for anonymous share links.
const STORAGE_KEY = 'lms-share:owner-token';

let memoryToken = null;

function mintToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getOwnerToken() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const token = mintToken();
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    // Private browsing / storage disabled: fall back to an in-memory token so at
    // least this page load behaves consistently, though it won't survive a refresh.
    if (!memoryToken) memoryToken = mintToken();
    return memoryToken;
  }
}
