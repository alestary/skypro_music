import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SearchInput from './SearchInput';

describe('SearchInput', () => {
  it('shows the current value and reports changes', () => {
    const onChange = vi.fn();
    render(<SearchInput value="Alpha" onChange={onChange} />);
    const input = screen.getByRole('searchbox', { name: 'Поиск треков по названию' });
    expect(input).toHaveValue('Alpha');
    fireEvent.change(input, { target: { value: 'Beta' } });
    expect(onChange).toHaveBeenCalledWith('Beta');
  });
});
