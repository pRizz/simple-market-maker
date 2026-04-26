export const maxLadderLevels = 25;
export const maxBacktestNotesLength = 2_000;

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundPercent(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export const fillPriorityByPolicy = {
  "buy-first": ["bid", "ask"],
  "sell-first": ["ask", "bid"],
} as const;
