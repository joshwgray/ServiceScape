import React from 'react';

export interface MemberAvatarProps {
  name?: string;
  role?: string;
  size?: number;
  className?: string; // Add className prop for flexibility
}

// The LEGO aesthetic and colors are a core part of this project's design.
// These colors approximate official LEGO brick colors.
const LEGO_COLORS = {
  yellow: '#FFD500', // Classic LEGO yellow
  blue: '#0055BF',
  red: '#E3000F',
  green: '#00852B',
  orange: '#F37B1D',
  purple: '#A91D3A',
  grey: '#CCCCCC',
  black: '#111111',
};

const getRoleColor = (role?: string): string => {
  if (!role) return LEGO_COLORS.grey;
  
  const normalizedRole = role.toLowerCase();
  
  if (normalizedRole.includes('engineer') || normalizedRole.includes('developer')) {
    return LEGO_COLORS.blue;
  }
  if (normalizedRole.includes('manager') || normalizedRole.includes('lead')) {
    return LEGO_COLORS.red;
  }
  if (normalizedRole.includes('designer') || normalizedRole.includes('ux')) {
    return LEGO_COLORS.green;
  }
  if (normalizedRole.includes('qa') || normalizedRole.includes('test')) {
    return LEGO_COLORS.orange;
  }
  if (normalizedRole.includes('product')) {
    return LEGO_COLORS.purple;
  }
  
  return LEGO_COLORS.grey;
};

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ 
  name, 
  role, 
  size = 32,
  className
}) => {
  const bodyColor = getRoleColor(role);
  const headColor = LEGO_COLORS.yellow; 

  // Simple SVG representation of a LEGO minifigure
  // Head is a circle (radius 30% of size)
  // Body is a rectangle (width 60% of size, height 40% of size)
  // Positioned so it fits within the square
  
  const headRadius = size * 0.3;
  const bodyWidth = size * 0.7;
  const neckHeight = size * 0.05;
  const neckWidth = size * 0.3;

  return (
    <div 
      className={className}
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
      role="img"
      aria-label={`${role || 'Unknown'} avatar`}
      title={name || role || 'Team Member'}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head */}
        <circle 
          cx={size / 2} 
          cy={size * 0.35} 
          r={headRadius} 
          fill={headColor}
          stroke="#333"
          strokeWidth="1"
        />
        
        {/* Face details (simple) */}
        <circle cx={size / 2 - headRadius * 0.3} cy={size * 0.35} r={headRadius * 0.1} fill="black" />
        <circle cx={size / 2 + headRadius * 0.3} cy={size * 0.35} r={headRadius * 0.1} fill="black" />
        <path 
           d={`M ${size / 2 - headRadius * 0.3} ${size * 0.45} Q ${size / 2} ${size * 0.55} ${size / 2 + headRadius * 0.3} ${size * 0.45}`}
           fill="none"
           stroke="black"
           strokeWidth="1"
           strokeLinecap="round"
        />

        {/* Neck */}
        <rect
            x={(size - neckWidth) / 2}
            y={size * 0.6}
            width={neckWidth}
            height={neckHeight}
            fill={headColor}
            stroke="#333"
            strokeWidth="0"
        />

        {/* Body */}
        <path
          d={`
            M ${(size - bodyWidth) / 2} ${size * 0.65} 
            L ${(size + bodyWidth) / 2} ${size * 0.65} 
            L ${(size + bodyWidth) / 2} ${size} 
            L ${(size - bodyWidth) / 2} ${size} 
            Z
          `}
          fill={bodyColor}
          stroke="#333"
          strokeWidth="1"
        />
        
        {/* Arms (simplified as part of the body shape or separate if needed, just body block is fine for simplicity) */}
      </svg>
    </div>
  );
};
