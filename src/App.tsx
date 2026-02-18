import { useCallback, useEffect, useRef, useState } from 'react';
import { CRTRenderer } from './lib/CRTRenderer';
import { DEFAULT_CONFIG } from './lib/types';
import type { CRTConfig, TransitionType } from './lib/types';
import { ViewerFrame } from './components/ViewerFrame';
import { ControlsPanel } from './components/ControlsPanel';
import vsSource from './shaders/vertex.glsl?raw';
import fsSource from './shaders/fragment.glsl?raw';
import './App.css';

const IMAGES = [
  'https://picsum.photos/id/64/800/600',
  'https://picsum.photos/id/96/800/600',
  'https://picsum.photos/id/102/800/600',
  'https://picsum.photos/id/111/800/600',
  'https://picsum.photos/id/133/800/600',
  'https://picsum.photos/id/234/800/600',
];

const JITTER_KEYFRAMES = [
  { t: 0, x: -0.0005 }, { t: 5, x: -0.0035 }, { t: 10, x: -0.0001 },
  { t: 15, x: -0.0005 }, { t: 20, x: -0.0043 }, { t: 40, x: -0.0048 },
  { t: 50, x: -0.0001 }, { t: 60, x: -0.0027 }, { t: 80, x: -0.0001 },
  { t: 90, x: -0.0043 }, { t: 100, x: -0.0032 },
];

function getJitter(frame: number): number {
  const frameMod = frame % 100;
  let val = -0.001;
  for (const k of JITTER_KEYFRAMES) {
    if (frameMod >= k.t) val = k.x;
  }
  return val;
}

function loadTextureImage(url: string, renderer: CRTRenderer) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = url;
  img.onload = () => renderer.setImage(img);
}

export default function App() {
  const [config, setConfig] = useState<CRTConfig>({ ...DEFAULT_CONFIG });
  const [statusText, setStatusText] = useState('Ready to project...');

  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const containerARef = useRef<HTMLDivElement>(null);
  const containerBRef = useRef<HTMLDivElement>(null);

  const rendererARef = useRef<CRTRenderer | null>(null);
  const rendererBRef = useRef<CRTRenderer | null>(null);
  const frameCountRef = useRef(0);
  const animIdRef = useRef(0);

  // Mutable transition state (doesn't need to drive re-renders)
  const transitionState = useRef({
    currentContainer: containerARef,
    nextContainer: containerBRef,
    currentRenderer: null as CRTRenderer | null,
    nextRenderer: null as CRTRenderer | null,
    imageCounter: 0,
    isAnimating: false,
  });

  // Initialize renderers
  useEffect(() => {
    const canvasA = canvasARef.current;
    const canvasB = canvasBRef.current;
    if (!canvasA || !canvasB) return;

    const rA = new CRTRenderer(canvasA, vsSource, fsSource);
    const rB = new CRTRenderer(canvasB, vsSource, fsSource);
    rA.generateAssets();
    rB.generateAssets();

    rendererARef.current = rA;
    rendererBRef.current = rB;
    transitionState.current.currentRenderer = rA;
    transitionState.current.nextRenderer = rB;

    loadTextureImage(IMAGES[0], rA);

    function animate() {
      frameCountRef.current++;
      const time = performance.now() / 1000;
      const rX = getJitter(frameCountRef.current);
      const bX = -rX;
      rA.render(time, { x: rX, y: 0 }, { x: bX, y: 0 });
      rB.render(time, { x: rX, y: 0 }, { x: bX, y: 0 });
      animIdRef.current = requestAnimationFrame(animate);
    }
    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      rA.dispose();
      rB.dispose();
    };
  }, []);

  // Sync React config state → renderers
  useEffect(() => {
    if (rendererARef.current) rendererARef.current.config = { ...config };
    if (rendererBRef.current) rendererBRef.current.config = { ...config };
  }, [config]);

  const handleConfigChange = useCallback((patch: Partial<CRTConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const handleTransition = useCallback((type: TransitionType) => {
    const ts = transitionState.current;
    if (ts.isAnimating || !ts.currentRenderer || !ts.nextRenderer) return;
    ts.isAnimating = true;

    const currentEl = ts.currentContainer.current;
    const nextEl = ts.nextContainer.current;
    if (!currentEl || !nextEl) return;

    loadTextureImage(
      IMAGES[(ts.imageCounter + 1) % IMAGES.length],
      ts.nextRenderer,
    );
    ts.imageCounter = (ts.imageCounter + 1) % IMAGES.length;

    nextEl.style.opacity = '1';
    currentEl.style.zIndex = '2';
    nextEl.style.zIndex = '1';
    currentEl.className = 'image-container';
    nextEl.className = 'image-container';
    setStatusText(`Applying effect: ${type.toUpperCase()}...`);

    setTimeout(() => {
      currentEl.classList.add(`anim-${type}-out`);
      nextEl.classList.add(`anim-${type}-in`);
      nextEl.style.zIndex = '2';
    }, 50);

    setTimeout(() => {
      // Swap
      const tempC = ts.currentContainer;
      ts.currentContainer = ts.nextContainer;
      ts.nextContainer = tempC;

      const tempR = ts.currentRenderer;
      ts.currentRenderer = ts.nextRenderer;
      ts.nextRenderer = tempR;

      const nowNext = ts.nextContainer.current;
      const nowCurrent = ts.currentContainer.current;
      if (nowNext) {
        nowNext.style.opacity = '0';
        nowNext.style.zIndex = '1';
        nowNext.className = 'image-container';
      }
      if (nowCurrent) {
        nowCurrent.style.zIndex = '2';
        nowCurrent.className = 'image-container';
      }

      ts.isAnimating = false;
      setStatusText('Ready to project...');
    }, 1000);
  }, []);

  return (
    <>
      <h1>Vintage CRT Studio (WebGL)</h1>

      <ViewerFrame
        config={config}
        canvasARef={canvasARef}
        canvasBRef={canvasBRef}
        containerARef={containerARef}
        containerBRef={containerBRef}
        statusText={statusText}
      />

      <ControlsPanel
        config={config}
        onConfigChange={handleConfigChange}
        onTransition={handleTransition}
      />
    </>
  );
}
