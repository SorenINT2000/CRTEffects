import { forwardRef, useMemo } from 'react';
import { computeBezelPath } from '../lib/bezelPath';
import type { CRTConfig } from '../lib/types';

interface ViewerFrameProps {
  config: CRTConfig;
  canvasARef: React.RefObject<HTMLCanvasElement | null>;
  canvasBRef: React.RefObject<HTMLCanvasElement | null>;
  containerARef: React.RefObject<HTMLDivElement | null>;
  containerBRef: React.RefObject<HTMLDivElement | null>;
  statusText: string;
}

export const ViewerFrame = forwardRef<HTMLDivElement, ViewerFrameProps>(
  function ViewerFrame({ config, canvasARef, canvasBRef, containerARef, containerBRef, statusText }, _ref) {
    const bezelD = useMemo(() => {
      const bend = config.curvature ? config.bendFactor : 0.0;
      return computeBezelPath(bend);
    }, [config.curvature, config.bendFactor]);

    return (
      <>
        {/* Hidden SVG clip-path definition */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <clipPath id="screen-clip" clipPathUnits="objectBoundingBox">
              <path d={bezelD} />
            </clipPath>
          </defs>
        </svg>

        <div className="viewer-frame">
          <svg className="bezel-overlay" viewBox="0 0 1 1" preserveAspectRatio="none">
            <path className="bezel-path" d={bezelD} />
          </svg>

          <div className="bezel-shadow" />

          <div
            ref={containerARef}
            className="image-container"
            style={{ zIndex: 2, opacity: 1 }}
          >
            <canvas ref={canvasARef} className="webgl-screen" />
          </div>
          <div
            ref={containerBRef}
            className="image-container"
            style={{ zIndex: 1, opacity: 0 }}
          >
            <canvas ref={canvasBRef} className="webgl-screen" />
          </div>
        </div>

        <div className="status">{statusText}</div>
      </>
    );
  }
);
