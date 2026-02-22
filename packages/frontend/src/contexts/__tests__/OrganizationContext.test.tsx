import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useEffect, useLayoutEffect } from 'react';
import { OrganizationProvider, useOrganization } from '../OrganizationContext';

// Mock useOrganizationData hook
vi.mock('../../hooks/useOrganizationData', () => ({
  useOrganizationData: () => ({
    domains: [],
    teams: [],
    services: [],
    layout: null,
    loading: false,
    error: null,
  }),
}));

const TestConsumer = ({ serviceId, position }: { serviceId: string, position: [number, number, number] }) => {
    const { registerServicePosition, renderedPositions } = useOrganization();

    useEffect(() => {
        registerServicePosition(serviceId, position);
    }, [serviceId, position, registerServicePosition]);

    return (
        <div data-testid="positions">
            {JSON.stringify(renderedPositions)}
        </div>
    );
};

describe('OrganizationContext', () => {
    it('updates rendered positions map when registerServicePosition is called', () => {
        render(
            <OrganizationProvider>
                <div data-testid="child">
                    <TestConsumer serviceId="s1" position={[10, 20, 30]} />
                </div>
            </OrganizationProvider>
        );

        const positionsDiv = screen.getByTestId('positions');
        expect(positionsDiv).toHaveTextContent('"s1":[10,20,30]');
    });

    it('merges multiple positions correctly', () => {
        const MultiConsumer = () => {
             const { registerServicePosition, renderedPositions } = useOrganization();
             
             useEffect(() => {
                 registerServicePosition('s1', [1, 2, 3]);
                 registerServicePosition('s2', [4, 5, 6]);
             }, [registerServicePosition]);

             return <div data-testid="positions">{JSON.stringify(renderedPositions)}</div>;
        };

        render(
            <OrganizationProvider>
                <MultiConsumer />
            </OrganizationProvider>
        );

        const positionsDiv = screen.getByTestId('positions');
        expect(positionsDiv).toHaveTextContent('"s1":[1,2,3]');
        expect(positionsDiv).toHaveTextContent('"s2":[4,5,6]');
    });

    it('does not cause re-render or change state reference if position is unchanged (optimization)', () => {
        let lastRenderedPositions: Record<string, [number, number, number]> | undefined;
        let registerFn: (id: string, pos: [number, number, number]) => void = () => {};

        const TestComponent = () => {
            const { registerServicePosition, renderedPositions } = useOrganization();
            lastRenderedPositions = renderedPositions;
            registerFn = registerServicePosition;
            useLayoutEffect(() => {
                // Register initial position
                registerServicePosition('s1', [1, 2, 3]);
            }, [registerServicePosition]);
            return null;
        };

        render(
            <OrganizationProvider>
                <TestComponent />
            </OrganizationProvider>
        );

        // Initial update happens in effect, verify state
        expect(lastRenderedPositions).toEqual({ s1: [1, 2, 3] });
        const positionsAfterFirstUpdate = lastRenderedPositions;

        // Update with SAME position
        act(() => {
            registerFn('s1', [1, 2, 3]);
        });
        
        // Reference should be exactly the same object
        expect(lastRenderedPositions).toBe(positionsAfterFirstUpdate);
    });
});
