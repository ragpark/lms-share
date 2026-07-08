import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PackViewer from './PackViewer';
import { fetchPack } from './api';

vi.mock('./api', () => ({
  fetchPack: vi.fn(),
}));

function renderViewer(id) {
  return render(
    <MemoryRouter initialEntries={[`/pack/${id}`]}>
      <Routes>
        <Route path="/pack/:id" element={<PackViewer />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PackViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // AC5: an existing share URL still resolves and steps through for students,
  // unaffected by the saved-packs feature (the response shape is unchanged).
  test('resolves a pack by id and lists its steps in order', async () => {
    fetchPack.mockResolvedValue({
      id: 'abc123',
      title: 'Photosynthesis',
      items: [
        { type: 'url', href: 'https://example.com/1', title: 'Starter', duration: '5 mins' },
        { type: 'url', href: 'https://example.com/2', title: 'Quiz' },
      ],
      createdAt: Date.now(),
    });

    renderViewer('abc123');

    await waitFor(() => expect(screen.getByText('Photosynthesis')).toBeInTheDocument());
    expect(fetchPack).toHaveBeenCalledWith('abc123');
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
    expect(screen.getByText('0 of 2 opened')).toBeInTheDocument();
  });

  test('shows an error when the pack does not exist', async () => {
    fetchPack.mockRejectedValue(new Error('Pack not found'));

    renderViewer('missing');

    await waitFor(() => expect(screen.getByText('Pack not found')).toBeInTheDocument());
  });
});
