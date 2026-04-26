import "server-only";

import { and, desc, eq } from "drizzle-orm";

import type { BacktestRunRecord } from "@/modules/backtests/domain/backtest-definition";
import type { BacktestSimulationResult } from "@/modules/backtests/domain/run-ladder-backtest";
import { db } from "@/modules/db/client";
import { backtestRunsTable } from "@/modules/db/schema";

type CreateRunningRunInput = {
  definitionId: string;
  engineVersion: string;
  startedAt: Date;
};

type CompleteRunInput = {
  completedAt: Date;
  result: BacktestSimulationResult;
  runId: string;
};

type FailRunInput = {
  errorMessage: string;
  runId: string;
};

type RunRow = typeof backtestRunsTable.$inferSelect;

function maybeNumericToNumber(maybeValue: string | null): number | null {
  if (maybeValue === null) {
    return null;
  }

  return Number(maybeValue);
}

function maybeJsonToString(maybeValue: unknown): string | null {
  if (maybeValue === null || maybeValue === undefined) {
    return null;
  }

  return JSON.stringify(maybeValue);
}

function mapRunRow(row: RunRow): BacktestRunRecord {
  return {
    id: row.id,
    definitionId: row.definitionId,
    status: row.status,
    engineVersion: row.engineVersion,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    finalEquity: maybeNumericToNumber(row.finalEquity),
    totalReturnPercent: maybeNumericToNumber(row.totalReturnPercent),
    maxDrawdownPercent: maybeNumericToNumber(row.maxDrawdownPercent),
    tradeCount: row.tradeCount,
    errorMessage: row.errorMessage,
    summaryJson: maybeJsonToString(row.summaryJson),
    chartSeriesJson: maybeJsonToString(row.chartSeriesJson),
    fillEventsJson: maybeJsonToString(row.fillEventsJson),
    priceSeriesJson: maybeJsonToString(row.priceSeriesJson),
    createdAt: row.createdAt,
  };
}

export type BacktestRunRepository = ReturnType<
  typeof createBacktestRunRepository
>;

export function createBacktestRunRepository() {
  return {
    async createRunningRun(
      input: CreateRunningRunInput,
    ): Promise<BacktestRunRecord> {
      const [row] = await db
        .insert(backtestRunsTable)
        .values({
          definitionId: input.definitionId,
          engineVersion: input.engineVersion,
          startedAt: input.startedAt,
          status: "running",
        })
        .returning();

      return mapRunRow(row);
    },

    async completeRun(input: CompleteRunInput): Promise<BacktestRunRecord> {
      const [row] = await db
        .update(backtestRunsTable)
        .set({
          chartSeriesJson: input.result.artifacts.chartSeries,
          completedAt: input.completedAt,
          fillEventsJson: input.result.artifacts.fillEvents,
          finalEquity: input.result.summary.finalEquity.toFixed(2),
          maxDrawdownPercent:
            input.result.summary.maxDrawdownPercent.toFixed(4),
          priceSeriesJson: input.result.artifacts.priceSeries,
          status: "completed",
          summaryJson: input.result.summary,
          totalReturnPercent:
            input.result.summary.totalReturnPercent.toFixed(4),
          tradeCount: input.result.summary.tradeCount,
        })
        .where(eq(backtestRunsTable.id, input.runId))
        .returning();

      return mapRunRow(row);
    },

    async failRun(input: FailRunInput): Promise<BacktestRunRecord> {
      const [row] = await db
        .update(backtestRunsTable)
        .set({
          completedAt: new Date(),
          errorMessage: input.errorMessage,
          status: "failed",
        })
        .where(eq(backtestRunsTable.id, input.runId))
        .returning();

      return mapRunRow(row);
    },

    async getRunById(runId: string): Promise<BacktestRunRecord | null> {
      const [row] = await db
        .select()
        .from(backtestRunsTable)
        .where(eq(backtestRunsTable.id, runId))
        .limit(1);

      return row ? mapRunRow(row) : null;
    },

    async getRunByDefinitionAndId(input: {
      definitionId: string;
      runId: string;
    }): Promise<BacktestRunRecord | null> {
      const [row] = await db
        .select()
        .from(backtestRunsTable)
        .where(
          and(
            eq(backtestRunsTable.definitionId, input.definitionId),
            eq(backtestRunsTable.id, input.runId),
          ),
        )
        .limit(1);

      return row ? mapRunRow(row) : null;
    },

    async listRecentRuns(limitCount: number): Promise<BacktestRunRecord[]> {
      const rows = await db
        .select()
        .from(backtestRunsTable)
        .orderBy(desc(backtestRunsTable.startedAt))
        .limit(limitCount);

      return rows.map(mapRunRow);
    },

    async listRunsByDefinitionId(
      definitionId: string,
    ): Promise<BacktestRunRecord[]> {
      const rows = await db
        .select()
        .from(backtestRunsTable)
        .where(eq(backtestRunsTable.definitionId, definitionId))
        .orderBy(desc(backtestRunsTable.startedAt));

      return rows.map(mapRunRow);
    },
  };
}
