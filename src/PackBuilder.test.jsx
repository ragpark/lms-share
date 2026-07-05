import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PackBuilder from './PackBuilder';
import { reviewDraftPack } from './api';

vi.mock('./api', () => ({
  createPack: vi.fn(),
  reviewDraftPack: vi.fn(),
}));

describe('PackBuilder templates', () => {
  beforeEach(() => vi.clearAllMocks());

  test('hides teaching template cards until the toggle button is clicked', () => {
    render(<PackBuilder />);

    const toggle = screen.getByRole('button', { name: /show templates/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('heading', { name: /homework task/i })).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: /hide templates/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: /homework task/i })).toBeInTheDocument();
  });

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

    render(<PackBuilder />);
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
});
