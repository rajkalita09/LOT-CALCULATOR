import { useEffect, useMemo, useState } from 'react';
import { Text } from '@fluentui/react-components';
import {
  Activity,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  PieChart,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

import { PlannerForm } from '../components/PlannerForm';
import { PlannerResults } from '../components/PlannerResults';

import {
  calculateExecutableLots,
  calculateLotFromPercentage,
  calculateOverallRR,
  calculateRequiredTP,
  getDefaultAllocations,
  rebalanceAllocations,
  validateAllocation,
} from '../lib/planner';

import { PartialExit } from '../types/planner';
import { api } from '../api';
import type { CalculationResponse } from '../api';

import './App.css';

const baseExampleExits: PartialExit[] = [
  {
    id: 1,
    percentage: 30,
    lot: 0.3,
    tpPips: 50,
    type: 'take-profit',
  },
  {
    id: 2,
    percentage: 50,
    lot: 0.5,
    tpPips: 150,
    type: 'take-profit',
  },
  {
    id: 3,
    percentage: 20,
    lot: 0.2,
    tpPips: 300,
    type: 'trailing',
    trailingPips: 300,
  },
];

const createDefaultExits = (
  count: number,
  totalLot: number,
  existing: PartialExit[] = [],
): PartialExit[] => {
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

type SnapshotProps = {
  totalLot: number;
  stopLossPips: number;
  totalAllocated: number;
  overallRR: number;
};

function TradeSnapshot({
  totalLot,
  stopLossPips,
  totalAllocated,
  overallRR,
}: SnapshotProps) {
  const rrPositive = overallRR > 0;

  return (
    <section className="trade-snapshot" aria-label="Trade snapshot">
      <div className="section-heading">
        <div>
          <span className="section-kicker">LIVE TRADE MODEL</span>
          <h2>Trade snapshot</h2>
        </div>

        <div className="live-indicator">
          <span className="live-dot" />
          LIVE CALCULATION
        </div>
      </div>

      <div className="snapshot-grid">
        <div className="snapshot-card">
          <div className="snapshot-icon blue">
            <BriefcaseBusiness size={19} />
          </div>

          <div className="snapshot-content">
            <span className="snapshot-label">Total position</span>
            <strong>{totalLot.toFixed(2)}</strong>
            <small>LOT SIZE</small>
          </div>
        </div>

        <div className="snapshot-card">
          <div className="snapshot-icon red">
            <ShieldCheck size={19} />
          </div>

          <div className="snapshot-content">
            <span className="snapshot-label">Stop loss</span>
            <strong>{stopLossPips.toFixed(0)}</strong>
            <small>PIPS RISK</small>
          </div>
        </div>

        <div className="snapshot-card">
          <div className="snapshot-icon purple">
            <PieChart size={19} />
          </div>

          <div className="snapshot-content">
            <span className="snapshot-label">Allocated</span>
            <strong>{totalAllocated.toFixed(0)}%</strong>
            <small>POSITION PLANNED</small>
          </div>
        </div>

        <div className={`snapshot-card rr-card ${rrPositive ? 'positive' : ''}`}>
          <div className="snapshot-icon green">
            <ChartNoAxesCombined size={19} />
          </div>

          <div className="snapshot-content">
            <span className="snapshot-label">Overall RR</span>
            <strong>1 : {overallRR.toFixed(2)}</strong>
            <small>WEIGHTED REWARD / RISK</small>
          </div>
        </div>
      </div>
    </section>
  );
}


type TradeIntelligenceProps = {
  exits: PartialExit[];
  stopLossPips: number;
  overallRR: number;
  totalAllocated: number;
  remaining: number;
};

function TradeIntelligence({
  exits,
  stopLossPips,
  overallRR,
  totalAllocated,
  remaining,
}: TradeIntelligenceProps) {
  const mappedExits = exits
    .map((exit, index) => {
      const targetPips =
        exit.tpPips > 0
          ? exit.tpPips
          : exit.trailingPips ?? 0;

      const rr =
        stopLossPips > 0
          ? targetPips / stopLossPips
          : 0;

      return {
        ...exit,
        index,
        targetPips,
        rr,
      };
    })
    .filter((exit) => exit.targetPips > 0);

  const visibleExits = mappedExits.slice(0, 5);
  const maxRR = Math.max(
    1,
    ...visibleExits.map((exit) => exit.rr),
  );

  const allocationComplete = remaining <= 0.01;
  const riskDefined = stopLossPips > 0;
  const targetsMapped = mappedExits.length > 0;
  const executionReady =
    riskDefined &&
    targetsMapped &&
    allocationComplete;

  const statusText = allocationComplete
    ? 'FULLY PLANNED'
    : `${totalAllocated.toFixed(0)}% ALLOCATED`;

  return (
    <section
      className="trade-intelligence"
      aria-label="Trade intelligence"
    >
      <div className="intelligence-header">
        <div>
          <span className="section-eyebrow">
            TRADE INTELLIGENCE
          </span>
          <h3>Execution map</h3>
        </div>

        <span className="intelligence-live">
          <span />
          LIVE
        </span>
      </div>

      <div className="exit-map">
        <div className="exit-map-line" />

        <div className="exit-point entry-point">
          <div className="point-dot" />
          <span>ENTRY</span>
          <strong>0</strong>
          <small>START</small>
        </div>

        {visibleExits.map((exit) => (
          <div
            className={`exit-point ${
              exit.index === mappedExits.length - 1
                ? 'final-point'
                : ''
            }`}
            key={exit.id}
          >
            <div className="point-dot" />
            <span>TP {exit.index + 1}</span>
            <strong>{exit.targetPips.toFixed(0)}</strong>
            <small>
              1 : {exit.rr.toFixed(2)}
            </small>
          </div>
        ))}
      </div>

      {mappedExits.length > visibleExits.length && (
        <div className="more-exits-note">
          +{mappedExits.length - visibleExits.length} more
          exit levels configured
        </div>
      )}

      <div className="rr-ladder">
        <div className="mini-heading">
          <span>RR LADDER</span>
          <span>PROJECTED</span>
        </div>

        {visibleExits.length > 0 ? (
          visibleExits.map((exit) => (
            <div className="rr-row" key={`rr-${exit.id}`}>
              <span>TP {exit.index + 1}</span>

              <div className="rr-bar">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        6,
                        (exit.rr / maxRR) * 100,
                      ),
                    )}%`,
                  }}
                />
              </div>

              <strong>
                1 : {exit.rr.toFixed(2)}
              </strong>
            </div>
          ))
        ) : (
          <div className="rr-empty">
            Add a target to build the RR ladder.
          </div>
        )}
      </div>

      <div className="position-status">
        <div className="status-title">
          <span>POSITION STATUS</span>
          <span
            className={
              allocationComplete
                ? 'status-complete'
                : 'status-warning'
            }
          >
            {statusText}
          </span>
        </div>

        <div className="status-metrics">
          <div>
            <span>Allocated</span>
            <strong>
              {totalAllocated.toFixed(0)}%
            </strong>
          </div>

          <div>
            <span>Remaining</span>
            <strong>
              {remaining.toFixed(0)}%
            </strong>
          </div>

          <div>
            <span>Weighted RR</span>
            <strong>
              1 : {overallRR.toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="allocation-progress">
          <div
            style={{
              width: `${Math.min(
                100,
                Math.max(0, totalAllocated),
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="execution-checklist">
        <div className={`check-item ${riskDefined ? 'is-complete' : ''}`}>
          <span className="check-icon">
            {riskDefined ? '✓' : '—'}
          </span>
          <div>
            <strong>Risk defined</strong>
            <small>
              {riskDefined
                ? `${stopLossPips.toFixed(0)} pips stop configured`
                : 'Set a stop loss'}
            </small>
          </div>
        </div>

        <div className={`check-item ${targetsMapped ? 'is-complete' : ''}`}>
          <span className="check-icon">
            {targetsMapped ? '✓' : '—'}
          </span>
          <div>
            <strong>Targets mapped</strong>
            <small>
              {targetsMapped
                ? `${mappedExits.length} exit ${
                    mappedExits.length === 1
                      ? 'level'
                      : 'levels'
                  } configured`
                : 'Add at least one target'}
            </small>
          </div>
        </div>

        <div
          className={`check-item ${
            allocationComplete ? 'is-complete' : ''
          }`}
        >
          <span className="check-icon">
            {allocationComplete ? '✓' : '—'}
          </span>
          <div>
            <strong>Position allocated</strong>
            <small>
              {allocationComplete
                ? '100% of position planned'
                : `${remaining.toFixed(0)}% still unallocated`}
            </small>
          </div>
        </div>

        <div
          className={`check-item ${
            executionReady ? 'is-complete' : ''
          }`}
        >
          <span className="check-icon">
            {executionReady ? '✓' : '—'}
          </span>
          <div>
            <strong>Execution ready</strong>
            <small>
              {executionReady
                ? 'Trade plan complete'
                : 'Complete the plan above'}
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [totalLot, setTotalLot] = useState(exampleState.totalLot);
  const [stopLossPips, setStopLossPips] = useState(
    exampleState.stopLossPips,
  );
  const [exitCount, setExitCount] = useState(exampleState.exitCount);
  const [targetRr, setTargetRr] = useState(exampleState.targetRr);
  const [mode, setMode] = useState<'calculate' | 'target'>(
    exampleState.mode,
  );

  const [exits, setExits] = useState<PartialExit[]>(
    exampleState.exits,
  );

  const [liveResult, setLiveResult] =
    useState<CalculationResponse | null>(null);

  const [apiStatus, setApiStatus] = useState<
    'connecting' | 'connected' | 'offline'
  >('connecting');

  const normalizedExits = useMemo(() => {
    const percentages =
      exits.length === exitCount
        ? exits.map((exit) => exit.percentage)
        : getDefaultAllocations(exitCount);

    const executableLots = calculateExecutableLots(
      totalLot,
      percentages,
    );

    return Array.from({ length: exitCount }, (_, index) => {
      const current =
        exits[index] ??
        ({
          id: index + 1,
          percentage: 0,
          lot: 0,
          tpPips: 0,
          type:
            index === exitCount - 1
              ? 'trailing'
              : 'take-profit',
        } as PartialExit);

      const percentage = Number.isFinite(current.percentage)
        ? current.percentage
        : 0;

      const lot =
        executableLots[index] ??
        calculateLotFromPercentage(totalLot, percentage);

      return {
        ...current,
        id: index + 1,
        percentage,
        lot,
        tpPips: Number.isFinite(current.tpPips)
          ? current.tpPips
          : 0,
        trailingPips: current.trailingPips ?? 0,
        type:
          current.type ??
          (index === exitCount - 1
            ? 'trailing'
            : 'take-profit'),
      };
    });
  }, [exitCount, exits, totalLot]);

  const allocation = validateAllocation(
    normalizedExits.map((exit) => exit.percentage),
    100,
    exitCount,
  );

  const overall = calculateOverallRR(
    totalLot,
    stopLossPips,
    normalizedExits,
  );

  const requiredFinalTp =
    mode === 'target'
      ? calculateRequiredTP(
          totalLot,
          stopLossPips,
          normalizedExits,
          targetRr,
        )
      : null;

  useEffect(() => {
    let active = true;

    setApiStatus('connecting');
    setLiveResult(null);

    api
      .calculate({
        totalLot,
        stopLossPips,
        targetRr,
        exits: normalizedExits,
      })
      .then((result) => {
        if (!active) return;

        setLiveResult(result);
        setApiStatus('connected');
      })
      .catch(() => {
        if (!active) return;

        setApiStatus('offline');
      });

    return () => {
      active = false;
    };
  }, [
    normalizedExits,
    stopLossPips,
    targetRr,
    totalLot,
  ]);

  const displayedOverall = liveResult ?? overall;

  const displayedRequiredFinalTp =
    mode === 'target'
      ? liveResult?.requiredFinalTp ?? requiredFinalTp
      : null;

  const updateExit = (
    id: number,
    next: Partial<PartialExit>,
  ) => {
    setExits((current) => {
      const updated: PartialExit[] = current.length
        ? [...current]
        : Array.from(
            { length: exitCount },
            (_, index) => ({
              id: index + 1,
              percentage: 100 / exitCount,
              lot: calculateLotFromPercentage(
                totalLot,
                100 / exitCount,
              ),
              tpPips: 0,
              type:
                index === exitCount - 1
                  ? 'trailing'
                  : 'take-profit',
            }),
          );

      const index = updated.findIndex(
        (exit) => exit.id === id,
      );

      const target =
        updated[index] ??
        ({
          id,
          percentage: 0,
          lot: 0,
          tpPips: 0,
          type: 'take-profit',
        } as PartialExit);

      const merged = {
        ...target,
        ...next,
      };

      if (next.percentage !== undefined) {
        const balancedPercentages =
          rebalanceAllocations(
            updated.map((exit) => exit.percentage),
            index,
            next.percentage,
          );

        const balancedLots = calculateExecutableLots(
          totalLot,
          balancedPercentages,
        );

        return updated
          .slice(0, exitCount)
          .map((exit, exitIndex) => ({
            ...exit,
            ...(exitIndex === index ? next : {}),
            percentage:
              balancedPercentages[exitIndex],
            lot: balancedLots[exitIndex],
          }));
      }

      merged.lot =
        calculateExecutableLots(
          totalLot,
          updated.map((exit) =>
            exit.id === id
              ? merged.percentage
              : exit.percentage,
          ),
        )[index] ?? 0;

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

    setExits((current) =>
      createDefaultExits(count, totalLot, current),
    );
  };

  const removeExit = (id: number) => {
    if (exitCount <= 1) return;

    setExitCount((count) => count - 1);

    setExits((current) => {
      const remaining = current.filter(
        (exit) => exit.id !== id,
      );

      const percentages = remaining.map(
        (exit) => exit.percentage,
      );

      const total = percentages.reduce(
        (sum, percentage) =>
          sum + Math.max(0, percentage),
        0,
      );

      const balanced =
        total > 0
          ? percentages.map((percentage) =>
              Number(
                (
                  (percentage / total) *
                  100
                ).toFixed(6),
              ),
            )
          : getDefaultAllocations(
              Math.max(1, exitCount - 1),
            );

      const lots = calculateExecutableLots(
        totalLot,
        balanced,
      );

      return remaining.map((exit, index) => ({
        ...exit,
        id: index + 1,
        percentage: balanced[index],
        lot: lots[index],
      }));
    });
  };

  const fillRemaining = () => {
    setExits((current) => {
      const next = [...current];

      const used = next.reduce(
        (sum, exit) =>
          sum +
          (Number.isFinite(exit.percentage)
            ? exit.percentage
            : 0),
        0,
      );

      const remaining = Math.max(
        0,
        100 - used,
      );

      const lastIndex = next.length - 1;

      if (lastIndex >= 0) {
        next[lastIndex] = {
          ...next[lastIndex],
          percentage: remaining,
          lot: calculateLotFromPercentage(
            totalLot,
            remaining,
          ),
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

  const statusLabel =
    apiStatus === 'connected'
      ? 'ENGINE CONNECTED'
      : apiStatus === 'connecting'
        ? 'CONNECTING'
        : 'Calculation Engine';

  return (
    <div className="planner-app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="planner-shell">
        {/* Header */}
        <header className="planner-header">
          <div className="top-bar">
            <div className="brand">
              <div className="brand-mark">
                <Activity size={20} />
              </div>

              <div>
                <span className="brand-name">
                  LOT<span>FLOW</span>
                </span>

                <span className="brand-subtitle">
                  TRADE PLANNING TERMINAL
                </span>
              </div>
            </div>

            <div
              className={`api-status ${apiStatus}`}
            >
              <span className="status-dot" />
              {statusLabel}
            </div>
          </div>

          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={14} />
              PRECISION EXIT PLANNER
            </div>

            <h1 className="hero-title">
              PARTIAL <span>TP</span>
            </h1>

            <Text
              as="p"
              size={700}
              className="planner-title"
            >
              Partial Take-Profit &amp; RR Planner
            </Text>

            <Text
              as="p"
              size={400}
              className="planner-subtitle"
            >
              Structure your exits, calculate executable
              lots, and see your weighted risk-to-reward
              in real time.
            </Text>
          </div>

          <div className="hero-stats">
            <div>
              <span>MODEL</span>
              <strong>PARTIAL EXIT</strong>
            </div>

            <div>
              <span>CALCULATION</span>
              <strong>WEIGHTED RR</strong>
            </div>

            <div>
              <span>ENGINE</span>
              <strong>
                <Zap size={13} />
                REAL-TIME
              </strong>
            </div>
          </div>
        </header>

        {/* Snapshot */}
        <TradeSnapshot
          totalLot={totalLot}
          stopLossPips={stopLossPips}
          totalAllocated={
            allocation.totalAllocated
          }
          overallRR={displayedOverall.ratio}
        />

        {/* Main workspace */}
        <div className="workspace-label">
          <span />
          POSITION WORKSPACE
          <span />
        </div>

        <div className="planner-grid">
          <div className="panel panel-form">
            <div className="panel-topline">
              <div>
                <span className="panel-kicker">
                  CONFIGURATION
                </span>

                <h2>Build your trade</h2>
              </div>

              <div className="panel-number">
                01
              </div>
            </div>

            <PlannerForm
              totalLot={totalLot}
              exitCount={exitCount}
              stopLossPips={stopLossPips}
              exits={normalizedExits}
              targetRr={targetRr}
              mode={mode}
              onTotalLotChange={(value) =>
                setTotalLot(
                  Math.max(0.01, value),
                )
              }
              onExitCountChange={
                handleExitCountChange
              }
              onExitChange={updateExit}
              onRemoveExit={removeExit}
              onStopLossChange={(value) =>
                setStopLossPips(
                  Math.max(0, value),
                )
              }
              onTargetRrChange={(value) =>
                setTargetRr(
                  Math.max(0, value),
                )
              }
              onFillRemaining={fillRemaining}
              onLoadExample={loadExample}
              onReset={reset}
              onModeChange={(nextMode) =>
                setMode(nextMode)
              }
            />
          </div>

          <div className="panel panel-results">

  {/* PANEL HEADER */}
  <div className="panel-topline">
    <div>
      <span className="panel-kicker">
        ANALYTICS
      </span>

      <h2>Trade projection</h2>
    </div>

    <div className="panel-number">
      02
    </div>
  </div>

  {/* MAIN RESULTS */}
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

  {/* TRADE INTELLIGENCE */}
  <section className="trade-intelligence">

    <div className="intelligence-header">
      <div>
        <span className="section-eyebrow">
          TRADE INTELLIGENCE
        </span>

        <h3>Execution map</h3>
      </div>

      <span className="live-indicator">
        <span />
        LIVE
      </span>
    </div>

    <div className="exit-map">

      <div className="exit-map-line" />

      <div className="exit-point entry-point">
        <div className="point-dot" />
        <span>ENTRY</span>
        <strong>0</strong>
      </div>

      {normalizedExits.slice(0, 4).map((exit, index) => (
        <div
          className={`exit-point ${
            index === normalizedExits.length - 1
              ? 'final-point'
              : ''
          }`}
          key={exit.id}
        >
          <div className="point-dot" />

          <span>
            TP {index + 1}
          </span>

          <strong>
            {Number(exit.tpPips || 0).toFixed(0)}
          </strong>

          <small>
            {stopLossPips > 0
              ? `+${(
                  Number(exit.tpPips || 0) /
                  stopLossPips
                ).toFixed(2)}R`
              : '—'}
          </small>
        </div>
      ))}

    </div>

    <div className="rr-ladder">

      <div className="mini-heading">
        <span>RR LADDER</span>
        <span>PROJECTED</span>
      </div>

      {normalizedExits.slice(0, 4).map((exit, index) => {

        const rr =
          stopLossPips > 0
            ? Number(exit.tpPips || 0) / stopLossPips
            : 0;

        const width = Math.min(
          100,
          Math.max(5, rr * 45)
        );

        return (
          <div
            className="rr-row"
            key={`rr-${exit.id}`}
          >
            <span>
              TP {String(index + 1).padStart(2, '0')}
            </span>

            <div className="rr-bar">
              <div
                style={{
                  width: `${width}%`,
                }}
              />
            </div>

            <strong>
              1 : {rr.toFixed(2)}
            </strong>
          </div>
        );
      })}

    </div>

    <div className="position-status">

      <div className="status-title">
        <span>POSITION STATUS</span>

        <span className="status-complete">
          {allocation.totalAllocated >= 99.99
            ? 'FULLY PLANNED'
            : 'INCOMPLETE'}
        </span>
      </div>

      <div className="status-metrics">

        <div>
          <span>Allocated</span>
          <strong>
            {allocation.totalAllocated.toFixed(0)}%
          </strong>
        </div>

        <div>
          <span>Remaining</span>
          <strong>
            {allocation.remaining.toFixed(0)}%
          </strong>
        </div>

        <div>
          <span>Weighted RR</span>
          <strong>
            1 : {displayedOverall.ratio.toFixed(2)}
          </strong>
        </div>

      </div>

      <div className="allocation-progress">
        <div
          style={{
            width: `${Math.min(
              100,
              allocation.totalAllocated
            )}%`,
          }}
        />
      </div>

    </div>

    <div className="execution-checklist">

      <div className="check-item">
        <span className="check-icon">✓</span>

        <div>
          <strong>Risk defined</strong>
          <small>
            {stopLossPips > 0
              ? `${stopLossPips} pips SL`
              : 'Stop loss required'}
          </small>
        </div>
      </div>

      <div className="check-item">
        <span className="check-icon">✓</span>

        <div>
          <strong>Targets mapped</strong>
          <small>
            {normalizedExits.length} exit levels
          </small>
        </div>
      </div>

      <div className="check-item">
        <span className="check-icon">✓</span>

        <div>
          <strong>Position allocated</strong>
          <small>
            {allocation.totalAllocated.toFixed(0)}% planned
          </small>
        </div>
      </div>

      <div className="check-item">
        <span className="check-icon">✓</span>

        <div>
          <strong>Execution ready</strong>
          <small>
            {allocation.totalAllocated >= 99.99
              ? 'Trade plan complete'
              : 'Allocation incomplete'}
          </small>
        </div>
      </div>

    </div>

  </section>

</div>
        </div>

        <footer className="planner-footer">
          <div className="footer-left">
            <span className="footer-pulse" />
            <span>
              LOTFLOW · PARTIAL EXIT PLANNER
            </span>
          </div>

          <span>
            Plan the risk. Execute the plan.
          </span>
        </footer>
      </main>
    </div>
  );
}