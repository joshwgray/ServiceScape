import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DetailsPanel } from '../DetailsPanel.tsx';

// Mock store
vi.mock('../../../stores/selectionStore');

describe('DetailsPanel', () => {
    it('renders nothing when no item selected', () => {
        render(<DetailsPanel item={null} />);
        expect(screen.queryByText('Details')).not.toBeInTheDocument();
    });

    it('renders service details', async () => {
        const item = {
            id: '1',
            name: 'Auth Service',
            type: 'service',
            tiers: ['critical'],
            owner: 'Auth Team'
        };
        render(<DetailsPanel item={item} />);
        
        expect(screen.getByText('Auth Service')).toBeInTheDocument();
        expect(screen.getByText('service')).toBeInTheDocument(); // Lowercase per implementation style
        expect(screen.getByText('Auth Team', { exact: false })).toBeInTheDocument();
    });

    it('renders dependency counts if available', () => {
        const item = {
            id: '1',
            name: 'Auth Service',
            type: 'service',
            stats: {
                upstream: 5,
                downstream: 3
            }
        };
        render(<DetailsPanel item={item} />);
        
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Upstream')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Downstream')).toBeInTheDocument();
    });
});
