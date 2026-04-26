import { BacktestForm } from "@/components/backtests/backtest-form";
import { PageHeader } from "@/components/ui/shell";

export default function NewBacktestPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Create"
        title="Create a ladder backtest"
        description="Define ladder spacing, risk controls, and the market window for a saved strategy."
      />
      <BacktestForm mode="create" />
    </div>
  );
}
