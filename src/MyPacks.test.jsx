import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyPacks from './MyPacks';
import { fetchMyPacks } from './api';

vi.mock('./api', () => ({
  fetchMyPacks: vi.fn(),
}));

function renderMyPacks() {
  return render(
    <MemoryRouter>
      <MyPacks />
    </MemoryRouter>,
  );
}

describe('MyPacks', () => {
  beforeEach(() => vi.clearAllMocks());

  // AC2: teacher opening My packs sees a list with enough info to choose the correct pack.
  test('renders saved packs with title, step count, and links to edit/view', async () => {
    fetchMyPacks.mockResolvedValue({
      packs: [
        { id: 'abc123', title: 'Photosynthesis', itemCount: 3, createdAt: Date.now(), updatedAt: Date.now(), url: '/pack/abc123' },
      ],
    });

    renderMyPacks();

    await waitFor(() => expect(screen.getByText('Photosynthesis')).toBeInTheDocument());
    expect(screen.getByText(/3 steps/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open in builder/i })).toHaveAttribute('href', '/pack/abc123/edit');
    expect(screen.getByRole('link', { name: /view share link/i })).toHaveAttribute('href', '/pack/abc123');
  });

  // Empty state: explains that saved packs appear after the teacher saves one.
  test('shows an empty state when there are no saved packs', async () => {
    fetchMyPacks.mockResolvedValue({ packs: [] });

    renderMyPacks();

    await waitFor(() => expect(screen.getByText(/no saved packs yet/i)).toBeInTheDocument());
  });

  test('shows an actionable error when the list fails to load', async () => {
    fetchMyPacks.mockRejectedValue(new Error('Failed to load saved packs'));

    renderMyPacks();

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load saved packs'));
  });
});
