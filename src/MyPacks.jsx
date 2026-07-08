import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyPacks } from './api';

export default function MyPacks() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [packs, setPacks] = useState([]);
  const [error, setError] = useState(null);
  const headingRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyPacks()
      .then((data) => {
        if (cancelled) return;
        setPacks(data.packs || []);
        setStatus('ready');
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  // Predictable focus when arriving at My packs (accessibility requirement).
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main style={styles.main}>
      <section style={styles.shell}>
        <div style={styles.headerRow}>
          <h1 style={styles.title} ref={headingRef} tabIndex={-1}>My packs</h1>
          <Link to="/" style={styles.newLink}>+ New pack</Link>
        </div>
        <p style={styles.intro}>Lesson packs you have saved from this browser.</p>

        {status === 'loading' && <p role="status" style={styles.note}>Loading your saved packs…</p>}

        {status === 'error' && <p role="alert" style={styles.error}>{error}</p>}

        {status === 'ready' && packs.length === 0 && (
          <div style={styles.empty}>
            <strong>No saved packs yet</strong>
            <p style={styles.note}>Saved packs will appear here after you save one from the Builder.</p>
            <Link to="/" style={styles.newLink}>Build your first pack</Link>
          </div>
        )}

        {status === 'ready' && packs.length > 0 && (
          <ul style={styles.list}>
            {packs.map((pack) => (
              <li key={pack.id} style={styles.row}>
                <div style={styles.rowMeta}>
                  <div style={styles.packTitle}>{pack.title}</div>
                  <div style={styles.subtext}>
                    {pack.itemCount} step{pack.itemCount === 1 ? '' : 's'} · last saved {new Date(pack.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={styles.rowActions}>
                  <Link to={`/pack/${pack.id}/edit`} style={styles.primaryLink}>Open in Builder</Link>
                  <a href={pack.url} style={styles.secondaryLink}>View share link</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

const styles = {
  main: { minHeight: '100vh', padding: '48px 20px 64px', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#13201f', background: 'radial-gradient(circle at top left, #dff7ef 0, transparent 34%), linear-gradient(135deg, #f8fbfa 0%, #eef7f4 100%)', boxSizing: 'border-box' },
  shell: { maxWidth: 760, margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' },
  title: { fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: '-.05em', margin: 0, outline: 'none' },
  intro: { color: '#475569', lineHeight: 1.6, margin: '10px 0 28px' },
  note: { color: '#475569', lineHeight: 1.6 },
  newLink: { color: '#0f766e', fontWeight: 800, textDecoration: 'none' },
  empty: { display: 'grid', gap: 10, justifyItems: 'start', padding: 28, border: '1px dashed #cbd5e1', borderRadius: 22, background: '#f8fafc' },
  error: { color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '10px 12px', fontSize: 13 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: 18, border: '1px solid rgba(148,163,184,.32)', borderRadius: 20, background: 'rgba(255,255,255,.88)', boxShadow: '0 14px 34px rgba(15, 23, 42, .06)' },
  rowMeta: { minWidth: 0 },
  packTitle: { fontWeight: 800, fontSize: 17 },
  subtext: { color: '#64748b', fontSize: 13, marginTop: 4 },
  rowActions: { display: 'flex', gap: 14, flex: '0 0 auto' },
  primaryLink: { color: '#0f766e', fontWeight: 800, textDecoration: 'none' },
  secondaryLink: { color: '#334155', fontWeight: 700, textDecoration: 'none' },
};
