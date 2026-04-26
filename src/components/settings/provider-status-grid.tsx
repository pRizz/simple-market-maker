"use client";

import { StatCard } from "@/components/ui/stat-card";
import type { ProviderApiKeyMetadata } from "@/modules/settings/domain/provider-api-key";
import type { ProviderDescriptor } from "@/modules/settings/domain/provider-registry";

type EnvironmentFallbackStatus = {
  configured: boolean;
  name: string;
  providerId: string;
};

type ProviderStatusGridProps = {
  environmentFallbacks: EnvironmentFallbackStatus[];
  providerKeys: ProviderApiKeyMetadata[];
  providers: ProviderDescriptor[];
};

function fallbackText(
  provider: ProviderDescriptor,
  environmentFallbacks: EnvironmentFallbackStatus[],
): string {
  const fallback = environmentFallbacks.find(
    (candidate) => candidate.providerId === provider.id,
  );

  if (!provider.maybeEnvironmentFallbackName) {
    return "No environment fallback.";
  }

  if (!fallback) {
    return `${provider.maybeEnvironmentFallbackName}: unconfigured`;
  }

  return `${fallback.name}: ${fallback.configured ? "configured" : "unconfigured"}`;
}

function readinessValue(
  provider: ProviderDescriptor,
  providerKeys: ProviderApiKeyMetadata[],
  environmentFallbacks: EnvironmentFallbackStatus[],
): string {
  if (provider.implementationStatus === "planned") {
    return "Planned";
  }

  if (provider.implementationStatus === "demo") {
    return "Demo gated";
  }

  const maybeProviderKey = providerKeys.find(
    (providerKey) => providerKey.providerId === provider.id,
  );

  if (maybeProviderKey?.enabled) {
    return `Saved key ${maybeProviderKey.maskedSuffix}`;
  }

  const maybeFallback = environmentFallbacks.find(
    (fallback) => fallback.providerId === provider.id,
  );

  if (maybeFallback?.configured) {
    return "Fallback configured";
  }

  return "Needs key";
}

function requirementText(provider: ProviderDescriptor): string {
  if (provider.keyRequirement === "required") {
    return "API key required";
  }

  if (provider.keyRequirement === "planned") {
    return "Key support planned";
  }

  return "No key required";
}

export function ProviderStatusGrid({
  environmentFallbacks,
  providerKeys,
  providers,
}: ProviderStatusGridProps): React.JSX.Element {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {providers.map((provider) => (
        <StatCard
          description={[
            requirementText(provider),
            provider.implementationStatus,
            `${provider.supportedIntervals.join(", ")} interval`,
            fallbackText(provider, environmentFallbacks),
          ].join(" / ")}
          key={provider.id}
          label={provider.label}
          value={readinessValue(provider, providerKeys, environmentFallbacks)}
        />
      ))}
    </section>
  );
}
