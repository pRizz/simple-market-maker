"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  missingDataBehaviors,
  selectableDefaultProviderIds,
  type AppSettings,
  type DefaultProviderId,
  type MissingDataBehavior,
} from "@/modules/settings/domain/app-settings";
import type { ProviderDescriptor } from "@/modules/settings/domain/provider-registry";

type SettingsFormProps = {
  currentSettings: AppSettings;
  providers: ProviderDescriptor[];
};

type SettingsSubmissionState = {
  fieldErrors: Partial<Record<keyof AppSettings, string>>;
  formErrors: string[];
  status: "idle" | "submitting" | "saved";
};

type SettingsApiResponse = {
  fieldErrors?: Partial<Record<keyof AppSettings, string>>;
  formErrors?: string[];
  message?: string;
  ok?: boolean;
  settings?: AppSettings;
};

const missingDataBehaviorLabels: Record<MissingDataBehavior, string> = {
  confirm_before_fetch: "Confirm before fetch",
  silent_fetch: "Silent fetch",
};

const missingDataBehaviorDescriptions: Record<MissingDataBehavior, string> = {
  confirm_before_fetch: "Ask before creating missing market-data rows.",
  silent_fetch: "Create missing data without another prompt, with progress shown.",
};

function inputClassName(hasError: boolean): string {
  return [
    "w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition",
    hasError
      ? "border-rose-400/60 focus:border-rose-300"
      : "border-white/10 focus:border-cyan-400/60",
  ].join(" ");
}

async function updateSettings(
  body: AppSettings,
): Promise<{
  fieldErrors: Partial<Record<keyof AppSettings, string>>;
  formErrors: string[];
  ok: boolean;
}> {
  try {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        defaultProvider: body.defaultProvider,
        missingDataBehavior: body.missingDataBehavior,
        showSampleData: body.showSampleData,
      }),
    });

    const responseBody = (await response.json()) as SettingsApiResponse;

    if (!response.ok || responseBody.ok === false) {
      return {
        ok: false,
        fieldErrors: responseBody.fieldErrors ?? {},
        formErrors: responseBody.formErrors ??
          [responseBody.message ?? "Settings could not be saved."],
      };
    }

    return {
      ok: true,
      fieldErrors: {},
      formErrors: [],
    };
  } catch {
    return {
      ok: false,
      fieldErrors: {},
      formErrors: ["Settings could not be saved."],
    };
  }
}

export function SettingsForm({
  currentSettings,
  providers,
}: SettingsFormProps): React.JSX.Element {
  const router = useRouter();
  const [formValues, setFormValues] = useState<AppSettings>(currentSettings);
  const [submissionState, setSubmissionState] =
    useState<SettingsSubmissionState>({
      fieldErrors: {},
      formErrors: [],
      status: "idle",
    });

  const selectableProviders = providers.filter(
    (provider) =>
      provider.isSelectableDefault &&
      selectableDefaultProviderIds.includes(provider.id as DefaultProviderId),
  );

  const updateField = <Key extends keyof AppSettings>(
    fieldName: Key,
    value: AppSettings[Key],
  ): void => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
    setSubmissionState((currentState) => ({
      ...currentState,
      fieldErrors: {
        ...currentState.fieldErrors,
        [fieldName]: "",
      },
      status: currentState.status === "saved" ? "idle" : currentState.status,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    setSubmissionState((currentState) => ({
      ...currentState,
      formErrors: [],
      status: "submitting",
    }));

    const result = await updateSettings(formValues);

    if (!result.ok) {
      setSubmissionState({
        fieldErrors: result.fieldErrors,
        formErrors: result.formErrors,
        status: "idle",
      });
      return;
    }

    setSubmissionState({
      fieldErrors: {},
      formErrors: [],
      status: "saved",
    });
    router.refresh();
  };

  const fieldErrors = submissionState.fieldErrors;

  return (
    <form
      className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">Default behavior</h2>
        <p className="text-sm leading-6 text-slate-400">
          Real market data stays the normal path. Demo data is available only
          when explicitly shown.
        </p>
      </div>

      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-200">Default provider</span>
        <select
          className={inputClassName(Boolean(fieldErrors.defaultProvider))}
          name="defaultProvider"
          onChange={(event) =>
            updateField(
              "defaultProvider",
              event.target.value as DefaultProviderId,
            )
          }
          value={formValues.defaultProvider}
        >
          {selectableProviders.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
            </option>
          ))}
        </select>
        {fieldErrors.defaultProvider ? (
          <p className="text-xs text-rose-300">{fieldErrors.defaultProvider}</p>
        ) : null}
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-200">
          Missing market data
        </legend>
        <div className="grid gap-3 md:grid-cols-2">
          {missingDataBehaviors.map((behavior) => (
            <label
              className={[
                "rounded-2xl border p-4 text-sm transition",
                formValues.missingDataBehavior === behavior
                  ? "border-cyan-300/70 bg-cyan-400/10 text-cyan-50"
                  : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/25",
              ].join(" ")}
              key={behavior}
            >
              <input
                checked={formValues.missingDataBehavior === behavior}
                className="sr-only"
                name="missingDataBehavior"
                onChange={() => updateField("missingDataBehavior", behavior)}
                type="radio"
                value={behavior}
              />
              <span className="block font-medium">
                {missingDataBehaviorLabels[behavior]}
              </span>
              <span className="mt-2 block text-xs leading-5 text-slate-400">
                {missingDataBehaviorDescriptions[behavior]}
              </span>
            </label>
          ))}
        </div>
        {fieldErrors.missingDataBehavior ? (
          <p className="text-xs text-rose-300">
            {fieldErrors.missingDataBehavior}
          </p>
        ) : null}
      </fieldset>

      <label className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm">
        <input
          checked={formValues.showSampleData}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400"
          name="showSampleData"
          onChange={(event) =>
            updateField("showSampleData", event.target.checked)
          }
          type="checkbox"
        />
        <span className="space-y-1">
          <span className="block font-medium text-slate-200">
            Show sample/demo data source
          </span>
          <span className="block text-xs leading-5 text-slate-400">
            Keeps synthetic data visible for demos and local development
            without making it the normal backtest path.
          </span>
        </span>
      </label>

      {fieldErrors.showSampleData ? (
        <p className="text-xs text-rose-300">{fieldErrors.showSampleData}</p>
      ) : null}

      {submissionState.formErrors.length > 0 ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {submissionState.formErrors.map((formError) => (
            <p key={formError}>{formError}</p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {submissionState.status === "saved" ? (
          <p className="text-sm text-cyan-200">Settings saved.</p>
        ) : (
          <p className="text-sm text-slate-500">
            Default provider is limited to Alpha Vantage in Phase 1.
          </p>
        )}
        <button
          className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submissionState.status === "submitting"}
          type="submit"
        >
          {submissionState.status === "submitting"
            ? "Saving..."
            : "Save settings"}
        </button>
      </div>
    </form>
  );
}
