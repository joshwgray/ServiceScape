import { render, screen } from '@testing-library/react';
import { SpeechBubbleContent } from '../SpeechBubbleContent.tsx';
import { describe, it, expect } from 'vitest';

const mockItem = {
  id: 'service-1',
  name: 'Test Service',
  type: 'service',
  description: 'A test service description',
  owner: 'Team Blue',
  members: ['Alice', 'Bob'],
  stats: {
    upstream: 5,
    downstream: 3,
  },
  tiers: ['Bronze', 'Silver'],
  links: [{ label: 'Docs', url: 'http://docs.example.com' }],
};

describe('SpeechBubbleContent', () => {
  it('renders service name and type', () => {
    render(<SpeechBubbleContent item={mockItem} />);
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('service')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<SpeechBubbleContent item={mockItem} />);
    expect(screen.getByText('A test service description')).toBeInTheDocument();
  });

  it('renders owner information', () => {
    render(<SpeechBubbleContent item={mockItem} />);
    expect(screen.getByText('Owner:')).toBeInTheDocument();
    expect(screen.getByText('Team Blue')).toBeInTheDocument();
  });

  it('renders statistics', () => {
    render(<SpeechBubbleContent item={mockItem} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Upstream')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Downstream')).toBeInTheDocument();
  });

  it('renders tiers', () => {
    render(<SpeechBubbleContent item={mockItem} />);
    expect(screen.getByText('Bronze')).toBeInTheDocument();
    expect(screen.getByText('Silver')).toBeInTheDocument();
  });

  it('renders links', () => {
    render(<SpeechBubbleContent item={mockItem} />);
    const link = screen.getByText('Docs');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'http://docs.example.com');
  });

  it('renders fallback members list when detailed members are not provided', () => {
      render(<SpeechBubbleContent item={mockItem} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders loading state for members', () => {
      render(<SpeechBubbleContent item={mockItem} membersLoading={true} />);
      expect(screen.getByText('Loading members...')).toBeInTheDocument();
  });
});
