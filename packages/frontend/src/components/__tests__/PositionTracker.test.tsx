/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { PositionTracker } from '../PositionTracker';
import { useBubblePositionStore } from '../../stores/bubblePositionStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useThree, useFrame } from '@react-three/fiber';
import * as ProjectionUtils from '../../utils/projection';

// Mock stores
vi.mock('../../stores/bubblePositionStore');
vi.mock('../../stores/selectionStore');
vi.mock('../../contexts/OrganizationContext');
vi.mock('@react-three/fiber');
vi.mock('../../utils/projection');

describe('PositionTracker', () => {
    const mockSetAnchor = vi.fn();
    const mockSetScreenPosition = vi.fn();
    const mockSetVisibility = vi.fn();
    const mockClearAnchor = vi.fn();

    const mockCamera = new THREE.PerspectiveCamera();
    mockCamera.position.set(0, 0, 10);
    mockCamera.lookAt(0, 0, 0); 
    mockCamera.updateMatrixWorld();
    mockCamera.updateProjectionMatrix();

    const mockSize = { width: 1000, height: 1000 };

    beforeEach(() => {
        vi.resetAllMocks();

        // Setup BubblePositionStore mock
        (useBubblePositionStore as any).mockImplementation((selector: any) => {
            const state = {
                setAnchor: mockSetAnchor,
                setScreenPosition: mockSetScreenPosition,
                setVisibility: mockSetVisibility,
                clearAnchor: mockClearAnchor,
                anchorPosition: null,
                screenPosition: null,
                isVisible: false,
            };
            return selector ? selector(state) : state;
        });

        // Setup useThree mock
        (useThree as any).mockReturnValue({
            camera: mockCamera,
            size: mockSize,
        });

        // Mock useFrame to simply register the callback, we'll trigger it manually if needed 
        // OR mock it to run immediately
        (useFrame as any).mockImplementation((callback: any) => {
             // We can execute it immediately for unit testing single frame logic
             callback();
        });

        // Mock projectToScreen default success pattern
        (ProjectionUtils.projectToScreen as any).mockReturnValue({
            x: 500,
            y: 500,
            visible: true
        });
    });

    it('clears anchor and state when layout is unavailable', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
        (useOrganization as any).mockReturnValue({
            layout: null // No layout
        });

        render(<PositionTracker />);

        expect(mockClearAnchor).toHaveBeenCalled();
    });

    it('updates position when service is selected', () => {
        const serviceId = 'service-1';
        const servicePos = { x: 10, y: 10, z: 10 };
        
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: serviceId }));
        (useOrganization as any).mockReturnValue({
            layout: {
                services: { [serviceId]: servicePos },
                teams: {},
                domains: {}
            }
        });

        render(<PositionTracker />);

        expect(mockSetAnchor).toHaveBeenCalledWith(
          expect.objectContaining({ x: 10, y: 10, z: 10 })
        );
        expect(mockSetScreenPosition).toHaveBeenCalledWith(
            expect.objectContaining({ x: 500, y: 500 })
        );
        expect(mockSetVisibility).toHaveBeenCalledWith(true);
    });

    it('updates position when team is selected', () => {
        const teamId = 'team-1';
        const teamPos = { x: 20, y: 20, z: 20 };
        
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: teamId }));
        (useOrganization as any).mockReturnValue({
            layout: {
                services: {},
                teams: { [teamId]: teamPos },
                domains: {}
            }
        });

        render(<PositionTracker />);

        expect(mockSetAnchor).toHaveBeenCalledWith(
          expect.objectContaining({ x: 20, y: 20, z: 20 })
        );
    });

    it('updates position when domain is selected', () => {
        const domainId = 'domain-1';
        const domainPos = { x: 30, y: 30, z: 30 };
        
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: domainId }));
        (useOrganization as any).mockReturnValue({
            layout: {
                services: {},
                teams: {},
                domains: { [domainId]: domainPos }
            }
        });

        render(<PositionTracker />);

        expect(mockSetAnchor).toHaveBeenCalledWith(
          expect.objectContaining({ x: 30, y: 30, z: 30 })
        );
    });

    it('sets visibility false if point is off-screen (viewport x < 0)', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
        (useOrganization as any).mockReturnValue({
            layout: { services: { 's1': { x: 0, y: 0, z: 0 } }, teams: {}, domains: {} }
        });
        
        // Mock projectToScreen returning x < 0
        (ProjectionUtils.projectToScreen as any).mockReturnValue({
            x: -10, 
            y: 500, 
            visible: true // z-clip passes
        });

        render(<PositionTracker />);
        
        expect(mockSetVisibility).toHaveBeenCalledWith(false);
    });

    it('sets visibility false if point is off-screen (viewport x > width)', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
        (useOrganization as any).mockReturnValue({
            layout: { services: { 's1': { x: 0, y: 0, z: 0 } }, teams: {}, domains: {} }
        });
        
        (ProjectionUtils.projectToScreen as any).mockReturnValue({
            x: 1010, // > 1000
            y: 500,
            visible: true
        });

        render(<PositionTracker />);
        expect(mockSetVisibility).toHaveBeenCalledWith(false);
    });

    it('sets visibility false if point is off-screen (viewport y < 0)', () => {
         (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
         (useOrganization as any).mockReturnValue({
             layout: { services: { 's1': { x: 0, y: 0, z: 0 } }, teams: {}, domains: {} }
         });
         
         (ProjectionUtils.projectToScreen as any).mockReturnValue({
             x: 500,
             y: -10,
             visible: true
         });
 
         render(<PositionTracker />);
         expect(mockSetVisibility).toHaveBeenCalledWith(false);
     });

    // Phase 5: Visibility detection for clipped anchors

    it('sets visibility false when anchor is behind the camera (projection.visible is false)', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
        (useOrganization as any).mockReturnValue({
            layout: { services: { 's1': { x: 0, y: 0, z: 0 } }, teams: {}, domains: {} }
        });

        // Anchor is behind the near plane — projection.visible is false (z-clipped)
        (ProjectionUtils.projectToScreen as any).mockReturnValue({
            x: 500,  // Would be on-screen if not z-clipped
            y: 500,
            visible: false  // Behind camera / near-plane clipped
        });

        render(<PositionTracker />);

        expect(mockSetVisibility).toHaveBeenCalledWith(false);
    });

    it('sets visibility false when anchor is beyond the far plane (projection.visible is false)', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
        (useOrganization as any).mockReturnValue({
            layout: { services: { 's1': { x: 0, y: 0, z: 0 } }, teams: {}, domains: {} }
        });

        // Anchor is beyond the far plane — ndcZ > 1
        (ProjectionUtils.projectToScreen as any).mockReturnValue({
            x: 500,
            y: 500,
            visible: false  // Far-plane clipped
        });

        render(<PositionTracker />);

        expect(mockSetVisibility).toHaveBeenCalledWith(false);
    });

    it('does not call setScreenPosition when anchor is clipped behind camera', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
        (useOrganization as any).mockReturnValue({
            layout: { services: { 's1': { x: 0, y: 0, z: 0 } }, teams: {}, domains: {} }
        });

        (ProjectionUtils.projectToScreen as any).mockReturnValue({
            x: 500,
            y: 500,
            visible: false
        });

        render(<PositionTracker />);

        expect(mockSetScreenPosition).not.toHaveBeenCalled();
    });

    it('sets visibility false when viewport y is beyond height', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
        (useOrganization as any).mockReturnValue({
            layout: { services: { 's1': { x: 0, y: 0, z: 0 } }, teams: {}, domains: {} }
        });

        (ProjectionUtils.projectToScreen as any).mockReturnValue({
            x: 500,
            y: 1100,  // > 1000 (viewport height)
            visible: true
        });

        render(<PositionTracker />);

        expect(mockSetVisibility).toHaveBeenCalledWith(false);
    });

    it('sets visibility true when anchor is on-screen and not z-clipped', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
        (useOrganization as any).mockReturnValue({
            layout: { services: { 's1': { x: 0, y: 0, z: 0 } }, teams: {}, domains: {} }
        });

        (ProjectionUtils.projectToScreen as any).mockReturnValue({
            x: 500,
            y: 500,
            visible: true  // z-clip passes and on-screen
        });

        render(<PositionTracker />);

        expect(mockSetVisibility).toHaveBeenCalledWith(true);
        expect(mockSetScreenPosition).toHaveBeenCalledWith({ x: 500, y: 500 });
    });

    it('updates position across multiple frames', () => {
        let frameCallback: (() => void) | null = null;
        (useFrame as any).mockImplementation((cb: any) => { frameCallback = cb; });
        
        (useSelectionStore as any).mockImplementation((selector: any) => selector({ selectedServiceId: 's1' }));
        (useOrganization as any).mockReturnValue({
            layout: { services: { 's1': { x: 0, y: 0, z: 0 } }, teams: {}, domains: {} }
        });

        render(<PositionTracker />);

        // Frame 1
        // @ts-ignore
        if (frameCallback) frameCallback();
        expect(mockSetScreenPosition).toHaveBeenCalledTimes(1);

        // Frame 2
        // @ts-ignore
        if (frameCallback) frameCallback();
        expect(mockSetScreenPosition).toHaveBeenCalledTimes(2);
    });
});
