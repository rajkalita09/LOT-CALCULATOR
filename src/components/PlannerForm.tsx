import { Text } from '@fluentui/react-components';
import { Crosshair, Layers3, RotateCcw, Sparkles, Target, Trash2, TrendingUp } from 'lucide-react';
import { NumberInput } from './NumberInput';
import { ExitType, PartialExit } from '../types/planner';

type PlannerFormProps = {
  totalLot: number;
  exitCount: number;
  stopLossPips: number;
  exits: PartialExit[];
  targetRr: number;
  mode: 'calculate' | 'target';
  onTotalLotChange: (value: number) => void;
  onExitCountChange: (count: number) => void;
  onExitChange: (id: number, next: Partial<PartialExit>) => void;
  onRemoveExit: (id: number) => void;
  onStopLossChange: (value: number) => void;
  onTargetRrChange: (value: number) => void;
  onFillRemaining: () => void;
  onLoadExample: () => void;
  onReset: () => void;
  onModeChange: (mode: 'calculate' | 'target') => void;
};

export function PlannerForm({ totalLot, exitCount, stopLossPips, exits, targetRr, mode, onTotalLotChange, onExitCountChange, onExitChange, onRemoveExit, onStopLossChange, onTargetRrChange, onFillRemaining, onLoadExample, onReset, onModeChange }: PlannerFormProps) {
  const displayExits = Array.from({ length: exitCount }, (_, index) => exits[index] ?? { id: index + 1, percentage: 0, lot: 0, tpPips: 0, type: 'take-profit' as ExitType });

  return <div className="config-column">
    <section className="panel position-panel">
      <div className="section-heading"><div><div className="section-kicker"><Layers3 size={15} /> Position</div><Text as="h2">Total position</Text></div><span className="section-step">01</span></div>
      <div className="large-input-wrap"><NumberInput value={totalLot} onChange={onTotalLotChange} min={0.01} step={0.01} decimals={2} suffix="LOT" inputMode="decimal" className="large-number-input" /></div>
      <Text as="p" className="helper-text">Enter the total position you already plan to trade.</Text>
    </section>

    <section className="panel risk-panel"><div className="section-heading"><div><div className="section-kicker"><Crosshair size={15} /> Risk reference</div><Text as="h2">Stop loss</Text></div><span className="section-step">02</span></div><div className="inline-input-row"><NumberInput value={stopLossPips} onChange={onStopLossChange} min={0} step={1} decimals={0} suffix="PIPS" inputMode="numeric" /></div><Text as="p" className="helper-text">Used as the initial risk reference for your weighted RR.</Text></section>

    <section className="panel compact-panel">
      <div className="section-heading"><div><div className="section-kicker"><Target size={15} /> Exit plan</div><Text as="h2">How many partial exits?</Text></div><span className="section-step">03</span></div>
      <div className="exit-count-row"><div className="segmented-control">{[1, 2, 3, 4].map((option) => <button className={option === exitCount ? 'segment is-active' : 'segment'} key={option} onClick={() => onExitCountChange(option)} type="button">{option}</button>)}</div><label className="custom-exit-count">Custom<NumberInput value={exitCount} onChange={(value) => onExitCountChange(Math.min(100, Math.max(1, Math.round(value))))} min={1} max={100} step={1} decimals={0} inputMode="numeric" /></label></div>
      {exitCount > 4 && <div className="many-exits-label">{exitCount} partial exits</div>}
    </section>

    <section className="panel distribution-panel">
      <div className="section-heading"><div><div className="section-kicker"><TrendingUp size={15} /> Position distribution</div><Text as="h2">Plan each exit</Text></div><div className="distribution-actions"><span className="section-step">04</span><button className="text-action" type="button" onClick={onFillRemaining}>Fill remaining</button></div></div>
      <div className="exit-list">{displayExits.map((exit, index) => { const targetPips = exit.type === 'trailing' ? exit.trailingPips ?? exit.tpPips : exit.tpPips; return <div className="exit-card" key={exit.id}>
        <div className="exit-card-header"><div className="exit-name"><span className="exit-number">{String(index + 1).padStart(2, '0')}</span><div><strong>Exit {String(index + 1).padStart(2, '0')}</strong><span>{exit.type === 'trailing' ? 'Trailing position' : 'Take profit'}</span></div></div><div className="exit-card-actions"><strong className="exit-percent">{exit.percentage || 0}%</strong>{index > 0 && <button className="remove-exit-button" type="button" aria-label={`Remove exit ${index + 1}`} onClick={() => onRemoveExit(exit.id)}><Trash2 size={15} /></button>}</div></div>
        <div className="exit-fields">
          <label className="field-label">Allocation<NumberInput value={exit.percentage} onChange={(value) => onExitChange(exit.id, { percentage: value })} min={0} max={100} step={1} decimals={0} suffix="%" inputMode="numeric" /></label>
          <label className="field-label">Lot size<NumberInput value={exit.lot} onChange={() => undefined} min={0} step={0.01} decimals={2} suffix="LOT" inputMode="decimal" className="read-only-number" readOnly /></label>
          <label className="field-label">Exit type<select className="dark-select" value={exit.type} onChange={(event) => onExitChange(exit.id, { type: event.target.value as ExitType })}><option value="take-profit">Take profit</option><option value="trailing">Trailing</option></select></label>
          <label className="field-label">Target<NumberInput value={targetPips} onChange={(value) => onExitChange(exit.id, exit.type === 'trailing' ? { trailingPips: value } : { tpPips: value })} min={0} step={1} decimals={0} suffix="PIPS" inputMode="numeric" /></label>
        </div>
      </div>; })}</div>
    </section>

    <section className="panel mode-panel"><div className="section-heading"><div><div className="section-kicker"><Sparkles size={15} /> Calculation mode</div><Text as="h2">Calculation mode</Text><Text as="p" className="helper-text">Choose how you want to calculate your result.</Text></div><span className="section-step">05</span></div><div className="mode-switch"><button className={mode === 'calculate' ? 'mode-option is-active' : 'mode-option'} type="button" onClick={() => onModeChange('calculate')}>Calculate RR</button><button className={mode === 'target' ? 'mode-option is-active' : 'mode-option'} type="button" onClick={() => onModeChange('target')}>Target RR</button></div>{mode === 'target' && <div className="target-controls"><div className="preset-row">{[1, 1.25, 1.5, 1.75, 2, 2.5, 3].map((option) => <button className={targetRr === option ? 'preset is-active' : 'preset'} key={option} type="button" onClick={() => onTargetRrChange(option)}>{option}R</button>)}</div><label className="field-label target-input-label">Target RR<NumberInput value={targetRr} onChange={onTargetRrChange} min={0} step={0.05} decimals={2} suffix="R" inputMode="decimal" /></label></div>}</section>

    <div className="form-actions"><button className="button button-primary" type="button" onClick={onLoadExample}><Sparkles size={17} /> Load example</button><button className="button button-secondary" type="button" onClick={onReset}><RotateCcw size={17} /> Reset</button></div>
  </div>;
}
