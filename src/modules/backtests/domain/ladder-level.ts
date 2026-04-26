import { maxLadderLevels } from "@/modules/backtests/domain/constants";
import { roundCurrency } from "@/modules/backtests/domain/metrics";

export type LadderDirection = "bid" | "ask";

export type LadderLevel = {
  direction: LadderDirection;
  levelIndex: number;
  price: number;
  fillCount: number;
};

type CreateLevelsInput = {
  incrementPercent: number;
  levelCount: number;
  referencePrice: number;
};

function roundPrice(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function createBidLevels(input: CreateLevelsInput): LadderLevel[] {
  const levelCount = Math.min(input.levelCount, maxLadderLevels);

  return Array.from({ length: levelCount }, (_, levelIndex) => {
    const offsetMultiplier =
      1 - (input.incrementPercent / 100) * (levelIndex + 1);

    return {
      direction: "bid" as const,
      levelIndex,
      price: roundPrice(input.referencePrice * offsetMultiplier),
      fillCount: 0,
    };
  }).filter((level) => level.price > 0);
}

export function createAskLevels(input: CreateLevelsInput): LadderLevel[] {
  const levelCount = Math.min(input.levelCount, maxLadderLevels);

  return Array.from({ length: levelCount }, (_, levelIndex) => ({
    direction: "ask" as const,
    levelIndex,
    price: roundPrice(
      input.referencePrice *
        (1 + (input.incrementPercent / 100) * (levelIndex + 1)),
    ),
    fillCount: 0,
  }));
}

export function countFilledLevels(levels: LadderLevel[]): number {
  return levels.filter((level) => level.fillCount > 0).length;
}

export function ladderPreviewRows(input: {
  askLevels: LadderLevel[];
  bidLevels: LadderLevel[];
}): Array<{
  label: string;
  maybeAskPrice: number | null;
  maybeBidPrice: number | null;
}> {
  const rowCount = Math.max(input.bidLevels.length, input.askLevels.length);

  return Array.from({ length: rowCount }, (_, index) => ({
    label: `Level ${index + 1}`,
    maybeBidPrice:
      input.bidLevels[index] === undefined
        ? null
        : roundCurrency(input.bidLevels[index].price),
    maybeAskPrice:
      input.askLevels[index] === undefined
        ? null
        : roundCurrency(input.askLevels[index].price),
  }));
}
