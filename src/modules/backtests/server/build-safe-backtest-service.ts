import "server-only";

import type {
  BacktestDefinitionRecord,
  BacktestRunRecord,
} from "@/modules/backtests/domain/backtest-definition";
import {
  createBacktestService,
  type BacktestService,
} from "@/modules/backtests/server/backtest-service";

function unavailableRun(runId: string): BacktestRunRecord {
  const now = new Date();

  return {
    id: runId,
    definitionId: "Unavailable",
    status: "failed",
    engineVersion: "ladder-engine@1",
    startedAt: now,
    completedAt: now,
    finalEquity: null,
    totalReturnPercent: null,
    maxDrawdownPercent: null,
    tradeCount: 0,
    errorMessage: "Unavailable during build.",
    summaryJson: null,
    chartSeriesJson: null,
    fillEventsJson: null,
    priceSeriesJson: null,
    createdAt: now,
  };
}

function placeholderBacktests(): BacktestDefinitionRecord[] {
  return [];
}

function isBuildPhase(): boolean {
  return !process.env.DATABASE_URL;
}

export function getBuildSafeBacktestService(): BacktestService {
  if (!isBuildPhase()) {
    return createBacktestService();
  }

  return {
    async listBacktests() {
      return placeholderBacktests();
    },

    async getBacktest() {
      return null;
    },

    async createBacktest() {
      return {
        ok: false,
        fieldErrors: {},
        formErrors: ["Database unavailable during build."],
      };
    },

    async updateBacktest() {
      return {
        ok: false,
        fieldErrors: {},
        formErrors: ["Database unavailable during build."],
      };
    },

    async deleteBacktest() {
      return false;
    },

    async listRuns() {
      return [];
    },

    async listRecentRuns() {
      return [];
    },

    async getRun(runId: string) {
      return unavailableRun(runId);
    },

    async runBacktest(definitionId: string) {
      return {
        ok: false,
        message: "Database unavailable during build.",
        run: unavailableRun(definitionId),
      };
    },
  };
}
