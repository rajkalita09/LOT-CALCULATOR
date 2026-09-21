import { useEffect, useRef, useState } from 'react';

type NumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step: number;
  suffix?: string;
  decimals?: number;
  inputMode?: 'decimal' | 'numeric';
  className?: string;
  readOnly?: boolean;
};

function clamp(value: number, min?: number, max?: number): number {
  const withMin = min === undefined ? value : Math.max(min, value);
  return max === undefined ? withMin : Math.min(max, withMin);
}

function roundToStep(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

function formatNumber(value: number, decimals: number): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : (0).toFixed(decimals);
}

export function NumberInput({ value, onChange, min, max, step, suffix, decimals = 0, inputMode = 'numeric', className = '', readOnly = false }: NumberInputProps) {
  const [draft, setDraft] = useState(formatNumber(value, decimals));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setDraft(formatNumber(value, decimals));
    }
  }, [decimals, isFocused, value]);

  const commit = (rawValue: string) => {
    if (rawValue.trim() === '') {
      onChange(0);
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isFinite(parsed)) {
      onChange(clamp(parsed, min, max));
    }
  };

  const changeByStep = (direction: 1 | -1) => {
    const current = Number.isFinite(value) ? value : 0;
    const next = roundToStep(clamp(current + step * direction, min, max), decimals);
    setDraft(formatNumber(next, decimals));
    onChange(next);
    inputRef.current?.focus();
  };

  return (
    <div className={`number-input-shell ${className}`}>
      <input
        ref={inputRef}
        className="number-input"
        type="number"
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
        value={draft}
        onFocus={() => setIsFocused(true)}
        onChange={(event) => {
          if (readOnly) return;
          setDraft(event.target.value);
          commit(event.target.value);
        }}
        onBlur={() => {
          if (readOnly) return;
          setIsFocused(false);
          const parsed = Number(draft);
          const next = Number.isFinite(parsed) ? clamp(parsed, min, max) : 0;
          setDraft(formatNumber(next, decimals));
          onChange(next);
        }}
      />
      {suffix && <span className="input-suffix">{suffix}</span>}
      <div className="stepper-controls" aria-hidden="false">
        <button type="button" tabIndex={-1} aria-label={`Increase by ${step}`} disabled={readOnly} onMouseDown={(event) => event.preventDefault()} onClick={() => changeByStep(1)}>▲</button>
        <button type="button" tabIndex={-1} aria-label={`Decrease by ${step}`} disabled={readOnly} onMouseDown={(event) => event.preventDefault()} onClick={() => changeByStep(-1)}>▼</button>
      </div>
    </div>
  );
}
