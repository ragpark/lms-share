import { useState } from 'react';
import ShareToClass from './ShareToClass';
import ResourceShareMenu, { toShareResource } from './ResourceShareMenu';

const MOCK_COURSE = { id: 'c1', name: 'Year 11 Maths' };
const MOCK_RESOURCES = [
  { id: '101', title: 'Algebra worksheet 3', summary: 'Solving linear equations' },
  { id: '102', title: 'Quadratics past paper', summary: 'Edexcel 2023 Paper 1' },
  { id: '103', title: 'Trigonometry revision', summary: 'SOHCAHTOA practice' },
];

export default function App() {
  const [url, setUrl] = useState('https://example.com/gcse/maths/algebra-3');
  const [title, setTitle] = useState('GCSE Maths: Algebra worksheet 3');
  const [body, setBody] = useState('Complete the worksheet and submit by Friday.');

  const resource = {
    url,
    title,
    body,
    message: `${MOCK_COURSE.name} – ${title}`,
    itemType: 'assignment',
  };

  return (
    <main style={styles.main}>
      <h1 style={styles.h1}>LMS Share — dev harness</h1>
      <p style={styles.note}>
        Test the Share to Google Classroom / Microsoft Teams buttons against real sandbox tenants.
        The vendor scripts require <strong>https</strong> and won&rsquo;t initialise on
        http://localhost — deploy to a Railway preview URL and test there. Teams sharing works in
        desktop Edge / Chrome only, with no guest or freemium accounts.
      </p>

      <section style={styles.form}>
        <label style={styles.label}>
          Resource URL
          <input value={url} onChange={(e) => setUrl(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          Assignment title
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
        </label>
        <label style={styles.label}>
          Instructions
          <input value={body} onChange={(e) => setBody(e.target.value)} style={styles.input} />
        </label>
      </section>

      <h2 style={styles.h2}>Direct buttons</h2>
      <ShareToClass resource={resource} />

      <h2 style={{ ...styles.h2, marginTop: 32 }}>Per-course resource list (deferred menu)</h2>
      <p style={styles.course}>{MOCK_COURSE.name}</p>
      <ul style={styles.list}>
        {MOCK_RESOURCES.map((r) => (
          <li key={r.id} style={styles.row}>
            <span>{r.title}</span>
            <ResourceShareMenu resource={toShareResource(r, MOCK_COURSE)} />
          </li>
        ))}
      </ul>
    </main>
  );
}

const styles = {
  main: { maxWidth: 760, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' },
  h1: { fontSize: 22, marginBottom: 8 },
  h2: { fontSize: 16 },
  note: { color: '#555', lineHeight: 1.5 },
  form: { margin: '24px 0', display: 'grid', gap: 10 },
  label: { display: 'block', fontSize: 13, color: '#333' },
  input: { display: 'block', width: '100%', padding: 8, marginTop: 4, border: '1px solid #ccc', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  course: { color: '#555', margin: '4px 0 8px' },
  list: { listStyle: 'none', padding: 0, display: 'grid', gap: 8 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 8 },
};
