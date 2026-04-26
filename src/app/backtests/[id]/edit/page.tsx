import { notFound } from "next/navigation";

import { BacktestForm } from "@/components/backtests/backtest-form";
import { AppShell } from "@/components/ui/shell";
import { getBacktestService } from "@/modules/backtests/server/service-singleton";

type EditBacktestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBacktestPage({
  params,
}: EditBacktestPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const backtestService = getBacktestService();
  const maybeBacktest = await backtestService.getBacktest(id);

  if (!maybeBacktest) {
    notFound();
  }

  return (
    <AppShell
      description="Adjust ladder spacing, risk controls, and execution assumptions without losing the saved definition."
      eyebrow="Update configuration"
      title={`Edit ${maybeBacktest.name}`}
    >
      <BacktestForm mode="edit" maybeDefinition={maybeBacktest} />
    </AppShell>
  );
}
