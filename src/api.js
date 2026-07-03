export async function createPack(pack) {
  const res = await fetch('/api/packs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pack),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data.errors && data.errors.join(' ')) || data.error || 'Failed to create pack');
  }
  return res.json(); // { id, url }
}

export async function fetchPack(id) {
  const res = await fetch(`/api/packs/${id}`);
  if (res.status === 404) throw new Error('Pack not found');
  if (!res.ok) throw new Error('Failed to load pack');
  return res.json(); // { id, title, items, createdAt }
}
