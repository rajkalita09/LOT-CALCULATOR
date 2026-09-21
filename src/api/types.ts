import type { PartialExit } from '../types/planner';

export type CalculationRequest = {
  totalLot: number;
  stopLossPips: number;
  targetRr: number;
  exits: PartialExit[];
};

export type CalculationResponse = {
  reward: number;
  risk: number;
  ratio: number;
  requiredFinalTp: number;
  exits: PartialExit[];
};

export interface ApiClient {
  calculate(request: CalculationRequest): Promise<CalculationResponse>;
  health(): Promise<{ status: string; service: string }>;
}
