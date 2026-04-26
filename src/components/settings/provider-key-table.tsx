"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { ProviderApiKeyMetadata } from "@/modules/settings/domain/provider-api-key";

type ProviderKeyTableProps = {
  providerKeys: ProviderApiKeyMetadata[];
};

function formatDate(maybeDate: Date | string | null): string {
  if (!maybeDate) {
    return "Not validated";
  }

  const date = new Date(maybeDate);

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusBadge(enabled: boolean): React.JSX.Element {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        enabled
          ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200"
          : "border-slate-500/40 bg-slate-800/70 text-slate-300",
      ].join(" ")}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

function validationBadge(
  status: ProviderApiKeyMetadata["validationStatus"],
): React.JSX.Element {
  const className =
    status === "valid"
      ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200"
      : status === "invalid"
        ? "border-rose-300/40 bg-rose-400/10 text-rose-200"
        : "border-amber-300/40 bg-amber-400/10 text-amber-200";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      ].join(" ")}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

const columns: DataTableColumn<ProviderApiKeyMetadata>[] = [
  {
    key: "provider",
    label: "Provider",
    render: (row) => (
      <div>
        <p className="font-medium text-slate-100">{row.providerLabel}</p>
        <p className="font-mono text-xs text-slate-500">{row.providerId}</p>
      </div>
    ),
  },
  {
    key: "enabled",
    label: "Enabled",
    render: (row) => statusBadge(row.enabled),
  },
  {
    key: "maskedSuffix",
    label: "Key suffix",
    render: (row) => (
      <span className="font-mono text-slate-200">{row.maskedSuffix}</span>
    ),
  },
  {
    key: "validation",
    label: "Validation",
    render: (row) => (
      <div className="space-y-2">
        {validationBadge(row.validationStatus)}
        {row.validationMessage ? (
          <p className="max-w-xs text-xs leading-5 text-slate-400">
            {row.validationMessage}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    key: "lastValidatedAt",
    label: "Last checked",
    render: (row) => (
      <span className="text-slate-400">{formatDate(row.lastValidatedAt)}</span>
    ),
  },
  {
    key: "createdAt",
    label: "Created",
    render: (row) => (
      <span className="text-slate-400">{formatDate(row.createdAt)}</span>
    ),
  },
  {
    key: "updatedAt",
    label: "Updated",
    render: (row) => (
      <span className="text-slate-400">{formatDate(row.updatedAt)}</span>
    ),
  },
];

export function ProviderKeyTable({
  providerKeys,
}: ProviderKeyTableProps): React.JSX.Element {
  return (
    <DataTable
      columns={columns}
      emptyMessage="No saved provider keys yet. Add Alpha Vantage credentials above to use saved-key-backed fetches."
      rows={providerKeys}
    />
  );
}
