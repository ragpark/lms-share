/**
 * Tests for the LMS share feature (Vitest + React Testing Library).
 *
 * Run: `npm test` (once) or `npm run test:watch`.
 *
 * Strategy: pre-set the vendor globals BEFORE rendering. The module-level loaders
 * return early when window.shareToMicrosoftTeams / window.gapi.sharetoclassroom
 * already exist, so no <script> is injected and the tests stay deterministic.
 */

import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ShareToClass, { ShareToTeams, ShareToGoogleClassroom } from './ShareToClass';
import ResourceShareMenu, { toShareResource } from './ResourceShareMenu';

const RESOURCE = {
  url: 'https://platform.test/gcse/maths/algebra-3',
  title: 'GCSE Maths: Algebra worksheet 3',
  body: 'Complete and submit by Friday.',
  message: 'GCSE Maths – algebra practice',
};

function mockTeams() {
  const renderButtons = vi.fn();
  window.shareToMicrosoftTeams = { renderButtons };
  return renderButtons;
}

function mockGoogle() {
  const render = vi.fn();
  window.gapi = { sharetoclassroom: { render } };
  return render;
}

afterEach(() => {
  delete window.shareToMicrosoftTeams;
  delete window.gapi;
  delete window.___gcfg;
  vi.clearAllMocks();
});

describe('ShareToTeams', () => {
  test('renders the share span with mapped data-* attributes and calls renderButtons on its node', async () => {
    const renderButtons = mockTeams();
    const { container } = render(<ShareToTeams resource={RESOURCE} />);

    const span = container.querySelector('.teams-share-button');
    expect(span).toBeTruthy();
    expect(span).toHaveAttribute('data-href', RESOURCE.url);
    expect(span).toHaveAttribute('data-assign-title', RESOURCE.title);
    expect(span).toHaveAttribute('data-assign-instr', RESOURCE.body);
    expect(span).toHaveAttribute('data-msg-text', RESOURCE.message);

    await waitFor(() => expect(renderButtons).toHaveBeenCalledTimes(1));
    expect(renderButtons).toHaveBeenCalledWith({ elements: [span] });
  });

  test('renders nothing without a url', () => {
    mockTeams();
    const { container } = render(<ShareToTeams resource={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('falls back to an "Open resource" link when the launcher is unavailable', async () => {
    window.shareToMicrosoftTeams = {}; // present but missing renderButtons -> component throws -> fallback
    render(<ShareToTeams resource={RESOURCE} />);

    const link = await screen.findByRole('link', { name: /open resource/i });
    expect(link).toHaveAttribute('href', RESOURCE.url);
  });
});

describe('ShareToGoogleClassroom', () => {
  test('calls gapi.sharetoclassroom.render with mapped params and the right node', async () => {
    const renderFn = mockGoogle();
    const { container } = render(<ShareToGoogleClassroom resource={RESOURCE} />);
    const el = container.querySelector('.g-sharetoclassroom');

    await waitFor(() => expect(renderFn).toHaveBeenCalledTimes(1));
    const [node, params] = renderFn.mock.calls[0];
    expect(node).toBe(el);
    expect(params).toMatchObject({
      url: RESOURCE.url,
      title: RESOURCE.title,
      body: RESOURCE.body,
      itemtype: 'assignment',
    });
  });

  test('respects an explicit itemType', async () => {
    const renderFn = mockGoogle();
    render(<ShareToGoogleClassroom resource={{ ...RESOURCE, itemType: 'announcement' }} />);
    await waitFor(() => expect(renderFn).toHaveBeenCalled());
    expect(renderFn.mock.calls[0][1].itemtype).toBe('announcement');
  });
});

describe('ShareToClass (combined)', () => {
  test('renders both buttons by default', async () => {
    const renderButtons = mockTeams();
    const renderFn = mockGoogle();
    const { container } = render(<ShareToClass resource={RESOURCE} />);

    expect(container.querySelector('.teams-share-button')).toBeTruthy();
    expect(container.querySelector('.g-sharetoclassroom')).toBeTruthy();
    await waitFor(() => {
      expect(renderButtons).toHaveBeenCalled();
      expect(renderFn).toHaveBeenCalled();
    });
  });

  test('respects targets selection', () => {
    mockTeams();
    mockGoogle();
    const { container } = render(<ShareToClass resource={RESOURCE} targets={['teams']} />);
    expect(container.querySelector('.teams-share-button')).toBeTruthy();
    expect(container.querySelector('.g-sharetoclassroom')).toBeNull();
  });
});

describe('toShareResource', () => {
  test('maps a course resource record to the share shape', () => {
    const out = toShareResource(
      { id: '42', title: 'Photosynthesis', summary: 'Bio unit 3' },
      { name: 'Year 11 Biology' },
    );
    expect(out.url).toContain('/resources/42');
    expect(out.title).toBe('Photosynthesis');
    expect(out.body).toBe('Bio unit 3');
    expect(out.message).toContain('Year 11 Biology');
    expect(out.itemType).toBe('assignment');
  });
});

describe('ResourceShareMenu', () => {
  test('is collapsed initially and mounts the share buttons on open', async () => {
    mockTeams();
    mockGoogle();
    render(<ResourceShareMenu resource={RESOURCE} />);

    const trigger = screen.getByRole('button', { name: /assign/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await waitFor(() => expect(document.querySelector('.teams-share-button')).toBeTruthy());
  });

  test('closes on Escape', async () => {
    mockTeams();
    mockGoogle();
    render(<ResourceShareMenu resource={RESOURCE} />);

    const trigger = screen.getByRole('button', { name: /assign/i });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  });
});
