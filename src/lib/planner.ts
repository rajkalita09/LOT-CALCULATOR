export type ExitType = 'take-profit' | 'trailing';

export type ExitPlan = {
  id: number;
  percentage: number;
  lot: number;
  tpPips: number;
  trailingPips?: number;
  type: ExitType;
};

export type RRResult = {
  reward: number;
  risk: number;
  ratio: number;
  ratioLabel: string;
  rewardLabel: string;
  riskLabel: string;
};

export const DEFAULT_ALLOCATIONS: Record<number, number[]> = {
  1: [100],
  2: [30, 70],
  3: [30, 50, 20],
  4: [30, 30, 20, 20],
};

export function getDefaultAllocations(exitCount: number): number[] {
  if (exitCount <= 4) {
    return [...(DEFAULT_ALLOCATIONS[Math.max(1, exitCount)] ?? DEFAULT_ALLOCATIONS[1])];
  }

  const remainingCount = exitCount - 3;
  const base = [30, 30, 20];
  const remaining = 20;
  const perExit = Math.floor((remaining / remainingCount) * 100) / 100;
  const allocations = [...base, ...Array.from({ length: remainingCount }, () => perExit)];
  const difference = Number((100 - allocations.reduce((sum, percentage) => sum + percentage, 0)).toFixed(6));
  allocations[allocations.length - 1] = Number((allocations[allocations.length - 1] + difference).toFixed(6));
  return allocations;
}

export function calculateExecutableLots(totalLot: number, percentages: number[]): number[] {
  if (!Number.isFinite(totalLot) || totalLot < 0 || percentages.length === 0) {
    return percentages.map(() => 0);
  }

  const totalCents = Math.round(totalLot * 100);
  const theoreticalCents = percentages.map((percentage) => Math.max(0, totalCents * percentage / 100));
  const lotsInCents = theoreticalCents.map(Math.floor);
  let centsRemaining = totalCents - lotsInCents.reduce((sum, cents) => sum + cents, 0);

  [...theoreticalCents.keys()]
    .sort((left, right) => (theoreticalCents[right] - Math.floor(theoreticalCents[right])) - (theoreticalCents[left] - Math.floor(theoreticalCents[left])))
    .forEach((index) => {
      if (centsRemaining > 0) {
        lotsInCents[index] += 1;
        centsRemaining -= 1;
      }
    });

  return lotsInCents.map((cents) => Number((cents / 100).toFixed(2)));
}

export function rebalanceAllocations(percentages: number[], changedIndex: number, requestedPercentage: number): number[] {
  const count = percentages.length;
  if (count === 0) {
    return [];
  }

  const changed = Math.min(100, Math.max(0, Number.isFinite(requestedPercentage) ? requestedPercentage : 0));
  const otherTotal = percentages.reduce((sum, percentage, index) => index === changedIndex ? sum : sum + Math.max(0, percentage), 0);
  const remaining = 100 - changed;

  if (count === 1) {
    return [100];
  }

  const balanced = percentages.map((percentage, index) => {
    if (index === changedIndex) {
      return changed;
    }

    const share = otherTotal > 0 ? Math.max(0, percentage) / otherTotal : 1 / (count - 1);
    return Number((remaining * share).toFixed(6));
  });

  const difference = Number((100 - balanced.reduce((sum, percentage) => sum + percentage, 0)).toFixed(6));
  const lastOtherIndex = [...balanced.keys()].reverse().find((index) => index !== changedIndex);
  if (lastOtherIndex !== undefined) {
    balanced[lastOtherIndex] = Number((balanced[lastOtherIndex] + difference).toFixed(6));
  }

  return balanced;
}

export function calculateLotFromPercentage(totalLot: number, percentage: number): number {
  if (!Number.isFinite(totalLot) || !Number.isFinite(percentage) || totalLot <= 0) {
    return 0;
  }

  return Number(((totalLot * percentage) / 100).toFixed(6));
}

export function calculateInitialRisk(totalLot: number, stopLossPips: number): number {
  if (!Number.isFinite(totalLot) || !Number.isFinite(stopLossPips) || totalLot <= 0 || stopLossPips < 0) {
    return 0;
  }

  return Number((totalLot * stopLossPips).toFixed(2));
}

export function calculateWeightedReward(
  totalLot: number,
  stopLossPips: number,
  exits: Array<{ id: number; percentage: number; lot: number; tpPips: number; trailingPips?: number; type: ExitType }>,
): number {
  if (!Number.isFinite(totalLot) || totalLot <= 0 || !Number.isFinite(stopLossPips) || stopLossPips < 0) {
    return 0;
  }

  return exits.reduce((sum, exit) => {
    if (!Number.isFinite(exit.percentage) || !Number.isFinite(exit.tpPips)) {
      return sum;
    }

    const exitLot = exit.type === 'trailing' && exit.trailingPips ? Math.max(0, exit.lot) : exit.lot;
    const pips = exit.type === 'trailing' && exit.trailingPips ? exit.trailingPips : exit.tpPips;
    const reward = exitLot * pips;

    return sum + reward;
  }, 0);
}

export function calculateOverallRR(
  totalLot: number,
  stopLossPips: number,
  exits: Array<{ id: number; percentage: number; lot: number; tpPips: number; trailingPips?: number; type: ExitType }>,
): RRResult {
  const risk = calculateInitialRisk(totalLot, stopLossPips);
  const reward = calculateWeightedReward(totalLot, stopLossPips, exits);
  const ratio = risk > 0 ? reward / risk : 0;

  return {
    reward,
    risk,
    ratio,
    ratioLabel: `1 : ${ratio.toFixed(2)}`,
    rewardLabel: `${reward.toFixed(0)} PIP-UNITS`,
    riskLabel: `${risk.toFixed(0)} PIP-UNITS`,
  };
}

export function calculateRequiredTP(
  totalLot: number,
  stopLossPips: number,
  exits: Array<{ id: number; percentage: number; lot: number; tpPips: number; trailingPips?: number; type: ExitType }>,
  targetRR: number,
): number {
  const risk = calculateInitialRisk(totalLot, stopLossPips);
  const targetReward = risk * targetRR;
  const booked = calculateWeightedReward(totalLot, stopLossPips, exits.filter((_, index) => index < exits.length - 1));
  const remainingLot = exits[exits.length - 1]?.lot ?? 0;
  const remainingRequired = Math.max(0, targetReward - booked);

  if (remainingLot <= 0) {
    return 0;
  }

  return Number((remainingRequired / remainingLot).toFixed(0));
}

export function validateAllocation(percentages: number[], totalPercent: number, maxExits: number): {
  totalAllocated: number;
  remaining: number;
  isValid: boolean;
  overflow: boolean;
  values: number[];
} {
  const clean = percentages.slice(0, maxExits).map((value) => Number.isFinite(value) ? Math.max(0, value) : 0);
  const totalAllocated = clean.reduce((sum, value) => sum + value, 0);
  const remaining = totalPercent - totalAllocated;
  const isValid = Math.abs(remaining) < 0.01;
  const overflow = totalAllocated > totalPercent;

  return {
    totalAllocated,
    remaining,
    isValid,
    overflow,
    values: clean,
  };
}

export function formatRR(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0.00R';
  }

  return `${value.toFixed(2)}R`;
}
