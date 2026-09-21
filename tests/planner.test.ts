import { describe, expect, it } from 'vitest';
import {
  calculateInitialRisk,
  calculateExecutableLots,
  calculateLotFromPercentage,
  calculateOverallRR,
  calculateRequiredTP,
  calculateWeightedReward,
  getDefaultAllocations,
  rebalanceAllocations,
  validateAllocation,
} from '../src/lib/planner';

describe('partial TP planner', () => {
  it('calculates weighted RR for a 3-part exit plan', () => {
    const exits = [
      { id: 1, percentage: 30, lot: 0.3, tpPips: 50, type: 'take-profit' as const },
      { id: 2, percentage: 50, lot: 0.5, tpPips: 150, type: 'take-profit' as const },
      { id: 3, percentage: 20, lot: 0.2, tpPips: 300, type: 'trailing' as const, trailingPips: 300 },
    ];

    const rr = calculateOverallRR(1, 100, exits);
    expect(rr.ratio).toBeCloseTo(1.5, 2);
    expect(rr.reward).toBe(150);
    expect(rr.risk).toBe(100);
  });

  it('calculates the remaining TP required for a target RR', () => {
    const exits = [
      { id: 1, percentage: 30, lot: 0.3, tpPips: 50, type: 'take-profit' as const },
      { id: 2, percentage: 50, lot: 0.5, tpPips: 150, type: 'take-profit' as const },
      { id: 3, percentage: 20, lot: 0.2, tpPips: 0, type: 'take-profit' as const },
    ];

    const required = calculateRequiredTP(1, 100, exits, 1.5);
    expect(required).toBe(300);
  });

  it('validates allocation and fills remaining percentage', () => {
    const result = validateAllocation([30, 50, 10], 100, 4);
    expect(result.totalAllocated).toBe(90);
    expect(result.remaining).toBe(10);
    expect(result.isValid).toBe(false);
  });

  it('provides fully allocated defaults for 1 to 4 exits', () => {
    expect(getDefaultAllocations(1)).toEqual([100]);
    expect(getDefaultAllocations(2)).toEqual([30, 70]);
    expect(getDefaultAllocations(3)).toEqual([30, 50, 20]);
    expect(getDefaultAllocations(4)).toEqual([30, 30, 20, 20]);
    expect(getDefaultAllocations(5).reduce((sum, percentage) => sum + percentage, 0)).toBe(100);
    expect(getDefaultAllocations(6).length).toBe(6);
    expect(getDefaultAllocations(8).length).toBe(8);
  });

  it('proportionally rebalances untouched exits when one allocation changes', () => {
    expect(rebalanceAllocations([30, 70], 0, 60)).toEqual([60, 40]);
    expect(rebalanceAllocations([30, 50, 20], 0, 60)).toEqual([60, 28.571429, 11.428571]);
    expect(rebalanceAllocations([30, 30, 20, 20], 0, 50)).toEqual([50, 21.428571, 14.285714, 14.285715]);
  });

  it('computes lot from percentage', () => {
    expect(calculateLotFromPercentage(3.5, 30)).toBe(1.05);
    expect(calculateLotFromPercentage(0.05, 30)).toBe(0.015);
    expect(calculateLotFromPercentage(0.01, 30)).toBe(0.003);
    expect(calculateLotFromPercentage(0.001, 50)).toBe(0.0005);
    expect(calculateInitialRisk(3.5, 100)).toBe(350);
    expect(calculateWeightedReward(3.5, 100, [
      { id: 1, percentage: 30, lot: 1.05, tpPips: 50, type: 'take-profit' },
      { id: 2, percentage: 50, lot: 1.75, tpPips: 150, type: 'take-profit' },
      { id: 3, percentage: 20, lot: 0.7, tpPips: 300, type: 'take-profit' },
    ])).toBe(525);
  });

  it('rounds executable lots to cents and reconciles the total', () => {
    const lots = calculateExecutableLots(1.15, [30, 50, 20]);
    expect(lots).toEqual([0.35, 0.57, 0.23]);
    expect(lots.reduce((sum, lot) => sum + lot, 0)).toBe(1.15);
    expect(calculateExecutableLots(0.05, [30, 70])).toEqual([0.02, 0.03]);
  });
});
