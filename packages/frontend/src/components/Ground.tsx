import React from 'react';
import { LegoBaseplate } from './LegoBaseplate';

const Ground: React.FC = () => {
  return (
    <LegoBaseplate
      width={600}
      depth={600}
      thickness={0.25}
      color="#00A650"
      position={[0, 0, 0]}
      studSpacing={1}
      maxStudCap={300}
    />
  );
};

export default Ground;
