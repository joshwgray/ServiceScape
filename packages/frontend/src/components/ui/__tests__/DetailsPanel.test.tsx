/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { DetailsPanel } from '../DetailsPanel.tsx';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

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

    it('renders links if provided', () => {
        const item: any = {
            id: '1',
            name: 'Service with Links',
            links: [
                { label: 'Documentation', url: 'http://docs.example.com' },
                { label: 'Repo', url: 'http://git.example.com' }
            ]
        };

        render(<DetailsPanel item={item} />);

        const docLink = screen.getByText('Documentation');
        expect(docLink).toBeInTheDocument();
        expect(docLink.closest('a')).toHaveAttribute('href', 'http://docs.example.com');

        const repoLink = screen.getByText('Repo');
        expect(repoLink).toBeInTheDocument();
        expect(repoLink.closest('a')).toHaveAttribute('href', 'http://git.example.com');
    });

    it('renders tiers as tags', () => {
        const item: any = {
            id: '1',
            name: 'Tiered Service',
            tiers: ['Gold', 'Critical']
        };

        render(<DetailsPanel item={item} />);

        expect(screen.getByText('Tiers')).toBeInTheDocument();
        expect(screen.getByText('Gold')).toBeInTheDocument();
        expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    describe('Team Members', () => {
        const teamItem = {
            id: 'team-1',
            name: 'Core Team',
            type: 'team'
        };

        it('shows loading state when members are loading', () => {
            render(<DetailsPanel item={teamItem} membersLoading={true} />);
            expect(screen.getByText('Loading members...')).toBeInTheDocument();
        });

        it('shows empty state when no members found', () => {
            render(<DetailsPanel item={teamItem} members={[]} membersLoading={false} />);
            expect(screen.getByText('No team members')).toBeInTheDocument();
        });

        it('renders list of members with avatars', () => {
            const members = [
                { id: '1', name: 'Alice Engineer', role: 'Engineer', teamId: 'team-1', email: 'alice@example.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                { id: '2', name: 'Bob Manager', role: 'Manager', teamId: 'team-1', email: 'bob@example.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            ];
            
            render(<DetailsPanel item={teamItem} members={members} membersLoading={false} />);
            
            expect(screen.getByText('Team Members')).toBeInTheDocument();
            expect(screen.getByText('Alice Engineer')).toBeInTheDocument();
            expect(screen.getByText('Engineer')).toBeInTheDocument();
            expect(screen.getByText('Bob Manager')).toBeInTheDocument();
            expect(screen.getByText('Manager')).toBeInTheDocument();
            
            // Verify avatars are present
            const avatars = screen.getAllByRole('img');
            expect(avatars.length).toBeGreaterThan(0);
        });
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        const item = {
            id: '1',
            name: 'Auth Service',
            type: 'service',
        } as any;
        
        render(<DetailsPanel item={item} onClose={onClose} />);
        
        const closeButton = screen.getByLabelText('Close details panel');
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
    });
});

