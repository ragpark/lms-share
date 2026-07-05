const DEFAULT_MODEL = 'gpt-4o-mini';

export function extractDomain(href) {
  try {
    return new URL(href).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

export function buildDraftReviewPrompt(pack) {
  const steps = pack.items.map((item, index) => ({
    step: index + 1,
    title: item.title,
    instruction: item.instruction || '',
    duration: item.duration || '',
    href: item.href,
    domain: extractDomain(item.href),
  }));

  return `Review this draft URL-only lesson pack for a teacher using only the structured metadata below. Do not fetch, scrape, crawl, open, or claim to inspect any URL or page content. Make uncertainty explicit: infer only from the pack title, ordered step titles, pupil instructions, durations, URL strings, and domains.

Pack title: ${pack.title}
Ordered steps JSON:
${JSON.stringify(steps, null, 2)}

Return concise teacher-friendly JSON only, with this exact shape:
{
  "summary": "...",
  "coherence": { "rating": "strong|developing|needs_attention", "comment": "..." },
  "bestSuitedFor": ["..."],
  "pedagogicalApproach": { "label": "...", "comment": "..." },
  "metacognition": { "rating": "strong|moderate|limited", "comment": "...", "missingPrompts": ["..."] },
  "strengths": ["..."],
  "risksOrGaps": ["..."],
  "suggestedImprovements": ["..."],
  "stepNotes": [{ "step": 1, "title": "...", "comment": "...", "suggestion": "..." }],
  "limitations": ["..."]
}

Requirements:
- Do not include markdown or prose outside JSON.
- Mention in limitations that actual web page contents were not inspected.
- Focus suggestions on ordering, clearer step titles, pupil instructions, duration, and missing metacognitive prompts.
- Comment on learner type and pedagogical approach from a metacognitive perspective.
- Keep arrays short and practical.`;
}

function normaliseReview(value, pack) {
  if (!value || typeof value !== 'object') throw new Error('AI review returned malformed JSON.');
  const allowedCoherence = new Set(['strong', 'developing', 'needs_attention']);
  const allowedMeta = new Set(['strong', 'moderate', 'limited']);
  const arr = (v) => Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 8) : [];
  const text = (v, fallback = '') => typeof v === 'string' && v.trim() ? v.trim() : fallback;
  const coherenceRating = allowedCoherence.has(value.coherence?.rating) ? value.coherence.rating : 'developing';
  const metaRating = allowedMeta.has(value.metacognition?.rating) ? value.metacognition.rating : 'limited';
  const limitations = arr(value.limitations);
  if (!limitations.some((l) => /not inspected|not inspect|metadata|url content|web page/i.test(l))) {
    limitations.unshift('This Phase 1 review has not inspected the actual web page contents; it uses only teacher-entered metadata, URLs, domains, and ordering.');
  }
  return {
    summary: text(value.summary, 'Draft reviewed from lesson-pack metadata only.'),
    coherence: { rating: coherenceRating, comment: text(value.coherence?.comment) },
    bestSuitedFor: arr(value.bestSuitedFor),
    pedagogicalApproach: { label: text(value.pedagogicalApproach?.label, 'Inferred approach'), comment: text(value.pedagogicalApproach?.comment) },
    metacognition: { rating: metaRating, comment: text(value.metacognition?.comment), missingPrompts: arr(value.metacognition?.missingPrompts) },
    strengths: arr(value.strengths),
    risksOrGaps: arr(value.risksOrGaps),
    suggestedImprovements: arr(value.suggestedImprovements),
    stepNotes: Array.isArray(value.stepNotes) ? value.stepNotes.slice(0, pack.items.length).map((note, index) => ({
      step: Number.isInteger(note?.step) ? note.step : index + 1,
      title: text(note?.title, pack.items[index]?.title || `Step ${index + 1}`),
      comment: text(note?.comment),
      suggestion: text(note?.suggestion),
    })) : [],
    limitations,
  };
}

export async function reviewDraftPack(pack, options = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error('AI review is not configured.');
    err.status = 503;
    throw err;
  }

  const model = options.model || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const fetchImpl = options.fetch || globalThis.fetch;
  const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are an expert teaching and learning coach. Return valid JSON only.' },
        { role: 'user', content: buildDraftReviewPrompt(pack) },
      ],
    }),
  });

  if (!response.ok) throw new Error('AI review failed. Please try again later.');
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('AI review returned an empty or unreadable response. Please try again.');
  }
  const content = data?.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('AI review returned a response that could not be read. Please try again.');
  }
  return normaliseReview(parsed, pack);
}
