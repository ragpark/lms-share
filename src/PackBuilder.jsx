import { useState } from 'react';
import ShareToClass from './ShareToClass';
import { createPack } from './api';

const isHttp = (v) => /^https?:\/\//i.test(v.trim());

export default function PackBuilder() {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([]);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { id, url }

  const addItem = () => {
    const href = draftUrl.trim();
    if (!isHttp(href)) {
      setError('Enter a valid http(s) URL.');
      return;
    }
    setItems((prev) => [...prev, { type: 'url', href, title: draftTitle.trim() || href }]);
    setDraftUrl('');
    setDraftTitle('');
    setError(null);
  };

  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const move = (i, dir) =>
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await createPack({ title, items });
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    const packUrl = `${window.location.origin}${result.url}`;
    return (
      <main style={styles.main}>
        <h1 style={styles.h1}>Lesson pack created</h1>
        <p style={styles.note}>Share this single link — it opens the whole sequence:</p>
        <a href={packUrl} style={styles.packLink}>{packUrl}</a>

        <h2 style={styles.h2}>Share to a class</h2>
        <ShareToClass
          resource={{
            url: packUrl,
            title,
            body: `A ${items.length}-step lesson pack: ${title}.`,
            message: title,
            itemType: 'assignment',
          }}
        />

        <p style={{ marginTop: 28 }}>
          <button style={styles.secondary} onClick={() => { setResult(null); setItems([]); setTitle(''); }}>
            Build another pack
          </button>
        </p>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.h1}>Build a lesson pack</h1>
      <p style={styles.note}>
        Sequence links into a single pack, then share one URL to Google Classroom or Microsoft Teams.
      </p>

      <label style={styles.label}>
        Pack title
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input}
          placeholder="e.g. GCSE Biology: Photosynthesis" />
      </label>

      <section style={styles.addBox}>
        <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} style={styles.input}
          placeholder="Step label (optional)" />
        <input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} style={styles.input}
          placeholder="https://…" onKeyDown={(e) => e.key === 'Enter' && addItem()} />
        <button style={styles.primary} onClick={addItem}>Add step</button>
      </section>

      {error && <p style={styles.error}>{error}</p>}

      <ol style={styles.list}>
        {items.map((it, i) => (
          <li key={`${it.href}-${i}`} style={styles.row}>
            <span style={{ flex: 1 }}>
              <strong>{it.title}</strong>
              <br />
              <span style={styles.href}>{it.href}</span>
            </span>
            <span style={styles.controls}>
              <button style={styles.icon} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button style={styles.icon} onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
              <button style={styles.icon} onClick={() => removeItem(i)}>✕</button>
            </span>
          </li>
        ))}
      </ol>

      <button style={styles.primary} onClick={save} disabled={saving || !title.trim() || items.length === 0}>
        {saving ? 'Creating…' : `Create pack (${items.length} step${items.length === 1 ? '' : 's'})`}
      </button>
    </main>
  );
}

const styles = {
  main: { maxWidth: 720, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' },
  h1: { fontSize: 22, marginBottom: 6 },
  h2: { fontSize: 16, marginTop: 28 },
  note: { color: '#555', lineHeight: 1.5 },
  label: { display: 'block', fontSize: 13, color: '#333', marginTop: 16 },
  input: { display: 'block', width: '100%', padding: 9, marginTop: 4, border: '1px solid #ccc', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  addBox: { display: 'grid', gap: 8, margin: '20px 0', padding: 14, border: '1px dashed #cbd5e1', borderRadius: 8 },
  list: { listStyle: 'decimal', paddingLeft: 22, display: 'grid', gap: 8, margin: '16px 0' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 8 },
  href: { color: '#64748b', fontSize: 12, wordBreak: 'break-all' },
  controls: { display: 'flex', gap: 4 },
  icon: { width: 30, height: 30, border: '1px solid #d1d5db', borderRadius: 6, background: '#f8fafc', cursor: 'pointer' },
  primary: { padding: '10px 16px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', fontSize: 14, cursor: 'pointer' },
  secondary: { padding: '9px 14px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', fontSize: 14, cursor: 'pointer' },
  error: { color: '#b91c1c', fontSize: 13 },
  packLink: { display: 'inline-block', margin: '6px 0 4px', color: '#2563eb', wordBreak: 'break-all' },
};
