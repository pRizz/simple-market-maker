export type Candle = {
  occurredAt: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PriceSeriesPoint = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
