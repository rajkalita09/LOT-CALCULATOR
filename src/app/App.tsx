import { useEffect, useMemo, useState } from 'react';
import { Text } from '@fluentui/react-components';
import { BriefcaseBusiness, ChartNoAxesCombined, PieChart, ShieldCheck } from 'lucide-react';
import { PlannerForm } from '../components/PlannerForm';
import { PlannerResults } from '../components/PlannerResults';
import { calculateExecutableLots, calculateLotFromPercentage, calculateOverallRR, calculateRequiredTP, getDefaultAllocations, rebalanceAllocations, validateAllocation } from '../lib/planner';
import { PartialExit } from '../types/planner';
import { api } from '../api';
import type { CalculationResponse } from '../api';
import './App.css';

const baseExampleExits: PartialExit[] = [
  { id: 1, percentage: 30, lot: 0.3, tpPips: 50, type: 'take-profit' },
  { id: 2, percentage: 50, lot: 0.5, tpPips: 150, type: 'take-profit' },
  { id: 3, percentage: 20, lot: 0.2, tpPips: 300, type: 'trailing', trailingPips: 300 },
];

const createDefaultExits = (count: number, totalLot: number, existing: PartialExit[] = []): PartialExit[] => {
  const percentages = getDefaultAllocations(count);
  const executableLots = calculateExecutableLots(totalLot, percentages);
  return percentages.map((percentage, index) => {
    const previous = existing[index] ?? baseExampleExits[index];
    return {
      id: index + 1,
      percentage,
      lot: executableLots[index],
      tpPips: previous?.tpPips ?? 0,
      trailingPips: previous?.trailingPips ?? 0,
      type: previous?.type ?? 'take-profit',
    };
  });
};

const exampleState = {
  totalLot: 1,
  stopLossPips: 100,
  exitCount: 3,
  exits: baseExampleExits,
  targetRr: 1.5,
  mode: 'calculate' as const,
};

function TradeSnapshot({ totalLot, stopLossPips, totalAllocated, overallRR }: { totalLot: number; stopLossPips: number; totalAllocated: number; overallRR: number }) {
  return (
    <section className="trade-snapshot" aria-label="Trade snapshot">
      <div className="snapshot-heading"><span className="snapshot-line" /> <span>Trade snapshot</span></div>
      <div className="snapshot-grid">
        <div className="snapshot-card"><BriefcaseBusiness size={18} /><span className="snapshot-label">Total position</span><strong>{totalLot.toFixed(2)} LOT</strong><small>Position size</small></div>
        <div className="snapshot-card"><ShieldCheck size={18} /><span className="snapshot-label">Stop loss</span><strong>{stopLossPips.toFixed(0)} PIPS</strong><small>Initial risk</small></div>
        <div className="snapshot-card"><PieChart size={18} /><span className="snapshot-label">Allocated</span><strong>{totalAllocated.toFixed(0)}%</strong><small>Position planned</small></div>
        <div className="snapshot-card snapshot-card-rr"><ChartNoAxesCombined size={18} /><span className="snapshot-label">Overall RR</span><strong>1 : {overallRR.toFixed(2)}</strong><small>Weighted reward / risk</small></div>
      </div>
    </section>
  );
}

export default function App() {
  const [totalLot, setTotalLot] = useState(exampleState.totalLot);
  const [stopLossPips, setStopLossPips] = useState(exampleState.stopLossPips);
  const [exitCount, setExitCount] = useState(exampleState.exitCount);
  const [targetRr, setTargetRr] = useState(exampleState.targetRr);
  const [mode, setMode] = useState<'calculate' | 'target'>(exampleState.mode);
  const [exits, setExits] = useState<PartialExit[]>(exampleState.exits);
  const [liveResult, setLiveResult] = useState<CalculationResponse | null>(null);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  const normalizedExits = useMemo(() => {
    const percentages = exits.length === exitCount ? exits.map((exit) => exit.percentage) : getDefaultAllocations(exitCount);
    const executableLots = calculateExecutableLots(totalLot, percentages);
    const next: PartialExit[] = Array.from({ length: exitCount }, (_, index) => {
      const current = exits[index] ?? { id: index + 1, percentage: 0, lot: 0, tpPips: 0, type: index === exitCount - 1 ? 'trailing' : 'take-profit' as const };
      const percentage = Number.isFinite(current.percentage) ? current.percentage : 0;
      const lot = executableLots[index] ?? calculateLotFromPercentage(totalLot, percentage);

      return {
        ...current,
        id: index + 1,
        percentage,
        lot,
        tpPips: Number.isFinite(current.tpPips) ? current.tpPips : 0,
        trailingPips: current.trailingPips ?? 0,
        type: current.type ?? (index === exitCount - 1 ? 'trailing' : 'take-profit'),
      };
    });

    return next;
  }, [exitCount, exits, totalLot]);

  const allocation = validateAllocation(normalizedExits.map((exit) => exit.percentage), 100, exitCount);
  const overall = calculateOverallRR(totalLot, stopLossPips, normalizedExits);
  const requiredFinalTp = mode === 'target' ? calculateRequiredTP(totalLot, stopLossPips, normalizedExits, targetRr) : null;

  useEffect(() => {
    let active = true;
    setApiStatus('connecting');
    setLiveResult(null);

    api.calculate({ totalLot, stopLossPips, targetRr, exits: normalizedExits })
      .then((result) => {
        if (active) {
          setLiveResult(result);
          setApiStatus('connected');
        }
      })
      .catch(() => {
        if (active) {
          setApiStatus('offline');
        }
      });

    return () => {
      active = false;
    };
  }, [normalizedExits, stopLossPips, targetRr, totalLot]);

  const displayedOverall = liveResult ?? overall;
  const displayedRequiredFinalTp = mode === 'target' ? liveResult?.requiredFinalTp ?? requiredFinalTp : null;

  const updateExit = (id: number, next: Partial<PartialExit>) => {
    setExits((current) => {
      const updated: PartialExit[] = current.length ? [...current] : Array.from({ length: exitCount }, (_, index) => ({
        id: index + 1,
        percentage: 100 / exitCount,
        lot: calculateLotFromPercentage(totalLot, 100 / exitCount),
        tpPips: 0,
        type: index === exitCount - 1 ? 'trailing' : 'take-profit',
      }));

      const index = updated.findIndex((exit) => exit.id === id);
      const target = updated[index] ?? {
        id,
        percentage: 0,
        lot: 0,
        tpPips: 0,
        type: 'take-profit' as const,
      };

      const merged = { ...target, ...next };

      if (next.percentage !== undefined) {
        const balancedPercentages = rebalanceAllocations(updated.map((exit) => exit.percentage), index, next.percentage);
        const balancedLots = calculateExecutableLots(totalLot, balancedPercentages);
        return updated.slice(0, exitCount).map((exit, exitIndex) => ({
          ...exit,
          ...((exitIndex === index) ? next : {}),
          percentage: balancedPercentages[exitIndex],
          lot: balancedLots[exitIndex],
        }));
      }

      merged.lot = calculateExecutableLots(totalLot, updated.map((exit) => exit.id === id ? merged.percentage : exit.percentage))[index] ?? 0;

      if (index >= 0) {
        updated[index] = merged;
      } else {
        updated.push(merged);
      }

      return updated.slice(0, exitCount);
    });
  };

  const handleExitCountChange = (count: number) => {
    setExitCount(count);
    setExits((current) => createDefaultExits(count, totalLot, current));
  };

  const removeExit = (id: number) => {
    if (exitCount <= 1) {
      return;
    }

    setExitCount((count) => count - 1);
    setExits((current) => {
      const remaining = current.filter((exit) => exit.id !== id);
      const percentages = remaining.map((exit) => exit.percentage);
      const total = percentages.reduce((sum, percentage) => sum + Math.max(0, percentage), 0);
      const balanced = total > 0 ? percentages.map((percentage) => Number((percentage / total * 100).toFixed(6))) : getDefaultAllocations(Math.max(1, exitCount - 1));
      const lots = calculateExecutableLots(totalLot, balanced);
      return remaining.map((exit, index) => ({ ...exit, id: index + 1, percentage: balanced[index], lot: lots[index] }));
    });
  };

  const fillRemaining = () => {
    setExits((current) => {
      const next = [...current];
      const used = next.reduce((sum, exit) => sum + (Number.isFinite(exit.percentage) ? exit.percentage : 0), 0);
      const remaining = Math.max(0, 100 - used);
      const lastIndex = next.length - 1;

      if (lastIndex >= 0) {
        next[lastIndex] = {
          ...next[lastIndex],
          percentage: remaining,
          lot: calculateLotFromPercentage(totalLot, remaining),
        };
      }

      return next;
    });
  };

  const reset = () => {
    setTotalLot(1);
    setStopLossPips(100);
    setExitCount(3);
    setTargetRr(1.5);
    setMode('calculate');
    setExits(baseExampleExits);
  };

  const loadExample = () => {
    setTotalLot(1);
    setStopLossPips(100);
    setExitCount(3);
    setTargetRr(1.5);
    setMode('calculate');
    setExits(baseExampleExits);
  };

  return (
    <div className="planner-app">
      <div className="planner-shell">
        <header className="planner-header">
          <div className="eyebrow"><span className="status-dot" /> Trading tool · API {apiStatus}</div>
          <h1 className="hero-title">PARTIAL <span>TP</span></h1>
          <Text as="p" size={700} className="planner-title">Partial Take-Profit &amp; RR Planner</Text>
          <Text as="p" size={400} className="planner-subtitle">Plan your exits. Visualize your position. Calculate your weighted risk-to-reward.</Text>
        </header>

        <TradeSnapshot totalLot={totalLot} stopLossPips={stopLossPips} totalAllocated={allocation.totalAllocated} overallRR={displayedOverall.ratio} />

        <div className="planner-grid">
          <PlannerForm
            totalLot={totalLot}
            exitCount={exitCount}
            stopLossPips={stopLossPips}
            exits={normalizedExits}
            targetRr={targetRr}
            mode={mode}
            onTotalLotChange={(value) => setTotalLot(Math.max(0.01, value))}
            onExitCountChange={handleExitCountChange}
            onExitChange={updateExit}
            onRemoveExit={removeExit}
            onStopLossChange={(value) => setStopLossPips(Math.max(0, value))}
            onTargetRrChange={(value) => setTargetRr(Math.max(0, value))}
            onFillRemaining={fillRemaining}
            onLoadExample={loadExample}
            onReset={reset}
            onModeChange={(nextMode) => setMode(nextMode)}
          />

          <PlannerResults
            totalLot={totalLot}
            stopLossPips={stopLossPips}
            exits={normalizedExits}
            overallRR={displayedOverall.ratio}
            reward={displayedOverall.reward}
            risk={displayedOverall.risk}
            remaining={allocation.remaining}
            targetRR={targetRr}
            mode={mode}
            requiredFinalTp={displayedRequiredFinalTp}
          />
        </div>
      </div>
    </div>
  );
}
