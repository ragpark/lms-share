import { validatePack } from './validate.js';
import { reviewDraftPack } from './aiReview.js';

export async function handleReviewDraft(req, res, review = reviewDraftPack) {
  const { errors, pack } = validatePack(req.body);
  if (errors.length) return res.status(400).json({ errors });

  try {
    const draftReview = await review(pack);
    return res.json(draftReview);
  } catch (err) {
    const status = err.status || 502;
    return res.status(status).json({ error: err.message || 'AI review failed. Please try again later.' });
  }
}
