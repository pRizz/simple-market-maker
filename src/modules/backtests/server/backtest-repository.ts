import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import type {
  BacktestDefinitionDraft,
  BacktestDefinitionRecord,
} from "@/modules/backtests/domain/backtest-definition";
import { getDbOrThrow } from "@/modules/db/client";
import { backtestDefinitionsTable } from "@/modules/db/schema";

type DefinitionRow = typeof backtestDefinitionsTable.$inferSelect;

function numericToNumber(value: string): number {
  return Number(value);
}

function mapDefinitionRow(row: DefinitionRow): BacktestDefinitionRecord {
  return {
    id: row.id,
    name: row.name,
    ticker: row.ticker,
    startDate: row.startDate,
    endDate: row.endDate,
    startingCapital: numericToNumber(row.startingCapital),
    incrementPercent: numericToNumber(row.incrementPercent),
    bidLevels: row.bidLevels,
    askLevels: row.askLevels,
    orderSizeMode: row.orderSizeMode,
    orderSizeValue: numericToNumber(row.orderSizeValue),
    maxPositionValue: numericToNumber(row.maxPositionValue),
    feesBps: row.feesBps,
    slippageBps: row.slippageBps,
    fillPolicy: row.fillPolicy,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDefinitionInsertRow(draft: BacktestDefinitionDraft) {
  return {
    name: draft.name,
    ticker: draft.ticker,
    startDate: draft.startDate,
    endDate: draft.endDate,
    startingCapital: draft.startingCapital.toFixed(2),
    incrementPercent: draft.incrementPercent.toFixed(4),
    bidLevels: draft.bidLevels,
    askLevels: draft.askLevels,
    orderSizeMode: draft.orderSizeMode,
    orderSizeValue: draft.orderSizeValue.toFixed(4),
    maxPositionValue: draft.maxPositionValue.toFixed(2),
    feesBps: draft.feesBps,
    slippageBps: draft.slippageBps,
    fillPolicy: draft.fillPolicy,
    notes: draft.notes,
  };
}

export type BacktestRepository = {
  createBacktest: (
    draft: BacktestDefinitionDraft,
  ) => Promise<BacktestDefinitionRecord>;
  deleteBacktest: (definitionId: string) => Promise<boolean>;
  getBacktestById: (
    definitionId: string,
  ) => Promise<BacktestDefinitionRecord | null>;
  listBacktests: () => Promise<BacktestDefinitionRecord[]>;
  updateBacktest: (
    definitionId: string,
    draft: BacktestDefinitionDraft,
  ) => Promise<BacktestDefinitionRecord | null>;
};

export function createBacktestRepository(): BacktestRepository {
  return {
    async createBacktest(draft) {
      const [row] = await getDbOrThrow()
        .insert(backtestDefinitionsTable)
        .values(toDefinitionInsertRow(draft))
        .returning();

      return mapDefinitionRow(row);
    },

    async deleteBacktest(definitionId) {
      const deletedRows = await getDbOrThrow()
        .delete(backtestDefinitionsTable)
        .where(eq(backtestDefinitionsTable.id, definitionId))
        .returning({ id: backtestDefinitionsTable.id });

      return deletedRows.length > 0;
    },

    async getBacktestById(definitionId) {
      const [row] = await getDbOrThrow()
        .select()
        .from(backtestDefinitionsTable)
        .where(eq(backtestDefinitionsTable.id, definitionId))
        .limit(1);

      return row ? mapDefinitionRow(row) : null;
    },

    async listBacktests() {
      const rows = await getDbOrThrow()
        .select()
        .from(backtestDefinitionsTable)
        .orderBy(
          desc(backtestDefinitionsTable.updatedAt),
          asc(backtestDefinitionsTable.name),
        );

      return rows.map(mapDefinitionRow);
    },

    async updateBacktest(definitionId, draft) {
      const [row] = await getDbOrThrow()
        .update(backtestDefinitionsTable)
        .set({
          ...toDefinitionInsertRow(draft),
          updatedAt: new Date(),
        })
        .where(eq(backtestDefinitionsTable.id, definitionId))
        .returning();

      return row ? mapDefinitionRow(row) : null;
    },
  };
}

export async function listBacktestDefinitions(): Promise<
  BacktestDefinitionRecord[]
> {
  return createBacktestRepository().listBacktests();
}

export async function getBacktestDefinitionById(
  definitionId: string,
): Promise<BacktestDefinitionRecord | null> {
  return createBacktestRepository().getBacktestById(definitionId);
}

export async function createBacktestDefinition(
  draft: BacktestDefinitionDraft,
): Promise<BacktestDefinitionRecord> {
  return createBacktestRepository().createBacktest(draft);
}

export async function updateBacktestDefinition(
  definitionId: string,
  draft: BacktestDefinitionDraft,
): Promise<BacktestDefinitionRecord | null> {
  return createBacktestRepository().updateBacktest(definitionId, draft);
}

export async function deleteBacktestDefinition(
  definitionId: string,
): Promise<boolean> {
  return createBacktestRepository().deleteBacktest(definitionId);
}
