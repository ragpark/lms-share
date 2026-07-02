/**
 * ShareToClass — a drop-in "Share to Google Classroom / Microsoft Teams" control.
 *
 * Renders one or both share buttons from a single unified `resource` and lets the
 * teacher push the content into whichever LMS their school uses. Wraps each
 * vendor's official client script:
 *   • Google Classroom — https://apis.google.com/js/platform.js  (gapi.sharetoclassroom)
 *   • Microsoft Teams   — https://teams.microsoft.com/share/launcher.js  (shareToMicrosoftTeams)
 *
 * This is the lightweight, client-side tier: no OAuth app registration, no admin
 * consent, no Classroom/Graph API keys. It shares a LINK / reference only — there
 * is NO grade passback on either side. For marks flowing back into the gradebook
 * you need the server-side integrations (Classroom CourseWork API; Graph
 * educationAssignment + submission), which are a separate, heavier build.
 *
 * Per-platform constraints to set expectations against:
 *   Google Classroom — user signs in with a Google Workspace for Education account;
 *     `itemType` controls whether it posts as an assignment/announcement/material/question.
 *   Microsoft Teams  — desktop Edge or Chrome only; no guest/freemium accounts; the
 *     "Create an Assignment" option needs an O365 Education tenant and the teacher to
 *     have rostered classes (typically via School Data Sync).
 *
 * Usage:
 *   <ShareToClass
 *     targets={['google', 'teams']}            // omit to show both
 *     resource={{
 *       url: 'https://yourplatform.com/gcse/maths/algebra-worksheet-3',
 *       title: 'GCSE Maths: Algebra worksheet 3',
 *       body: 'Complete the worksheet and submit by Friday.',
 *       message: 'GCSE Maths – algebra practice',   // Teams compose text (optional)
 *       itemType: 'assignment',                      // Google only (default 'assignment')
 *     }}
 *   />
 */

import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ *
 * Script loaders — each loads its vendor script exactly once per page *
 * ------------------------------------------------------------------ */

const TEAMS_SRC = 'https://teams.microsoft.com/share/launcher.js';
const GOOGLE_SRC = 'https://apis.google.com/js/platform.js';

let teamsPromise = null;
let googlePromise = null;

const hasDom = () => typeof window !== 'undefined' && typeof document !== 'undefined';

/** Load Microsoft's Share to Teams launcher once. @returns {Promise<void>} */
export function loadShareToTeamsLauncher() {
  if (!hasDom()) return Promise.reject(new Error('Share to Teams requires a browser environment'));
  if (window.shareToMicrosoftTeams) return Promise.resolve();
  if (teamsPromise) return teamsPromise;

  teamsPromise = new Promise((resolve, reject) => {
    const fail = () => {
      teamsPromise = null;
      reject(new Error('Failed to load Share to Teams launcher'));
    };
    const existing = document.querySelector('script[data-share-to-teams]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', fail);
      if (window.shareToMicrosoftTeams) resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = TEAMS_SRC;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-share-to-teams', 'true');
    s.onload = () => resolve();
    s.onerror = fail;
    document.body.appendChild(s);
  });
  return teamsPromise;
}

/** Load Google's Classroom share (platform.js) once, in explicit-render mode. @returns {Promise<void>} */
export function loadGoogleClassroomShare() {
  if (!hasDom()) return Promise.reject(new Error('Share to Classroom requires a browser environment'));
  if (window.gapi && window.gapi.sharetoclassroom) return Promise.resolve();
  if (googlePromise) return googlePromise;

  googlePromise = new Promise((resolve, reject) => {
    // Must be set BEFORE platform.js loads: render our elements explicitly rather
    // than letting the script auto-traverse and render every tag on the page.
    window.___gcfg = window.___gcfg || {};
    if (window.___gcfg.parsetags == null) window.___gcfg.parsetags = 'explicit';

    const waitForApi = () => {
      const start = Date.now();
      (function poll() {
        if (window.gapi && window.gapi.sharetoclassroom &&
            typeof window.gapi.sharetoclassroom.render === 'function') {
          return resolve();
        }
        if (Date.now() - start > 10000) {
          googlePromise = null;
          return reject(new Error('Classroom share API did not initialise'));
        }
        setTimeout(poll, 50);
      })();
    };

    const existing = document.querySelector('script[data-google-platform]');
    if (existing) {
      existing.addEventListener('load', waitForApi);
      existing.addEventListener('error', () => {
        googlePromise = null;
        reject(new Error('Failed to load Classroom share script'));
      });
      if (window.gapi) waitForApi();
      return;
    }
    const s = document.createElement('script');
    s.src = GOOGLE_SRC;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-google-platform', 'true');
    s.onload = waitForApi;
    s.onerror = () => {
      googlePromise = null;
      reject(new Error('Failed to load Classroom share script'));
    };
    document.body.appendChild(s);
  });
  return googlePromise;
}

/* ------------------------------------------------------------------ *
 * Shared types                                                        *
 * ------------------------------------------------------------------ */

/**
 * @typedef {Object} ShareResource
 * @property {string} url        Link to share. Required.
 * @property {string} [title]    Assignment title (Teams data-assign-title / Google title).
 * @property {string} [body]     Assignment instructions (Teams data-assign-instr / Google body).
 * @property {string} [message]  Teams compose-box text (data-msg-text). Falls back to title.
 * @property {('assignment'|'announcement'|'material'|'question')} [itemType] Google item type. Default 'assignment'.
 * @property {string} [courseId] Google course id to pre-select (optional).
 */

const linkFallback = (url, label, className) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
    {label}
  </a>
);

/* ------------------------------------------------------------------ *
 * Microsoft Teams button                                              *
 * ------------------------------------------------------------------ */

/**
 * @param {{ resource?: ShareResource, size?: number, preview?: boolean,
 *           className?: string, onError?: (e: Error) => void }} props
 */
export function ShareToTeams({ resource = null, size = 32, preview = true, className, onError }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  const { url, title, body, message } = resource || {};

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    setError(null);

    loadShareToTeamsLauncher()
      .then(() => {
        if (cancelled || !ref.current) return;
        const api = window.shareToMicrosoftTeams;
        if (!api || typeof api.renderButtons !== 'function') {
          throw new Error('Share to Teams launcher is unavailable');
        }
        api.renderButtons({ elements: [ref.current] });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        onError?.(err);
      });

    return () => { cancelled = true; };
  }, [url, title, body, message, size, preview, onError]);

  if (!url) return null;
  if (error) return linkFallback(url, 'Open resource', className);

  return (
    <span
      key={`teams|${url}|${title ?? ''}`}
      ref={ref}
      className={['teams-share-button', className].filter(Boolean).join(' ')}
      data-href={url}
      data-msg-text={message ?? title}
      data-assign-title={title}
      data-assign-instr={body}
      data-icon-px-size={String(size)}
      data-preview={String(preview)}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Google Classroom button                                             *
 * ------------------------------------------------------------------ */

/**
 * @param {{ resource?: ShareResource, size?: number, theme?: 'light'|'dark',
 *           className?: string, onShareStart?: Function, onShareComplete?: Function,
 *           onError?: (e: Error) => void }} props
 */
export function ShareToGoogleClassroom({
  resource = null,
  size = 32,
  theme,
  className,
  onShareStart,
  onShareComplete,
  onError,
}) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  const { url, title, body, itemType, courseId } = resource || {};

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    setError(null);

    loadGoogleClassroomShare()
      .then(() => {
        if (cancelled || !ref.current) return;
        // Pass params directly (don't URL-escape the url when using render()).
        const params = {
          url,
          size,
          theme,
          title,
          body,
          itemtype: itemType ?? 'assignment',
          courseid: courseId,
          onsharestart: onShareStart,
          onsharecomplete: onShareComplete,
        };
        Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
        window.gapi.sharetoclassroom.render(ref.current, params);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        onError?.(err);
      });

    return () => { cancelled = true; };
  }, [url, title, body, itemType, courseId, size, theme, onShareStart, onShareComplete, onError]);

  if (!url) return null;
  if (error) return linkFallback(url, 'Open resource', className);

  // Empty container; gapi.sharetoclassroom.render fills it. Fresh node per resource.
  return (
    <div
      key={`google|${url}|${title ?? ''}|${itemType ?? ''}`}
      ref={ref}
      className={['g-sharetoclassroom', className].filter(Boolean).join(' ')}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Combined control                                                    *
 * ------------------------------------------------------------------ */

/**
 * @param {Object} props
 * @param {ShareResource} [props.resource]
 * @param {Array<'google'|'teams'>} [props.targets=['google','teams']] Which buttons to show / order.
 * @param {number} [props.size=32]   Icon size in px for both buttons.
 * @param {number} [props.gap=8]     Gap (px) between the buttons.
 * @param {string} [props.className] Class applied to the wrapper.
 * @param {(e: Error) => void} [props.onError]
 */
export default function ShareToClass({
  resource = null,
  targets = ['google', 'teams'],
  size = 32,
  gap = 8,
  className,
  onError,
}) {
  if (!resource?.url) return null;

  const buttons = {
    google: <ShareToGoogleClassroom key="google" resource={resource} size={size} onError={onError} />,
    teams: <ShareToTeams key="teams" resource={resource} size={size} onError={onError} />,
  };

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: `${gap}px` }}
    >
      {targets.map((t) => buttons[t]).filter(Boolean)}
    </span>
  );
}
