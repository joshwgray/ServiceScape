import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearch } from '../useSearch';

describe('useSearch', () => {
    const items = [
        { id: '1', name: 'Auth Service', type: 'service' },
        { id: '2', name: 'User Service', type: 'service' },
        { id: '3', name: 'Payment Gateway', type: 'service' },
        { id: '4', name: 'Authentication Team', type: 'team' },
    ];

    it('returns all items when query is empty', () => {
        const { result } = renderHook(() => useSearch(items, '', ['name']));
        expect(result.current).toEqual(items);
    });

    it('filters items by case-insensitive substring', () => {
        const { result } = renderHook(() => useSearch(items, 'auth', ['name']));
        const names = result.current.map((i: any) => i.name);
        expect(names).toContain('Auth Service');
        expect(names).toContain('Authentication Team');
        expect(names).not.toContain('User Service');
    });

    it('ranks exact matches higher than partial matches (if implemented)', () => {
         // This depends on "ranking" requirement. 
         // Let's assume simplest implementation first: filter.
         // If ranking is needed:
         const { result } = renderHook(() => useSearch(items, 'Auth', ['name']));
         expect(result.current[0].name).toBe('Auth Service'); // Starts with Auth
         // "Authentication Team" also starts with Auth.
         // Let's try exact match scenario
         const items2 = [
             { name: 'Service Auth' },
             { name: 'Auth' }
         ];
         const { result: res2 } = renderHook(() => useSearch(items2, 'Auth', ['name']));
         expect(res2.current[0].name).toBe('Auth');
    });

    it('excludes items that do not match', () => {
        const { result } = renderHook(() => useSearch(items, 'XYZ', ['name']));
        expect(result.current).toHaveLength(0);
    });
});
