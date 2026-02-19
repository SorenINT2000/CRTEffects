export interface CRTConfig {
  scanlines: boolean;
  scanlineScale: number;
  curvature: boolean;
  bendFactor: number;
  vignette: boolean;
  vignetteIntensity: number;
  jitter: boolean;
  jitterIntensity: number;
  noise: boolean;
  noiseIntensity: number;
  roll: boolean;
  rollSpeed: number;
  stutter: boolean;
  stutterFrequency: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export type TransitionType = 'slide' | 'flash' | 'crt' | 'glitch';

export const DEFAULT_CONFIG: CRTConfig = {
  scanlines: true,
  scanlineScale: 3.0,
  curvature: true,
  bendFactor: 0.2,
  vignette: true,
  vignetteIntensity: 1.0,
  jitter: true,
  jitterIntensity: 1.0,
  noise: true,
  noiseIntensity: 0.1,
  roll: true,
  rollSpeed: 2.0,
  stutter: true,
  stutterFrequency: 0.05,
};
