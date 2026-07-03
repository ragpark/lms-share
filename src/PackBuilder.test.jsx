import { describe, expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PackBuilder from './PackBuilder';

describe('PackBuilder templates', () => {
  test('hides teaching template cards until the toggle button is clicked', () => {
    render(<PackBuilder />);

    const toggle = screen.getByRole('button', { name: /show templates/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('heading', { name: /homework task/i })).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: /hide templates/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: /homework task/i })).toBeInTheDocument();
  });
});
