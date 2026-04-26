CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_size_mode') THEN
    CREATE TYPE order_size_mode AS ENUM ('fixed_amount', 'percent_of_capital');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fill_policy') THEN
    CREATE TYPE fill_policy AS ENUM ('buy-first', 'sell-first');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backtest_run_status') THEN
    CREATE TYPE backtest_run_status AS ENUM ('running', 'completed', 'failed');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS backtest_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ticker text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  starting_capital numeric(14, 2) NOT NULL,
  increment_percent numeric(10, 4) NOT NULL,
  bid_levels integer NOT NULL,
  ask_levels integer NOT NULL,
  order_size_mode order_size_mode NOT NULL,
  order_size_value numeric(14, 4) NOT NULL,
  max_position_value numeric(14, 2) NOT NULL,
  fees_bps integer NOT NULL,
  slippage_bps integer NOT NULL,
  fill_policy fill_policy NOT NULL,
  notes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backtest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id uuid NOT NULL REFERENCES backtest_definitions(id) ON DELETE CASCADE,
  status backtest_run_status NOT NULL,
  engine_version text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  final_equity numeric(14, 2),
  total_return_percent numeric(12, 4),
  max_drawdown_percent numeric(12, 4),
  trade_count integer NOT NULL DEFAULT 0,
  error_message text,
  summary_json jsonb,
  chart_series_json jsonb,
  fill_events_json jsonb,
  price_series_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backtest_definitions_ticker_idx
  ON backtest_definitions (ticker);

CREATE INDEX IF NOT EXISTS backtest_runs_definition_started_idx
  ON backtest_runs (definition_id, started_at DESC);
