import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar.tsx';

// Mock useSearch properly since we test integration of search within SearchBar or rely on mock.
// If actual implementation uses useSearch hook, we can mock it here.
vi.mock('../../../hooks/useSearch', () => ({
  useSearch: (items: any[], query: string, _: string[]) => {
      // Simple filter mock
      if (!query) return [];
      return items.filter((item: any) => item.name.toLowerCase().includes(query.toLowerCase()));
  }
}));

describe('SearchBar', () => {
    const items = [
        { id: '1', name: 'Service A', type: 'service' },
        { id: '2', name: 'Service B', type: 'service' },
    ];
    const onSelect = vi.fn();

    it('renders search input', () => {
        render(<SearchBar items={items} onSelect={onSelect} />);
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('shows results when typing', () => {
        render(<SearchBar items={items} onSelect={onSelect} />);
        const input = screen.getByPlaceholderText('Search...');
        
        fireEvent.change(input, { target: { value: 'Service' } });
        
        expect(screen.getByText('Service A')).toBeInTheDocument();
        expect(screen.getByText('Service B')).toBeInTheDocument();
    });

    it('calls onSelect when clicking a result', () => {
        render(<SearchBar items={items} onSelect={onSelect} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'Service A' } });
        
        const result = screen.getByText('Service A');
        fireEvent.click(result);
        
        expect(onSelect).toHaveBeenCalledWith(items[0]); // Returns item object or ID? Prompt says click to select. Usually select whole object.
    });

    it('closes suggestions on Escape', () => {
        render(<SearchBar items={items} onSelect={onSelect} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'Service' } });
        expect(screen.getByText('Service A')).toBeInTheDocument();
        
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(screen.queryByText('Service A')).not.toBeInTheDocument();
    });
});
