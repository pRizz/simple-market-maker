import { MarketDataForm } from "@/components/market-data/market-data-form";
import { PageHeader } from "@/components/ui/shell";

export default function NewMarketDataPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        description="Download a daily OHLCV range for a ticker and persist it as a reusable data chunk."
        eyebrow="Fetch"
        title="Fetch ticker market data"
      />
      <MarketDataForm />
    </div>
  );
}
