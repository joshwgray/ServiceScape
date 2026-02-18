
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceFloor } from '../ServiceFloor';
import { Service } from '@servicescape/shared';

// Mock R3F components
vi.mock('@react-three/drei', () => ({
  Text: ({ children }: any) => <div data-testid="text">{children}</div>,
  Box: (props: any) => <div data-testid="box" {...props} />
}));

describe('ServiceFloor', () => {
  const mockService: Service = {
    id: '1',
    name: 'Test Service',
    teamId: 'team1',
    description: 'A test service',
    metadata: {}
  };

  it('renders correctly', () => {
    render(<ServiceFloor service={mockService} position={[0, 0, 0]} height={0.5} />);

    // Expect the text label to be rendered with service name
    expect(screen.getByTestId('text')).toHaveTextContent('Test Service');
  });
});
