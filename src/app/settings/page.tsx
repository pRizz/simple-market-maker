import Link from "next/link";

import { ProviderKeyForm } from "@/components/settings/provider-key-form";
import { ProviderKeyTable } from "@/components/settings/provider-key-table";
import { ProviderStatusGrid } from "@/components/settings/provider-status-grid";
import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/ui/shell";
import { StatCard } from "@/components/ui/stat-card";
import {
  defaultAppSettings,
  selectableDefaultProviderIds,
  type DefaultProviderId,
} from "@/modules/settings/domain/app-settings";
import {
  keyManageableProviderIds,
  providerDescriptors,
} from "@/modules/settings/domain/provider-registry";
import {
  getProviderApiKeyService,
  getSettingsService,
} from "@/modules/settings/server/service-singleton";

export const dynamic = "force-dynamic";

type EnvironmentFallbackStatus = {
  configured: boolean;
  name: string;
  providerId: string;
};

function environmentFallbacks(): EnvironmentFallbackStatus[] {
  const alphaVantageFallbackName = "ALPHA_VANTAGE_API_KEY";

  return [
    {
      providerId: providerDescriptors.alpha_vantage.id,
      name: alphaVantageFallbackName,
      configured: Boolean(process.env[alphaVantageFallbackName]?.trim()),
    },
  ];
}

function formatProviderId(providerId: DefaultProviderId): string {
  return providerDescriptors[providerId].label;
}

function formatMissingDataBehavior(behavior: string): string {
  return behavior.replaceAll("_", " ");
}

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const providers = Object.values(providerDescriptors);
  const selectableProviders = providers.filter((provider) =>
    selectableDefaultProviderIds.includes(provider.id as DefaultProviderId),
  );
  const manageableProviders = providers.filter((provider) =>
    keyManageableProviderIds.includes(
      provider.id as (typeof keyManageableProviderIds)[number],
    ),
  );
  const settingsResult = await getSettingsService().getSettings();
  const providerKeys = await getProviderApiKeyService().listProviderKeys();
  const settings = settingsResult.ok
    ? settingsResult.value
    : defaultAppSettings;

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:text-cyan-200"
            href="/"
          >
            Back to dashboard
          </Link>
        }
        description="Configure the real-data default path, missing-data behavior, sample data visibility, and saved provider key readiness."
        eyebrow="Admin settings"
        title="Provider settings"
      />

      {!settingsResult.ok ? (
        <section className="rounded-3xl border border-rose-400/40 bg-rose-400/10 p-5 text-sm text-rose-100">
          {settingsResult.formErrors.map((formError) => (
            <p key={formError}>{formError}</p>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="Normal backtest and fetch provider"
          label="Default provider"
          value={formatProviderId(settings.defaultProvider)}
        />
        <StatCard
          detail="Missing ticker/date rows"
          label="Missing data"
          value={formatMissingDataBehavior(settings.missingDataBehavior)}
        />
        <StatCard
          detail="Synthetic source visibility"
          label="Sample data"
          value={settings.showSampleData ? "Visible" : "Hidden"}
        />
        <StatCard
          detail={`${selectableProviders.length} selectable default / ${manageableProviders.length} key-manageable`}
          label="Provider controls"
          value={providerKeys.length.toString()}
        />
      </section>

      <ProviderStatusGrid
        environmentFallbacks={environmentFallbacks()}
        providerKeys={providerKeys}
        providers={providers}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SettingsForm currentSettings={settings} providers={providers} />
        <ProviderKeyForm providerKeys={providerKeys} providers={providers} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Saved provider keys
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This table shows safe metadata only: provider, enabled state, masked
            suffixes, validation status, and timestamps.
          </p>
        </div>
        <ProviderKeyTable providerKeys={providerKeys} />
      </section>
    </div>
  );
}
