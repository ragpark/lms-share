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
      <header style={styles.header}>
        <h1 style={styles.title}>{pack.title}</h1>
        <div style={styles.progress}>{done} of {total} opened</div>
        <div style={styles.bar}>
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
              <div style={styles.domain}>{domainOf(it.href)}</div>
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
    </main>
  );
}

function Centered({ children }) {
  return <div style={styles.centered}>{children}</div>;
}

const styles = {
  main: { maxWidth: 640, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' },
  header: { marginBottom: 20 },
  title: { fontSize: 22, margin: '0 0 6px' },
  progress: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  bar: { height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', background: '#2563eb', transition: 'width .2s ease' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 },
  card: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid #e2e2e2', borderRadius: 10, background: '#fff' },
  cardDone: { background: '#f6fbf7', borderColor: '#cfe9d6' },
  num: { flex: '0 0 auto', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 999, background: '#eef2f7', color: '#334155', fontSize: 13, fontWeight: 600 },
  numDone: { background: '#16a34a', color: '#fff' },
  meta: { flex: 1, minWidth: 0 },
  itemTitle: { fontWeight: 600, fontSize: 15 },
  domain: { fontSize: 12, color: '#64748b', marginTop: 2 },
  open: { flex: '0 0 auto', padding: '8px 14px', border: '1px solid #2563eb', borderRadius: 6, color: '#2563eb', textDecoration: 'none', fontSize: 13, fontWeight: 600 },
  centered: { display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', color: '#475569', fontFamily: 'system-ui, sans-serif' },
};
