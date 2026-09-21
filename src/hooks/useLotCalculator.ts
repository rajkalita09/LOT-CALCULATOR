import { useState } from 'react';

export type LotCalculatorState = {
  pair: string;
  balance: number;
  riskPercent: number;
  entry: number;
  stop: number;
  lotSize: number;
  stopDistance: number;
};

const DEFAULT_STATE: LotCalculatorState = {
  pair: 'EURUSD',
  balance: 10000,
  riskPercent: 1.5,
  entry: 1.082,
  stop: 1.078,
  lotSize: 0.37,
  stopDistance: 0.004,
};

export function useLotCalculator() {
  const [state, setState] = useState<LotCalculatorState>(DEFAULT_STATE);

  const setField = <K extends keyof LotCalculatorState>(field: K, value: LotCalculatorState[K]) => {
    setState((current) => ({ ...current, [field]: value }));
  };

  const calculate = () => {
    const riskAmount = state.balance * (state.riskPercent / 100);
    const stopDistance = Math.abs(state.entry - state.stop);
    const lotSize = riskAmount / (stopDistance * 100000);

    setState((current) => ({
      ...current,
      stopDistance,
      lotSize: Number(lotSize.toFixed(2)),
    }));
  };

  const reset = () => {
    setState(DEFAULT_STATE);
  };

  return { state, setField, calculate, reset };
}
