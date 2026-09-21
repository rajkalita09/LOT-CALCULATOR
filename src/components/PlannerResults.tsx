import { Text } from '@fluentui/react-components';
import { ShieldCheck, TrendingUp } from 'lucide-react';
import { ExitPlan } from '../lib/planner';

type PlannerResultsProps = {
  totalLot: number;
  stopLossPips: number;
  exits: ExitPlan[];
  overallRR: number;
  reward: number;
  risk: number;
  remaining: number;
  targetRR: number;
  mode: 'calculate' | 'target';
  requiredFinalTp: number | null;
};

export function PlannerResults({ totalLot, stopLossPips, exits, overallRR, reward, risk, remaining, targetRR, mode, requiredFinalTp }: PlannerResultsProps) {
  const achieved = mode === 'calculate' || overallRR >= targetRR;

  return (
    <aside className="results-column">
      <section className="result-card rr-card">
        <div className="result-kicker"><TrendingUp size={15} /> Overall RR</div>
        <div className="rr-value">1 : {overallRR.toFixed(2)}</div>
        <div className="rr-subtitle">{reward.toFixed(0)} reward / {risk.toFixed(0)} risk</div>
        <div className="achieved">{achieved ? 'Plan calculated' : 'Below target'}</div>
      </section>

      <section className="result-card">
        <div className="section-heading"><div><div className="section-kicker"><TrendingUp size={15} /> Allocation</div><Text as="h2">Position distribution</Text></div><span className="section-step">{remaining > 0 ? `${remaining.toFixed(0)}% open` : 'Fully planned'}</span></div>
        <div className="allocation-bar">{exits.map((exit) => <div className={exit.type === 'trailing' ? 'allocation-segment is-trailing' : 'allocation-segment'} key={exit.id} style={{ width: `${Math.max(0, exit.percentage)}%` }} />)}</div>
        <div className="allocation-legend">{exits.map((exit, index) => <span className={exit.type === 'trailing' ? 'legend-item is-trailing' : 'legend-item'} key={exit.id}>Exit {index + 1} · {exit.percentage}% · {exit.lot.toFixed(2)} LOT</span>)}</div>
      </section>

      <section className="result-card">
        <div className="section-heading"><div><div className="section-kicker"><ShieldCheck size={15} /> Breakdown</div><Text as="h2">Exit performance</Text></div></div>
        <table className="breakdown-table">
          <thead><tr><th>Exit</th><th>Allocation</th><th>Lot</th><th>Target</th><th>Reward</th><th>RR</th></tr></thead>
          <tbody>{exits.map((exit, index) => { const pips = exit.type === 'trailing' ? exit.trailingPips ?? exit.tpPips : exit.tpPips; return <tr key={exit.id}><td>Exit {String(index + 1).padStart(2, '0')}</td><td>{exit.percentage}%</td><td>{exit.lot.toFixed(2)}</td><td>{pips} pips</td><td>{(exit.lot * pips).toFixed(0)}</td><td>{(exit.lot * pips / Math.max(1, stopLossPips * totalLot)).toFixed(2)}R</td></tr>; })}<tr className="total-row"><td>Total</td><td>{exits.reduce((sum, exit) => sum + exit.percentage, 0).toFixed(0)}%</td><td>{exits.reduce((sum, exit) => sum + exit.lot, 0).toFixed(2)}</td><td>Position</td><td>-</td><td>-</td></tr></tbody>
        </table>
      </section>

      {mode === 'target' && requiredFinalTp !== null && <section className="result-card required-card"><div className="result-kicker">Target RR · 1 : {targetRR.toFixed(2)}</div><div className="required-value">+{requiredFinalTp} PIPS</div><div className="required-copy">Required final TP for the remaining <strong>{exits[exits.length - 1]?.lot.toFixed(2) ?? '0.00'} LOT</strong> position.</div></section>}
    </aside>
  );
}
