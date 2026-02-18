import type { CRTConfig, TransitionType } from '../lib/types';

interface SettingDef {
  toggleKey: keyof CRTConfig;
  paramKey: keyof CRTConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
}

const SETTINGS: SettingDef[] = [
  { toggleKey: 'scanlines', paramKey: 'scanlineScale', label: 'Scanlines', min: 1.0, max: 6.0, step: 0.1, decimals: 1 },
  { toggleKey: 'curvature', paramKey: 'bendFactor', label: 'Curvature', min: 0.0, max: 2.0, step: 0.01, decimals: 2 },
  { toggleKey: 'roll', paramKey: 'rollSpeed', label: 'Roll Speed', min: 0.0, max: 10.0, step: 0.1, decimals: 1 },
  { toggleKey: 'noise', paramKey: 'noiseIntensity', label: 'Noise Amt', min: 0.0, max: 0.5, step: 0.01, decimals: 2 },
  { toggleKey: 'vignette', paramKey: 'vignetteIntensity', label: 'Vignette', min: 0.0, max: 1.5, step: 0.1, decimals: 1 },
  { toggleKey: 'jitter', paramKey: 'jitterIntensity', label: 'RGB Jitter', min: 0.0, max: 2.0, step: 0.1, decimals: 1 },
];

const TRANSITIONS: { type: TransitionType; label: string }[] = [
  { type: 'slide', label: 'Slide Projector' },
  { type: 'flash', label: 'Flashbulb' },
  { type: 'crt', label: 'CRT Switch' },
  { type: 'glitch', label: 'Film Jam' },
];

interface ControlsPanelProps {
  config: CRTConfig;
  onConfigChange: (patch: Partial<CRTConfig>) => void;
  onTransition: (type: TransitionType) => void;
}

export function ControlsPanel({ config, onConfigChange, onTransition }: ControlsPanelProps) {
  return (
    <div className="controls-container">
      <div className="settings-panel">
        {SETTINGS.map(s => (
          <div className="setting-row" key={s.toggleKey}>
            <input
              type="checkbox"
              checked={config[s.toggleKey] as boolean}
              onChange={e => onConfigChange({ [s.toggleKey]: e.target.checked })}
            />
            <label>{s.label}</label>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={config[s.paramKey] as number}
              onInput={e => onConfigChange({ [s.paramKey]: parseFloat((e.target as HTMLInputElement).value) })}
            />
            <span className="val-display">
              {(config[s.paramKey] as number).toFixed(s.decimals)}
            </span>
          </div>
        ))}
      </div>

      <div className="controls">
        {TRANSITIONS.map(t => (
          <button key={t.type} onClick={() => onTransition(t.type)}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
