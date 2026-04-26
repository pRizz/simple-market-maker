import "server-only";

import type {
  BacktestDefinitionDraft,
  BacktestDefinitionRecord,
  BacktestRunRecord,
} from "@/modules/backtests/domain/backtest-definition";
import { maybeParseBacktestDefinition } from "@/modules/backtests/domain/maybe-parse-backtest-definition";
import { runLadderBacktest } from "@/modules/backtests/domain/run-ladder-backtest";
import type { RawBacktestDefinitionInput } from "@/modules/backtests/ui/backtest-form-schema";
import {
  createBacktestRepository,
  type BacktestRepository,
} from "@/modules/backtests/server/backtest-repository";
import {
  createBacktestRunRepository,
  type BacktestRunRepository,
} from "@/modules/backtests/server/backtest-run-repository";
import type { MarketDataProvider } from "@/modules/backtests/server/market-data-provider";
import { SampleMarketDataProvider } from "@/modules/backtests/server/sample-market-data-provider";

const defaultEngineVersion = "ladder-engine@1";

type BacktestServiceDependencies = {
  backtestRepository?: BacktestRepository;
  backtestRunRepository?: BacktestRunRepository;
  engineVersion?: string;
  marketDataProvider?: MarketDataProvider;
};

type CreateOrUpdateBacktestResult =
  | {
      ok: true;
      backtest: BacktestDefinitionRecord;
    }
  | {
      ok: false;
      fieldErrors: Record<string, string>;
      formErrors: string[];
    };

type RunBacktestResult =
  | {
      ok: true;
      run: BacktestRunRecord;
    }
  | {
      ok: false;
      message: string;
      run: BacktestRunRecord | null;
    };

type ParsedBacktestDraftResult =
  | {
      ok: true;
      draft: BacktestDefinitionDraft;
    }
  | {
      ok: false;
      fieldErrors: Record<string, string>;
      formErrors: string[];
    };

function parseBacktestDraft(
  rawInput: RawBacktestDefinitionInput,
): ParsedBacktestDraftResult {
  const parsedDefinition = maybeParseBacktestDefinition(rawInput);

  if (!parsedDefinition.ok) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        Object.entries(parsedDefinition.fieldErrors).filter(
          ([, maybeMessage]) => maybeMessage !== undefined,
        ),
      ) as Record<string, string>,
      formErrors: parsedDefinition.formErrors,
    };
  }

  return {
    ok: true,
    draft: parsedDefinition.value,
  };
}

export type BacktestService = ReturnType<typeof createBacktestService>;

export function createBacktestService(
  dependencies: BacktestServiceDependencies = {},
) {
  const backtestRepository =
    dependencies.backtestRepository ?? createBacktestRepository();
  const backtestRunRepository =
    dependencies.backtestRunRepository ?? createBacktestRunRepository();
  const marketDataProvider =
    dependencies.marketDataProvider ?? new SampleMarketDataProvider();
  const engineVersion = dependencies.engineVersion ?? defaultEngineVersion;

  return {
    async listBacktests(): Promise<BacktestDefinitionRecord[]> {
      return backtestRepository.listBacktests();
    },

    async getBacktest(
      definitionId: string,
    ): Promise<BacktestDefinitionRecord | null> {
      return backtestRepository.getBacktestById(definitionId);
    },

    async createBacktest(
      rawInput: RawBacktestDefinitionInput,
    ): Promise<CreateOrUpdateBacktestResult> {
      const parsedDraft = parseBacktestDraft(rawInput);

      if (!parsedDraft.ok) {
        return parsedDraft;
      }

      const backtest = await backtestRepository.createBacktest(parsedDraft.draft);

      return {
        ok: true,
        backtest,
      };
    },

    async updateBacktest(
      definitionId: string,
      rawInput: RawBacktestDefinitionInput,
    ): Promise<CreateOrUpdateBacktestResult> {
      const maybeExistingBacktest =
        await backtestRepository.getBacktestById(definitionId);

      if (!maybeExistingBacktest) {
        return {
          ok: false,
          fieldErrors: {},
          formErrors: ["Backtest not found."],
        };
      }

      const parsedDraft = parseBacktestDraft(rawInput);

      if (!parsedDraft.ok) {
        return parsedDraft;
      }

      const backtest = await backtestRepository.updateBacktest(
          definitionId,
          parsedDraft.draft,
      );

      if (!backtest) {
        return {
          ok: false,
          fieldErrors: {},
          formErrors: ["Backtest not found."],
        };
      }

      return {
        ok: true,
        backtest,
      };
    },

    async deleteBacktest(definitionId: string): Promise<boolean> {
      return backtestRepository.deleteBacktest(definitionId);
    },

    async listRuns(definitionId: string): Promise<BacktestRunRecord[]> {
      return backtestRunRepository.listRunsByDefinitionId(definitionId);
    },

    async listRecentRuns(limitCount: number): Promise<BacktestRunRecord[]> {
      return backtestRunRepository.listRecentRuns(limitCount);
    },

    async getRun(runId: string): Promise<BacktestRunRecord | null> {
      return backtestRunRepository.getRunById(runId);
    },

    async runBacktest(definitionId: string): Promise<RunBacktestResult> {
      const maybeBacktest = await backtestRepository.getBacktestById(definitionId);

      if (!maybeBacktest) {
        return {
          ok: false,
          message: "Backtest not found.",
          run: null,
        };
      }

      const runningRun = await backtestRunRepository.createRunningRun({
        definitionId: maybeBacktest.id,
        engineVersion,
        startedAt: new Date(),
      });

      try {
        const candles = await marketDataProvider.fetchCandles(maybeBacktest);
        const simulationResult = runLadderBacktest(maybeBacktest, candles);
        const completedRun = await backtestRunRepository.completeRun({
          completedAt: new Date(),
          result: simulationResult,
          runId: runningRun.id,
        });

        return {
          ok: true,
          run: completedRun,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Backtest run failed.";
        const failedRun = await backtestRunRepository.failRun({
          errorMessage: message,
          runId: runningRun.id,
        });

        return {
          ok: false,
          message,
          run: failedRun,
        };
      }
    },
  };
}

export type CreateOrUpdateBacktestResponse = CreateOrUpdateBacktestResult;
export type RunBacktestResponse = RunBacktestResult;
