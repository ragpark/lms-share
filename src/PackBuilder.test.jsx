import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PackBuilder from './PackBuilder';
import { createPack, updatePack, fetchPack, reviewDraftPack } from './api';

vi.mock('./api', () => ({
  createPack: vi.fn(),
  updatePack: vi.fn(),
  fetchPack: vi.fn(),
  reviewDraftPack: vi.fn(),
}));

function renderBuilder(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<PackBuilder />} />
        <Route path="/pack/:id/edit" element={<PackBuilder />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PackBuilder', () => {
  beforeEach(() => vi.clearAllMocks());

  test('disables AI review until title and valid URL steps exist, then renders review', async () => {
    reviewDraftPack.mockResolvedValue({
      summary: 'This looks like a revision sequence inferred from metadata.',
      coherence: { rating: 'strong', comment: 'The order is clear.' },
      bestSuitedFor: ['revision'],
      pedagogicalApproach: { label: 'Guided revision', comment: 'Moves from recap to practice.' },
      metacognition: { rating: 'moderate', comment: 'Some checking is present.', missingPrompts: ['Add confidence rating.'] },
      strengths: ['Clear titles'],
      risksOrGaps: ['No exit reflection'],
      suggestedImprovements: ['Add a reflection prompt'],
      stepNotes: [{ step: 1, title: 'Quiz', comment: 'Good checkpoint.', suggestion: 'Ask pupils to explain one error.' }],
      limitations: ['Actual web page contents were not inspected.'],
    });

    renderBuilder();
    const reviewButton = screen.getByRole('button', { name: /review lesson with ai/i });
    expect(reviewButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/pack title/i), { target: { value: 'Biology revision' } });
    fireEvent.change(screen.getByLabelText(/step label/i), { target: { value: 'Quiz' } });
    fireEvent.change(screen.getByLabelText(/resource url/i), { target: { value: 'https://example.com/quiz' } });
    fireEvent.click(screen.getByRole('button', { name: /add step/i }));

    expect(screen.getByRole('button', { name: /review lesson with ai/i })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /review lesson with ai/i }));

    await waitFor(() => expect(screen.getByText(/revision sequence inferred/i)).toBeInTheDocument());
    expect(screen.getByText(/actual web page contents were not inspected/i)).toBeInTheDocument();
  });

  // AC1: saving a valid pack stores it and shows a saved confirmation.
  test('creates a new pack and shows a saved confirmation with the share link', async () => {
    createPack.mockResolvedValue({ id: 'abc123', url: '/pack/abc123' });

    renderBuilder();
    fireEvent.change(screen.getByLabelText(/pack title/i), { target: { value: 'Biology revision' } });
    fireEvent.change(screen.getByLabelText(/resource url/i), { target: { value: 'https://example.com/quiz' } });
    fireEvent.click(screen.getByRole('button', { name: /add step/i }));

    fireEvent.click(screen.getByRole('button', { name: /create pack/i }));

    await waitFor(() => expect(screen.getByText(/lesson pack created/i)).toBeInTheDocument());
    expect(createPack).toHaveBeenCalledWith({
      title: 'Biology revision',
      items: [expect.objectContaining({ href: 'https://example.com/quiz' })],
    });
  });

  // AC4: a failed save keeps the draft visible and shows an actionable error.
  test('keeps the draft visible and shows an error when saving fails', async () => {
    createPack.mockRejectedValue(new Error('Failed to create pack'));

    renderBuilder();
    fireEvent.change(screen.getByLabelText(/pack title/i), { target: { value: 'Biology revision' } });
    fireEvent.change(screen.getByLabelText(/resource url/i), { target: { value: 'https://example.com/quiz' } });
    fireEvent.click(screen.getByRole('button', { name: /add step/i }));

    fireEvent.click(screen.getByRole('button', { name: /create pack/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to create pack'));
    expect(screen.getByLabelText(/pack title/i)).toHaveValue('Biology revision');
    expect(screen.getAllByDisplayValue('https://example.com/quiz').length).toBeGreaterThan(0);
  });

  // AC3: reopening a saved pack loads it, and saving again updates it in place.
  test('loads a saved pack for editing and updates it in place on save', async () => {
    fetchPack.mockResolvedValue({
      id: 'abc123',
      title: 'Old title',
      items: [{ type: 'url', href: 'https://example.com/old', title: 'Old step' }],
      createdAt: Date.now(),
    });
    updatePack.mockResolvedValue({ id: 'abc123', url: '/pack/abc123', updatedAt: Date.now() });

    renderBuilder('/pack/abc123/edit');

    await waitFor(() => expect(screen.getByLabelText(/pack title/i)).toHaveValue('Old title'));
    expect(fetchPack).toHaveBeenCalledWith('abc123');

    fireEvent.change(screen.getByLabelText(/pack title/i), { target: { value: 'New title' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(screen.getByText(/lesson pack saved/i)).toBeInTheDocument());
    expect(updatePack).toHaveBeenCalledWith('abc123', expect.objectContaining({ title: 'New title' }));
  });
});
