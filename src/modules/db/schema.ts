import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const orderSizeModeEnum = pgEnum("order_size_mode", [
  "fixed_amount",
  "percent_of_capital",
]);

export const fillPolicyEnum = pgEnum("fill_policy", [
  "buy-first",
  "sell-first",
]);

export const backtestRunStatusEnum = pgEnum("backtest_run_status", [
  "running",
  "completed",
  "failed",
]);

export const marketDataSourceEnum = pgEnum("market_data_source", [
  "sample",
  "alpha_vantage",
]);

export const marketDataIntervalEnum = pgEnum("market_data_interval", [
  "daily",
]);

export const appSettingsTable = pgTable("app_settings", {
  id: text("id").primaryKey().default("singleton"),
  defaultProvider: text("default_provider").notNull().default("alpha_vantage"),
  missingDataBehavior: text("missing_data_behavior")
    .notNull()
    .default("confirm_before_fetch"),
  showSampleData: boolean("show_sample_data").notNull().default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const providerApiKeysTable = pgTable("provider_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerId: text("provider_id").notNull().unique(),
  encryptedKey: text("encrypted_key").notNull(),
  encryptionIv: text("encryption_iv").notNull(),
  encryptionAuthTag: text("encryption_auth_tag").notNull(),
  maskedSuffix: text("masked_suffix").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  validationStatus: text("validation_status")
    .notNull()
    .default("not_validated"),
  validationMessage: text("validation_message"),
  lastValidatedAt: timestamp("last_validated_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const backtestDefinitionsTable = pgTable("backtest_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ticker: text("ticker").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  startingCapital: numeric("starting_capital", {
    precision: 14,
    scale: 2,
  }).notNull(),
  incrementPercent: numeric("increment_percent", {
    precision: 10,
    scale: 4,
  }).notNull(),
  bidLevels: integer("bid_levels").notNull(),
  askLevels: integer("ask_levels").notNull(),
  orderSizeMode: orderSizeModeEnum("order_size_mode").notNull(),
  orderSizeValue: numeric("order_size_value", {
    precision: 14,
    scale: 4,
  }).notNull(),
  maxPositionValue: numeric("max_position_value", {
    precision: 14,
    scale: 2,
  }).notNull(),
  feesBps: integer("fees_bps").notNull(),
  slippageBps: integer("slippage_bps").notNull(),
  fillPolicy: fillPolicyEnum("fill_policy").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const backtestRunsTable = pgTable("backtest_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  definitionId: uuid("definition_id")
    .references(() => backtestDefinitionsTable.id, { onDelete: "cascade" })
    .notNull(),
  status: backtestRunStatusEnum("status").notNull(),
  engineVersion: text("engine_version").notNull(),
  startedAt: timestamp("started_at", {
    withTimezone: true,
  }).notNull(),
  completedAt: timestamp("completed_at", {
    withTimezone: true,
  }),
  finalEquity: numeric("final_equity", {
    precision: 14,
    scale: 2,
  }),
  totalReturnPercent: numeric("total_return_percent", {
    precision: 12,
    scale: 4,
  }),
  maxDrawdownPercent: numeric("max_drawdown_percent", {
    precision: 12,
    scale: 4,
  }),
  tradeCount: integer("trade_count").notNull().default(0),
  errorMessage: text("error_message"),
  summaryJson: jsonb("summary_json"),
  chartSeriesJson: jsonb("chart_series_json"),
  fillEventsJson: jsonb("fill_events_json"),
  priceSeriesJson: jsonb("price_series_json"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const marketDataChunksTable = pgTable("market_data_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticker: text("ticker").notNull(),
  source: marketDataSourceEnum("source").notNull(),
  interval: marketDataIntervalEnum("interval").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  candleCount: integer("candle_count").notNull(),
  candlesJson: jsonb("candles_json").notNull(),
  notes: text("notes").notNull(),
  fetchedAt: timestamp("fetched_at", {
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).defaultNow().notNull(),
});
