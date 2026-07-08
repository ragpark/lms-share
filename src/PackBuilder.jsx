import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ShareToClass from './ShareToClass';
import { createPack, updatePack, fetchPack, reviewDraftPack } from './api';

const isHttp = (v) => /^https?:\/\//i.test(v.trim());

export default function PackBuilder() {
  const { id: editId } = useParams();
  const isEditing = Boolean(editId);

  const [title, setTitle] = useState('');
  const [items, setItems] = useState([]);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { id, url }
  const [importedStep, setImportedStep] = useState(null); // { href, title }
  const [review, setReview] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    setLoadingExisting(true);
    setLoadError(null);
    fetchPack(editId)
      .then((pack) => {
        if (cancelled) return;
        setTitle(pack.title);
        setItems(pack.items);
        setLoadingExisting(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e.message);
        setLoadingExisting(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  useEffect(() => {
    if (isEditing) return;
    const params = new URLSearchParams(window.location.search);
    const importedHref = params.get('addUrl')?.trim();
    if (!importedHref) return;

    const importedTitle = params.get('addTitle')?.trim() || importedHref;
    setDraftUrl(importedHref);
    setDraftTitle(importedTitle);
    setImportedStep({ href: importedHref, title: importedTitle });

    params.delete('addUrl');
    params.delete('addTitle');
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, []);

  useEffect(() => {
    setReview(null);
    setReviewError(null);
  }, [title, items]);

  const addItem = () => {
    const href = draftUrl.trim();
    if (!isHttp(href)) {
      setError('Enter a valid http(s) URL.');
      return;
    }
    if (items.some((it) => it.href === href)) {
      setError('That URL is already in this pack.');
      return;
    }
    setItems((prev) => [...prev, { type: 'url', href, title: draftTitle.trim() || href, instruction: '', duration: '' }]);
    setDraftUrl('');
    setDraftTitle('');
    setImportedStep(null);
    setError(null);
  };

  const discardImport = () => {
    setDraftUrl('');
    setDraftTitle('');
    setImportedStep(null);
    setError(null);
  };

  const updateItem = (i, patch) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const move = (i, dir) =>
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const canReview = title.trim() && items.length > 0 && !items.some((it) => !isHttp(it.href || '')) && !reviewing;

  const reviewDraft = async () => {
    setReviewError(null);
    setReviewing(true);
    try {
      const res = await reviewDraftPack({ title, items });
      setReview(res);
    } catch (e) {
      setReviewError(e.message === 'AI review is not configured.' ? 'AI review is not configured. You can still create and share the pack as normal.' : e.message);
    } finally {
      setReviewing(false);
    }
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      if (items.some((it) => !isHttp(it.href || ''))) {
        setError('Add a valid http(s) URL to every step before creating the pack.');
        return;
      }
      const res = isEditing ? await updatePack(editId, { title, items }) : await createPack({ title, items });
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loadingExisting) {
    return (
      <PageShell>
        <p role="status" style={styles.note}>Loading your saved pack…</p>
      </PageShell>
    );
  }

  if (isEditing && loadError) {
    return (
      <PageShell>
        <p role="alert" style={styles.error}>{loadError}</p>
        <p><Link to="/my-packs" style={styles.linkButton}>Back to My packs</Link></p>
      </PageShell>
    );
  }

  if (result) {
    const packUrl = `${window.location.origin}${result.url}`;
    return (
      <PageShell>
        <section style={styles.successCard}>
          <div style={styles.eyebrow}>Ready for class</div>
          <h1 style={styles.h1}>{isEditing ? 'Lesson pack saved' : 'Lesson pack created'}</h1>
          <p style={styles.note} role="status">
            {isEditing ? 'Your changes are saved. The share link stays the same.' : 'Share one tidy link that opens the full sequence for your learners.'}
          </p>
          <a href={packUrl} style={styles.packLink}>{packUrl}</a>

          <div style={styles.divider} />
          <h2 style={styles.h2}>Send to your VLE</h2>
          <p style={styles.microcopy}>Choose the platform your school uses and post this pack as an assignment.</p>
          <ShareToClass
            resource={{
              url: packUrl,
              title,
              body: `A ${items.length}-step lesson pack: ${title}.`,
              message: title,
              itemType: 'assignment',
            }}
          />

          <p style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {isEditing ? (
              <>
                <button style={styles.secondary} onClick={() => setResult(null)}>Continue editing</button>
                <Link to="/my-packs" style={styles.linkButton}>Back to My packs</Link>
              </>
            ) : (
              <button style={styles.secondary} onClick={() => { setResult(null); setItems([]); setTitle(''); }}>
                Build another pack
              </button>
            )}
          </p>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <nav style={styles.topNav} aria-label="Pack navigation">
        <Link to="/my-packs" style={styles.linkButton}>My packs</Link>
      </nav>
      <section style={styles.hero}>
        <div>
          <div style={styles.eyebrow}>LMS Share for teachers</div>
          <h1 style={styles.heroTitle}>{isEditing ? 'Edit your lesson pack.' : 'Build a polished lesson pack in minutes.'}</h1>
          <p style={styles.heroText}>
            {isEditing
              ? 'Update the title or steps, then save to update this pack in place — the share link stays the same.'
              : 'Curate web links into a clear teaching sequence, then share a single URL to Google Classroom or Microsoft Teams.'}
          </p>
        </div>
        <div style={styles.statCard} aria-label={`${items.length} steps currently in this pack`}>
          <span style={styles.statNumber}>{items.length}</span>
          <span style={styles.statLabel}>planned {items.length === 1 ? 'step' : 'steps'}</span>
        </div>
      </section>

      <div style={styles.layout}>
        <section style={styles.panel} aria-labelledby="pack-details">
          <h2 id="pack-details" style={styles.panelTitle}>Pack details</h2>
          <p style={styles.panelHint}>Give the sequence a title pupils and colleagues will recognise.</p>

          {importedStep && (
            <section style={styles.importBox} aria-label="Imported browser tab">
              <strong>Imported from browser extension</strong>
              <p style={styles.importText}>Review this page, then add it as a step in your lesson pack.</p>
              <div style={styles.href}>{importedStep.title}</div>
              <div style={styles.href}>{importedStep.href}</div>
              <button type="button" style={styles.linkButton} onClick={discardImport}>
                Discard imported page
              </button>
            </section>
          )}

          <label style={styles.label}>
            Pack title
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input}
              placeholder="e.g. Year 10 Biology: Photosynthesis" />
          </label>

          <section style={styles.addBox} aria-labelledby="add-step">
            <div>
              <h2 id="add-step" style={styles.panelTitle}>Add a resource</h2>
              <p style={styles.panelHint}>Paste a link from BBC Bitesize, Oak, a video, quiz or your school platform.</p>
            </div>
            <label style={styles.labelCompact}>
              Step label <span style={styles.optional}>(optional)</span>
              <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} style={styles.input}
                placeholder="Starter video, retrieval quiz, plenary…" />
            </label>
            <label style={styles.labelCompact}>
              Resource URL
              <input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} style={styles.input}
                placeholder="https://…" onKeyDown={(e) => e.key === 'Enter' && addItem()} />
            </label>
            <button style={styles.primary} onClick={addItem}>Add step</button>
          </section>

          {error && <p role="alert" style={styles.error}>{error}</p>}
        </section>

        <section style={styles.panel} aria-labelledby="lesson-sequence">
          <div style={styles.sequenceHeader}>
            <div>
              <h2 id="lesson-sequence" style={styles.panelTitle}>Lesson sequence</h2>
              <p style={styles.panelHint}>Arrange resources in the order learners should open them.</p>
            </div>
            <span style={styles.countPill}>{items.length} {items.length === 1 ? 'step' : 'steps'}</span>
          </div>

          {items.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>＋</div>
              <strong>No steps yet</strong>
              <p style={styles.panelHint}>Add your first resource to start shaping the lesson flow.</p>
            </div>
          ) : (
            <ol style={styles.list}>
              {items.map((it, i) => (
                <li key={`${it.href}-${i}`} style={styles.row}>
                  <span style={styles.stepNumber}>{i + 1}</span>
                  <span style={styles.stepFields}>
                    <label style={styles.labelCompact}>
                      Step title
                      <input value={it.title} onChange={(e) => updateItem(i, { title: e.target.value })} style={styles.input} />
                    </label>
                    <label style={styles.labelCompact}>
                      Pupil instruction <span style={styles.optional}>(optional)</span>
                      <textarea value={it.instruction || ''} onChange={(e) => updateItem(i, { instruction: e.target.value })} style={styles.textarea} rows={2} />
                    </label>
                    <div style={styles.inlineFields}>
                      <label style={styles.labelCompact}>
                        Resource URL
                        <input value={it.href} onChange={(e) => updateItem(i, { href: e.target.value })} style={styles.input} placeholder="https://…" />
                      </label>
                      <label style={styles.labelCompact}>
                        Time <span style={styles.optional}>(optional)</span>
                        <input value={it.duration || ''} onChange={(e) => updateItem(i, { duration: e.target.value })} style={styles.input} placeholder="10 mins" />
                      </label>
                    </div>
                  </span>
                  <span style={styles.controls}>
                    <button type="button" style={styles.icon} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${it.title} up`}>↑</button>
                    <button type="button" style={styles.icon} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${it.title} down`}>↓</button>
                    <button type="button" style={styles.iconDanger} onClick={() => removeItem(i)} aria-label={`Remove ${it.title}`}>✕</button>
                  </span>
                </li>
              ))}
            </ol>
          )}

          <section style={styles.reviewPanel} aria-labelledby="ai-review">
            <div>
              <div style={styles.eyebrow}>Advisory AI review</div>
              <h2 id="ai-review" style={styles.panelTitle}>Check the draft before creating it.</h2>
              <p style={styles.panelHint}>Phase 1 uses only your pack title, step order, titles, instructions, durations, URLs and domains. It does not inspect the actual web pages.</p>
            </div>
            <button type="button" style={styles.secondaryWide} onClick={reviewDraft} disabled={!canReview}>
              {reviewing ? 'Reviewing…' : 'Review lesson with AI'}
            </button>
            {reviewError && <p role="alert" style={styles.error}>{reviewError}</p>}
            {review && <ReviewResult review={review} />}
          </section>

          <button style={styles.primaryWide} onClick={save} disabled={saving || !title.trim() || items.length === 0 || items.some((it) => !isHttp(it.href || ''))}>
            {saving
              ? (isEditing ? 'Saving…' : 'Creating…')
              : (isEditing ? `Save changes (${items.length} step${items.length === 1 ? '' : 's'})` : `Create pack (${items.length} step${items.length === 1 ? '' : 's'})`)}
          </button>
        </section>
      </div>
    </PageShell>
  );
}

function ReviewResult({ review }) {
  return (
    <article style={styles.reviewResult}>
      <ReviewBlock title="Summary"><p style={styles.reviewText}>{review.summary}</p></ReviewBlock>
      <ReviewBlock title="Overall coherence"><p style={styles.reviewText}><strong>{review.coherence.rating.replace('_', ' ')}</strong>: {review.coherence.comment}</p></ReviewBlock>
      <ReviewBlock title="Best suited for"><TagList items={review.bestSuitedFor} /></ReviewBlock>
      <ReviewBlock title="Pedagogical approach"><p style={styles.reviewText}><strong>{review.pedagogicalApproach.label}</strong>: {review.pedagogicalApproach.comment}</p></ReviewBlock>
      <ReviewBlock title="Metacognitive support"><p style={styles.reviewText}><strong>{review.metacognition.rating}</strong>: {review.metacognition.comment}</p><TagList items={review.metacognition.missingPrompts} /></ReviewBlock>
      <ReviewBlock title="Strengths"><BulletList items={review.strengths} /></ReviewBlock>
      <ReviewBlock title="Risks or gaps"><BulletList items={review.risksOrGaps} /></ReviewBlock>
      <ReviewBlock title="Suggested improvements"><BulletList items={review.suggestedImprovements} /></ReviewBlock>
      <ReviewBlock title="Per-step notes">
        <ol style={styles.reviewList}>{review.stepNotes.map((note) => <li key={`${note.step}-${note.title}`}><strong>Step {note.step}: {note.title}</strong><br />{note.comment}{note.suggestion && <em> Suggestion: {note.suggestion}</em>}</li>)}</ol>
      </ReviewBlock>
      <ReviewBlock title="Limitations"><BulletList items={review.limitations} /></ReviewBlock>
    </article>
  );
}

function ReviewBlock({ title, children }) {
  return <section style={styles.reviewBlock}><h3 style={styles.reviewHeading}>{title}</h3>{children}</section>;
}

function BulletList({ items }) {
  return items?.length ? <ul style={styles.reviewList}>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p style={styles.reviewText}>No specific notes.</p>;
}

function TagList({ items }) {
  return items?.length ? <div style={styles.tagList}>{items.map((item) => <span key={item} style={styles.tag}>{item}</span>)}</div> : <p style={styles.reviewText}>No specific notes.</p>;
}

function PageShell({ children }) {
  return <main style={styles.main}>{children}</main>;
}

const styles = {
  main: { minHeight: '100vh', padding: '48px 20px 64px', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#13201f', background: 'radial-gradient(circle at top left, #dff7ef 0, transparent 34%), linear-gradient(135deg, #f8fbfa 0%, #eef7f4 100%)', boxSizing: 'border-box' },
  topNav: { maxWidth: 1040, margin: '0 auto 16px', display: 'flex', justifyContent: 'flex-end' },
  hero: { maxWidth: 1040, margin: '0 auto 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'end' },
  eyebrow: { color: '#0f766e', fontSize: 13, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 },
  heroTitle: { fontSize: 'clamp(34px, 6vw, 64px)', lineHeight: .95, letterSpacing: '-.06em', margin: 0, maxWidth: 760 },
  heroText: { color: '#475569', fontSize: 18, lineHeight: 1.6, margin: '18px 0 0', maxWidth: 710 },
  statCard: { minWidth: 132, padding: 20, borderRadius: 24, background: '#fff', boxShadow: '0 24px 70px rgba(15, 118, 110, .15)', border: '1px solid rgba(15, 118, 110, .12)', textAlign: 'center' },
  statNumber: { display: 'block', fontSize: 48, fontWeight: 850, color: '#0f766e', lineHeight: 1 },
  statLabel: { color: '#64748b', fontSize: 13, fontWeight: 700 },
  layout: { maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' },
  panel: { background: 'rgba(255,255,255,.86)', border: '1px solid rgba(148,163,184,.28)', borderRadius: 28, padding: 24, boxShadow: '0 24px 80px rgba(15, 23, 42, .08)', backdropFilter: 'blur(16px)' },
  successCard: { maxWidth: 760, margin: '0 auto', background: 'rgba(255,255,255,.9)', border: '1px solid rgba(148,163,184,.28)', borderRadius: 32, padding: 32, boxShadow: '0 24px 80px rgba(15, 23, 42, .1)' },
  h1: { fontSize: 42, letterSpacing: '-.04em', margin: '0 0 8px' },
  h2: { fontSize: 20, margin: '0 0 8px' },
  panelTitle: { fontSize: 18, letterSpacing: '-.02em', margin: 0 },
  panelHint: { color: '#64748b', lineHeight: 1.5, margin: '6px 0 0', fontSize: 14 },
  note: { color: '#475569', lineHeight: 1.6, marginTop: 0 },
  microcopy: { color: '#64748b', fontSize: 14, marginTop: 0 },
  label: { display: 'block', fontSize: 13, fontWeight: 750, color: '#334155', marginTop: 20 },
  labelCompact: { display: 'block', fontSize: 13, fontWeight: 750, color: '#334155' },
  optional: { color: '#94a3b8', fontWeight: 600 },
  input: { display: 'block', width: '100%', padding: '13px 14px', marginTop: 7, border: '1px solid #cbd5e1', borderRadius: 14, fontSize: 15, boxSizing: 'border-box', background: '#fff', color: '#0f172a', outlineColor: '#0f766e' },
  addBox: { display: 'grid', gap: 14, margin: '24px 0 0', padding: 18, border: '1px dashed #99f6e4', borderRadius: 22, background: '#f0fdfa' },
  importBox: { display: 'grid', gap: 7, margin: '18px 0', padding: 16, border: '1px solid #99f6e4', borderRadius: 18, background: '#f0fdfa' },
  importText: { color: '#115e59', fontSize: 13, margin: 0 },
  sequenceHeader: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', marginBottom: 16 },
  countPill: { flex: '0 0 auto', padding: '7px 10px', borderRadius: 999, background: '#ccfbf1', color: '#115e59', fontSize: 12, fontWeight: 800 },
  emptyState: { display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 220, border: '1px dashed #cbd5e1', borderRadius: 22, background: '#f8fafc', color: '#334155' },
  emptyIcon: { width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 999, background: '#e0f2fe', color: '#0369a1', fontSize: 24, marginBottom: 4 },
  list: { listStyle: 'none', padding: 0, display: 'grid', gap: 10, margin: '0 0 18px' },
  row: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', border: '1px solid #e2e8f0', borderRadius: 18, background: '#fff' },
  stepNumber: { width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 999, background: '#134e4a', color: '#fff', fontSize: 13, fontWeight: 800, flex: '0 0 auto' },
  href: { color: '#64748b', fontSize: 12, wordBreak: 'break-all' },
  stepFields: { flex: 1, minWidth: 0, display: 'grid', gap: 10 },
  inlineFields: { display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(90px, 140px)', gap: 10 },
  textarea: { display: 'block', width: '100%', padding: '13px 14px', marginTop: 7, border: '1px solid #cbd5e1', borderRadius: 14, fontSize: 15, boxSizing: 'border-box', background: '#fff', color: '#0f172a', outlineColor: '#0f766e', resize: 'vertical', fontFamily: 'inherit' },
  controls: { display: 'flex', gap: 6, flex: '0 0 auto' },
  icon: { width: 34, height: 34, border: '1px solid #cbd5e1', borderRadius: 12, background: '#f8fafc', cursor: 'pointer', color: '#334155' },
  iconDanger: { width: 34, height: 34, border: '1px solid #fecaca', borderRadius: 12, background: '#fff7f7', cursor: 'pointer', color: '#b91c1c' },
  primary: { padding: '12px 18px', border: 'none', borderRadius: 14, background: '#0f766e', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 12px 24px rgba(15, 118, 110, .18)' },
  secondaryWide: { width: '100%', padding: '13px 18px', border: '1px solid #cbd5e1', borderRadius: 16, background: '#fff', fontSize: 15, fontWeight: 850, cursor: 'pointer', color: '#334155' },
  primaryWide: { width: '100%', padding: '14px 18px', border: 'none', borderRadius: 16, background: '#0f766e', color: '#fff', fontSize: 15, fontWeight: 850, cursor: 'pointer', boxShadow: '0 12px 24px rgba(15, 118, 110, .18)' },
  secondary: { padding: '11px 16px', border: '1px solid #cbd5e1', borderRadius: 14, background: '#fff', fontSize: 14, fontWeight: 750, cursor: 'pointer', color: '#334155' },
  linkButton: { justifySelf: 'start', padding: 0, border: 'none', background: 'transparent', color: '#0f766e', textDecoration: 'underline', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  error: { color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '10px 12px', fontSize: 13 },
  reviewPanel: { display: 'grid', gap: 14, margin: '20px 0 12px', padding: 18, border: '1px solid #bae6fd', borderRadius: 22, background: '#f0f9ff' },
  reviewResult: { display: 'grid', gap: 12, padding: 14, border: '1px solid #dbeafe', borderRadius: 18, background: '#fff' },
  reviewBlock: { display: 'grid', gap: 6 },
  reviewHeading: { margin: 0, fontSize: 14, color: '#0f766e' },
  reviewText: { margin: 0, color: '#334155', fontSize: 13, lineHeight: 1.5 },
  reviewList: { margin: 0, paddingLeft: 20, color: '#334155', fontSize: 13, lineHeight: 1.5 },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tag: { padding: '5px 8px', borderRadius: 999, background: '#ccfbf1', color: '#115e59', fontSize: 12, fontWeight: 750 },
  packLink: { display: 'inline-block', margin: '6px 0 4px', color: '#0f766e', wordBreak: 'break-all', fontWeight: 750 },
  divider: { height: 1, background: '#e2e8f0', margin: '26px 0' },
};
