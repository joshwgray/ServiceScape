
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceFloor } from '../ServiceFloor';
import { Service } from '@servicescape/shared';

// Mock R3F components
vi.mock('@react-three/drei', () => ({
  Text: ({ children }: any) => <div data-testid="text">{children}</div>,
  Box: (props: any) => <div data-testid="box" {...props} />
}));

// Mock useInteraction to avoid requiring OrganizationProvider context
vi.mock('../../hooks/useInteraction', () => ({
  useInteraction: () => ({
    hoveredId: null,
    handleClick: () => () => {},
    handlePointerOver: () => () => {},
    handlePointerOut: () => {},
  }),
}));

// Mock LegoBrick component to test prop passing
const mockLegoBrick = vi.fn();
vi.mock('../LegoBrick', () => ({
  LegoBrick: (props: any) => {
    mockLegoBrick(props);
    return <div data-testid="lego-brick" />;
  },
}));

describe('ServiceFloor', () => {
  const mockService: Service = {
    id: '1',
    name: 'Test Service',
    teamId: 'team1',
    description: 'A test service',
    metadata: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ServiceFloor service={mockService} position={[0, 0, 0]} height={0.5} />);

    // Expect the text label to be rendered with service name
    expect(screen.getByTestId('text')).toHaveTextContent('Test Service');
  });

  it('should render with reduced opacity when building not selected', () => {
    render(
      <ServiceFloor 
        service={mockService} 
        position={[0, 0, 0]} 
        height={0.5}
        opacity={0.15}
      />
    );

    // Check that LegoBrick received opacity prop
    expect(mockLegoBrick).toHaveBeenCalledWith(
      expect.objectContaining({
        opacity: 0.15,
      })
    );
  });

  it('should render with full opacity when building is selected', () => {
    render(
      <ServiceFloor 
        service={mockService} 
        position={[0, 0, 0]} 
        height={0.5}
        opacity={1.0}
      />
    );

    // Check that LegoBrick received opacity of 1.0
    expect(mockLegoBrick).toHaveBeenCalledWith(
      expect.objectContaining({
        opacity: 1.0,
      })
    );
  });

  it('should pass transparent prop to LegoBrick when opacity is less than 1', () => {
    render(
      <ServiceFloor 
        service={mockService} 
        position={[0, 0, 0]} 
        height={0.5}
        opacity={0.5}
      />
    );

    // Check that LegoBrick received transparent prop
    expect(mockLegoBrick).toHaveBeenCalledWith(
      expect.objectContaining({
        transparent: true,
      })
    );
  });
});
