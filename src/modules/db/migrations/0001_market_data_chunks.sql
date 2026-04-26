DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'market_data_source') THEN
    CREATE TYPE market_data_source AS ENUM ('sample', 'alpha_vantage');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'market_data_interval') THEN
    CREATE TYPE market_data_interval AS ENUM ('daily');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS market_data_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  source market_data_source NOT NULL,
  interval market_data_interval NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  candle_count integer NOT NULL,
  candles_json jsonb NOT NULL,
  notes text NOT NULL,
  fetched_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_data_chunks_ticker_range_idx
  ON market_data_chunks (ticker, start_date, end_date);

CREATE INDEX IF NOT EXISTS market_data_chunks_created_idx
  ON market_data_chunks (created_at DESC);
