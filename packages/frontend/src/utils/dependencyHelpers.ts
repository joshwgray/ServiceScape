import type { Dependency } from '@servicescape/shared';

/**
 * Checks if a service is directly in the dependency chain of the selected service.
 * Returns true if the service is an immediate upstream or downstream neighbour
 * of the selected service.
 *
 * @param serviceId       - The service whose relationship we want to check.
 * @param selectedServiceId - The currently selected service.
 * @param dependencies    - The list of all relevant dependencies.
 */
export function isServiceInDependencyChain(
  serviceId: string,
  selectedServiceId: string,
  dependencies: Dependency[]
): boolean {
  return dependencies.some(
    (dep) =>
      (dep.fromServiceId === selectedServiceId && dep.toServiceId === serviceId) ||
      (dep.toServiceId === selectedServiceId && dep.fromServiceId === serviceId)
  );
}
