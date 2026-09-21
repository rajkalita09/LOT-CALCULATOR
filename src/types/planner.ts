export type ExitType = 'take-profit' | 'trailing';

export type PartialExit = {
  id: number;
  percentage: number;
  lot: number;
  tpPips: number;
  trailingPips?: number;
  type: ExitType;
};

export type PlannerState = {
  totalLot: number;
  stopLossPips: number;
  exitCount: number;
  exits: PartialExit[];
  targetRr: number;
  mode: 'calculate' | 'target';
};
