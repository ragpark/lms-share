import { validatePack, isValidOwnerToken } from './validate.js';

// No accounts in v1 (SDD-2026-001): ownership is a bearer owner-token minted client-side,
// sent on create/update/list. Never echoed back — see getPack / listMyPacks below.
function ownerTokenFromHeader(req) {
  const header = String(req.headers?.authorization || '');
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export function createPacksRoutes(store, log = console.log) {
  function createPack(req, res) {
    const { errors, pack } = validatePack(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const ownerToken = ownerTokenFromHeader(req);
    if (ownerToken && !isValidOwnerToken(ownerToken)) {
      return res.status(400).json({ errors: ['Invalid owner token.'] });
    }

    const created = store.insert(pack, ownerToken);
    if (!created) {
      log('saved_pack_create_failure', { reason: 'id_allocation_failed' });
      return res.status(500).json({ error: 'Could not allocate a pack id, please retry.' });
    }
    log('saved_pack_create_success', { id: created.id });
    return res.status(201).json({ id: created.id, url: `/pack/${created.id}` });
  }

  function updatePack(req, res) {
    const ownerToken = ownerTokenFromHeader(req);
    if (!ownerToken || !isValidOwnerToken(ownerToken)) {
      return res.status(403).json({ error: 'A valid owner token is required to edit this pack.' });
    }

    const existing = store.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Pack not found' });
    if (existing.ownerToken !== ownerToken) {
      log('saved_pack_update_failure', { id: req.params.id, reason: 'owner_mismatch' });
      return res.status(403).json({ error: 'You do not have permission to edit this pack.' });
    }

    const { errors, pack } = validatePack(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { updatedAt } = store.update(req.params.id, pack);
    log('saved_pack_update_success', { id: req.params.id });
    return res.json({ id: req.params.id, title: pack.title, items: pack.items, updatedAt, url: `/pack/${req.params.id}` });
  }

  function getPack(req, res) {
    const pack = store.getById(req.params.id);
    if (!pack) return res.status(404).json({ error: 'Pack not found' });
    // Public share-view route: never include ownerToken in the response.
    return res.json({ id: pack.id, title: pack.title, items: pack.items, createdAt: pack.createdAt });
  }

  function listMyPacks(req, res) {
    const ownerToken = ownerTokenFromHeader(req);
    if (!ownerToken || !isValidOwnerToken(ownerToken)) {
      return res.status(401).json({ error: 'A valid owner token is required to view saved packs.' });
    }
    const packs = store.listByOwnerToken(ownerToken).map((p) => ({ ...p, url: `/pack/${p.id}` }));
    return res.json({ packs });
  }

  return { createPack, updatePack, getPack, listMyPacks };
}
