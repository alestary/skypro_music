import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrackSort from './TrackSort';

describe('TrackSort', () => {
  it('shows the current sorting option and reports a new option', () => {
    const onChange = vi.fn();
    render(<TrackSort value="default" onChange={onChange} />);
    const select = screen.getByRole('combobox', { name: 'Сортировка треков по дате' });
    expect(select).toHaveValue('default');
    fireEvent.change(select, { target: { value: 'newest' } });
    expect(onChange).toHaveBeenCalledWith('newest');
  });
});
