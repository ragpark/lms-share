import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPack } from './api';

const domainOf = (href) => {
  try { return new URL(href).hostname.replace(/^www\./, ''); } catch { return href; }
};

export default function PackViewer() {
  const { id } = useParams();
  const [pack, setPack] = useState(null);
  const [error, setError] = useState(null);
  const [viewed, setViewed] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    fetchPack(id)
      .then((p) => !cancelled && setPack(p))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [id]);

  // Restore per-pack progress (this is the deployed app, not a sandbox, so localStorage is fine).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`pack:${id}:viewed`);
      if (raw) setViewed(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, [id]);

  const markViewed = (i) =>
    setViewed((prev) => {
      const next = new Set(prev);
      next.add(i);
      try { localStorage.setItem(`pack:${id}:viewed`, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });

  if (error) return <Centered>{error}</Centered>;
  if (!pack) return <Centered>Loading pack…</Centered>;

  const total = pack.items.length;
  const done = pack.items.reduce((n, _, i) => n + (viewed.has(i) ? 1 : 0), 0);

  return (
    <main style={styles.main}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.eyebrow}>Lesson pack</div>
          <h1 style={styles.title}>{pack.title}</h1>
          <p style={styles.intro}>Open each resource in order. Your progress is saved on this device.</p>
          <div style={styles.progressRow}>
            <div style={styles.progress}>{done} of {total} opened</div>
            <div style={styles.percent}>{total ? Math.round((done / total) * 100) : 0}% complete</div>
          </div>
          <div style={styles.bar} aria-hidden="true">
            <div style={{ ...styles.barFill, width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </header>

        <ol style={styles.list}>
          {pack.items.map((it, i) => (
            <li key={i} style={{ ...styles.card, ...(viewed.has(i) ? styles.cardDone : {}) }}>
              <div style={{ ...styles.num, ...(viewed.has(i) ? styles.numDone : {}) }}>
                {viewed.has(i) ? '✓' : i + 1}
              </div>
              <div style={styles.meta}>
                <div style={styles.itemTitle}>{it.title}</div>
                {it.instruction && <p style={styles.instruction}>{it.instruction}</p>}
                <div style={styles.domain}>{domainOf(it.href)}{it.duration ? ` · ${it.duration}` : ''}</div>
              </div>
              <a
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.open}
                onClick={() => markViewed(i)}
              >
                Open ↗
              </a>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function Centered({ children }) {
  return <div style={styles.centered}>{children}</div>;
}

const styles = {
  main: { minHeight: '100vh', padding: '48px 20px 64px', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#13201f', background: 'radial-gradient(circle at top left, #dff7ef 0, transparent 34%), linear-gradient(135deg, #f8fbfa 0%, #eef7f4 100%)', boxSizing: 'border-box' },
  shell: { maxWidth: 760, margin: '0 auto' },
  header: { marginBottom: 20, padding: 28, borderRadius: 30, background: 'rgba(255,255,255,.9)', border: '1px solid rgba(148,163,184,.28)', boxShadow: '0 24px 80px rgba(15, 23, 42, .09)' },
  eyebrow: { color: '#0f766e', fontSize: 13, fontWeight: 850, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 },
  title: { fontSize: 'clamp(32px, 6vw, 54px)', lineHeight: 1, letterSpacing: '-.055em', margin: '0 0 12px' },
  intro: { color: '#475569', lineHeight: 1.6, margin: '0 0 20px', fontSize: 16 },
  progressRow: { display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 8, fontSize: 13, fontWeight: 750, color: '#475569' },
  progress: { color: '#0f766e' },
  percent: { color: '#64748b' },
  bar: { height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg, #0f766e, #14b8a6)', transition: 'width .2s ease' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 },
  card: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px', border: '1px solid rgba(148,163,184,.32)', borderRadius: 22, background: 'rgba(255,255,255,.88)', boxShadow: '0 14px 34px rgba(15, 23, 42, .06)' },
  cardDone: { background: '#f0fdfa', borderColor: '#99f6e4' },
  num: { flex: '0 0 auto', width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 999, background: '#e2e8f0', color: '#334155', fontSize: 14, fontWeight: 850 },
  numDone: { background: '#0f766e', color: '#fff' },
  meta: { flex: 1, minWidth: 0 },
  itemTitle: { fontWeight: 800, fontSize: 16, color: '#13201f' },
  instruction: { color: '#475569', lineHeight: 1.5, margin: '6px 0 0', fontSize: 14 },
  domain: { fontSize: 13, color: '#64748b', marginTop: 4 },
  open: { flex: '0 0 auto', padding: '10px 15px', border: '1px solid #0f766e', borderRadius: 14, color: '#0f766e', background: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 850 },
  centered: { display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', color: '#475569', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', background: '#f8fbfa' },
};
