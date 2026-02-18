import { DEPENDENCY_TYPES, DependencyType } from '@servicescape/shared';

export interface EdgeStyle {
  color: string;
  dashed: boolean;
  opacity: number;
}

export const getDependencyStyle = (type: DependencyType): EdgeStyle => {
  switch (type) {
    case DEPENDENCY_TYPES.DECLARED:
      return {
        color: '#3b82f6', // blue-500
        dashed: false,
        opacity: 0.8,
      };
    case DEPENDENCY_TYPES.OBSERVED:
      return {
        color: '#f97316', // orange-500
        dashed: true,
        opacity: 0.6,
      };
    default:
      return {
        color: '#9ca3af', // gray-400
        dashed: false,
        opacity: 0.5,
      };
  }
};
