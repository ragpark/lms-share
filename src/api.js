import { getOwnerToken } from './ownerToken.js';

async function readJsonResponse(res, fallbackMessage) {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(fallbackMessage);
  }
}

function errorMessageFrom(data, fallbackMessage) {
  return (data.errors && data.errors.join(' ')) || data.error || fallbackMessage;
}

export async function createPack(pack) {
  const res = await fetch('/api/packs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getOwnerToken()}` },
    body: JSON.stringify(pack),
  });
  if (!res.ok) {
    const data = await readJsonResponse(res, 'Failed to create pack').catch(() => ({}));
    throw new Error(errorMessageFrom(data, 'Failed to create pack'));
  }
  return readJsonResponse(res, 'Failed to create pack'); // { id, url }
}

export async function updatePack(id, pack) {
  const res = await fetch(`/api/packs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getOwnerToken()}` },
    body: JSON.stringify(pack),
  });
  if (!res.ok) {
    const data = await readJsonResponse(res, 'Failed to save changes').catch(() => ({}));
    throw new Error(errorMessageFrom(data, 'Failed to save changes'));
  }
  return readJsonResponse(res, 'Failed to save changes'); // { id, title, items, updatedAt, url }
}

export async function fetchMyPacks() {
  const res = await fetch('/api/my-packs', {
    headers: { Authorization: `Bearer ${getOwnerToken()}` },
  });
  if (!res.ok) {
    const data = await readJsonResponse(res, 'Failed to load saved packs').catch(() => ({}));
    throw new Error(errorMessageFrom(data, 'Failed to load saved packs'));
  }
  return readJsonResponse(res, 'Failed to load saved packs'); // { packs: [...] }
}

export async function reviewDraftPack(pack) {
  const res = await fetch('/api/packs/review-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pack),
  });
  if (!res.ok) {
    const data = await readJsonResponse(res, 'Failed to review draft pack').catch(() => ({}));
    throw new Error(errorMessageFrom(data, 'Failed to review draft pack'));
  }
  return readJsonResponse(res, 'AI review did not return a usable response. Please try again.');
}

export async function fetchPack(id) {
  const res = await fetch(`/api/packs/${id}`);
  if (res.status === 404) throw new Error('Pack not found');
  if (!res.ok) throw new Error('Failed to load pack');
  return readJsonResponse(res, 'Failed to load pack'); // { id, title, items, createdAt }
}
