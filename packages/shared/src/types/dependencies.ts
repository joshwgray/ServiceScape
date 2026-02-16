/**
 * Dependency tracking types for ServiceScape
 * Supports both declared (documented) and observed (detected) dependencies
 */

export type DependencyType = 'DECLARED' | 'OBSERVED';

export const DEPENDENCY_TYPES = {
  DECLARED: 'DECLARED' as const,
  OBSERVED: 'OBSERVED' as const,
};

export interface Dependency {
  id: string;
  fromServiceId: string;
  toServiceId: string;
  type: DependencyType;
  description?: string;
  metadata?: Record<string, any>;
}
