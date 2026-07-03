import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPack } from './api';

export default function PackViewer() {
  const { id } = useParams();
  const [pack, setPack] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPack(id)
      .then((p) => !cancelled && setPack(p))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [id]);

  if (error) return <Centered>{error}</Centered>;
  if (!pack) return <Centered>Loading pack…</Centered>;
  if (pack.items.length === 0) return <Centered>This pack has no steps.</Centered>;

  const item = pack.items[step];
  const atStart = step === 0;
  const atEnd = step === pack.items.length - 1;

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div>
          <div style={styles.packTitle}>{pack.title}</div>
          <div style={styles.progress}>Step {step + 1} of {pack.items.length}</div>
        </div>
        <div style={styles.nav}>
          <button style={styles.navBtn} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={atStart}>← Prev</button>
          <button style={styles.navBtn} onClick={() => setStep((s) => Math.min(pack.items.length - 1, s + 1))} disabled={atEnd}>Next →</button>
        </div>
      </header>

      <div style={styles.body}>
        <nav style={styles.sidebar}>
          <ol style={styles.stepList}>
            {pack.items.map((it, i) => (
              <li key={i}>
                <button
                  onClick={() => setStep(i)}
                  style={{ ...styles.stepBtn, ...(i === step ? styles.stepBtnActive : {}) }}
                >
                  {it.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main style={styles.stage}>
          <div style={styles.stageBar}>
            <span style={styles.stageTitle}>{item.title}</span>
            <a href={item.href} target="_blank" rel="noopener noreferrer" style={styles.openLink}>
              Open in new tab ↗
            </a>
          </div>
          {/* Many sites block being framed; the "Open in new tab" link is the guaranteed path. */}
          <iframe
            key={item.href}
            title={item.title}
            src={item.href}
            style={styles.frame}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        </main>
      </div>
    </div>
  );
}

function Centered({ children }) {
  return <div style={styles.centered}>{children}</div>;
}

const styles = {
  shell: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' },
  packTitle: { fontWeight: 600, fontSize: 15 },
  progress: { fontSize: 12, color: '#64748b' },
  nav: { display: 'flex', gap: 8 },
  navBtn: { padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 },
  body: { display: 'flex', flex: 1, minHeight: 0 },
  sidebar: { width: 240, borderRight: '1px solid #e5e7eb', overflowY: 'auto', background: '#f8fafc' },
  stepList: { listStyle: 'decimal', margin: 0, padding: '12px 12px 12px 30px', display: 'grid', gap: 4 },
  stepBtn: { display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 13 },
  stepBtnActive: { background: '#e0edff', fontWeight: 600 },
  stage: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  stageBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid #eef2f7' },
  stageTitle: { fontSize: 13, fontWeight: 600 },
  openLink: { fontSize: 13, color: '#2563eb', textDecoration: 'none' },
  frame: { flex: 1, width: '100%', border: 'none' },
  centered: { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#475569', fontFamily: 'system-ui, sans-serif' },
};
