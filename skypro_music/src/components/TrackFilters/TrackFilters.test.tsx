import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrackFilters from './TrackFilters';
import { EMPTY_FILTERS } from '@/lib/trackFilters';

describe('TrackFilters', () => {
  it('opens a filter and reports checkbox changes', () => {
    const onToggle = vi.fn();
    render(<TrackFilters options={{ author: ['Artist A'], genre: ['Pop'], year: ['2020'] }} selected={EMPTY_FILTERS} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'исполнителю' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Artist A' }));
    expect(onToggle).toHaveBeenCalledWith('author', 'Artist A');
  });

  it('shows selected count and empty options message', () => {
    render(<TrackFilters options={{ author: [], genre: [], year: [] }} selected={{ author: ['Artist A'], genre: [], year: [] }} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'исполнителю (1)' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'жанру' }));
    expect(screen.getByText('Нет данных')).toBeInTheDocument();
  });
});
