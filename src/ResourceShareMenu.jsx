/**
 * ResourceShareMenu — a per-row "Assign / Share" control for dynamic, per-course
 * resource lists in a React SPA.
 *
 * Why this exists: dropping two hosted share widgets (Google Classroom + Teams)
 * into every row of a long or virtualised list is slow and loads the vendor
 * scripts whether or not a teacher ever shares anything. This component shows a
 * cheap trigger per row and only mounts <ShareToClass> when the teacher opens it.
 * Because ShareToClass is lazy-imported, platform.js / launcher.js aren't fetched
 * until the first menu is opened anywhere on the page — after which both the module
 * and the vendor scripts are cached for every other row.
 *
 * Styling here is intentionally minimal — restyle the trigger and panel to your
 * design system; the share buttons themselves are rendered by Google/Microsoft.
 */

import { lazy, Suspense, useEffect, useRef, useState } from 'react';

// Co-locate ShareToClass.jsx (the combined component) next to this file.
const ShareToClass = lazy(() => import('./ShareToClass'));

/**
 * Map one of your platform's resource records (optionally with course context)
 * to the unified ShareResource shape. Adjust field names to your data model.
 *
 * @param {Object} record  A resource row from your API.
 * @param {Object} [course] The course the list is scoped to.
 * @returns {import('./ShareToClass').ShareResource}
 */
export function toShareResource(record, course) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    // Deep link students land on after the teacher shares.
    url: record.shareUrl ?? `${origin}/resources/${record.id}`,
    title: record.title,
    body: record.assignmentInstructions ?? record.summary ?? '',
    // Teams compose text — fold in the course/spec so the post is self-describing.
    message: course ? `${course.name} – ${record.title}` : record.title,
    itemType: 'assignment',
  };
}

/**
 * @param {Object} props
 * @param {import('./ShareToClass').ShareResource} props.resource
 * @param {string} [props.label='Assign']
 * @param {number} [props.size=32]
 * @param {Array<'google'|'teams'>} [props.targets]
 */
export default function ResourceShareMenu({ resource, label = 'Assign', size = 32, targets }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!resource?.url) return null;

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label} ▾
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            zIndex: 50,
            marginTop: 4,
            padding: 8,
            background: '#fff',
            border: '1px solid #d6d6d6',
            borderRadius: 8,
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap',
          }}
        >
          <Suspense fallback={<span style={{ fontSize: 13 }}>Loading sharing options…</span>}>
            <ShareToClass resource={resource} size={size} targets={targets} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Example: rendering a dynamic, per-course resource list
 * ----------------------------------------------------------------------------
 *
 * import ResourceShareMenu, { toShareResource } from './ResourceShareMenu';
 *
 * function CourseResources({ course, resources }) {
 *   return (
 *     <ul>
 *       {resources.map((r) => (
 *         // Stable key per resource so React (and any virtualiser) reconciles cleanly
 *         <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
 *           <span>{r.title}</span>
 *           <ResourceShareMenu resource={toShareResource(r, course)} />
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 *
 * Works unchanged inside react-window / react-virtuoso: rows mount and unmount on
 * scroll, the menu mounts ShareToClass on demand, and unmounting a row removes the
 * vendor widget with its container. The module-level script loaders survive route
 * changes, so navigating between courses never re-fetches platform.js / launcher.js.
 * -------------------------------------------------------------------------- */
