"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ProviderId } from "@/modules/settings/domain/app-settings";
import type { ProviderApiKeyMetadata } from "@/modules/settings/domain/provider-api-key";
import {
  isKeyManageableProviderId,
  keyManageableProviderIds,
  type ProviderDescriptor,
} from "@/modules/settings/domain/provider-registry";

type ProviderKeyFormProps = {
  providerKeys: ProviderApiKeyMetadata[];
  providers: ProviderDescriptor[];
};

type ProviderKeySubmissionState = {
  activeAction: string | null;
  fieldErrors: Record<string, string>;
  formErrors: string[];
  status: "idle" | "submitting" | "saved";
};

type ProviderKeyApiResponse = {
  fieldErrors?: Record<string, string>;
  formErrors?: string[];
  message?: string;
  ok?: boolean;
  providerKey?: ProviderApiKeyMetadata;
};

const initialSubmissionState: ProviderKeySubmissionState = {
  activeAction: null,
  fieldErrors: {},
  formErrors: [],
  status: "idle",
};

function inputClassName(hasError: boolean): string {
  return [
    "w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition",
    hasError
      ? "border-rose-400/60 focus:border-rose-300"
      : "border-white/10 focus:border-cyan-400/60",
  ].join(" ");
}

async function parseProviderKeyResponse(
  response: Response,
): Promise<{
  fieldErrors: Record<string, string>;
  formErrors: string[];
  ok: boolean;
}> {
  const responseBody = (await response.json()) as ProviderKeyApiResponse;

  if (!response.ok || responseBody.ok === false) {
    return {
      ok: false,
      fieldErrors: responseBody.fieldErrors ?? {},
      formErrors: responseBody.formErrors ??
        [responseBody.message ?? "Provider key action failed."],
    };
  }

  return {
    ok: true,
    fieldErrors: {},
    formErrors: [],
  };
}

function providerKeyForProvider(
  providerKeys: ProviderApiKeyMetadata[],
  providerId: ProviderId,
): ProviderApiKeyMetadata | null {
  return (
    providerKeys.find((providerKey) => providerKey.providerId === providerId) ??
    null
  );
}

function ProviderReadOnlyStatus({
  provider,
}: {
  provider: ProviderDescriptor;
}): React.JSX.Element {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white">
            {provider.label}
          </h3>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
            {provider.implementationStatus}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-400">
          {provider.safeDescription}
        </p>
        <p className="text-xs text-slate-500">
          Key management is not available for this provider in Phase 1.
        </p>
      </div>
    </div>
  );
}

export function ProviderKeyForm({
  providerKeys,
  providers,
}: ProviderKeyFormProps): React.JSX.Element {
  const router = useRouter();
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [submissionState, setSubmissionState] =
    useState<ProviderKeySubmissionState>(initialSubmissionState);

  const setApiKeyInput = (providerId: ProviderId, value: string): void => {
    setApiKeyInputs((currentInputs) => ({
      ...currentInputs,
      [providerId]: value,
    }));
    setSubmissionState((currentState) => ({
      ...currentState,
      fieldErrors: {},
      formErrors: [],
      status: currentState.status === "saved" ? "idle" : currentState.status,
    }));
  };

  const performMutation = async (
    activeAction: string,
    mutation: () => Promise<Response>,
    afterSuccess?: () => void,
  ): Promise<void> => {
    setSubmissionState({
      activeAction,
      fieldErrors: {},
      formErrors: [],
      status: "submitting",
    });

    let result: Awaited<ReturnType<typeof parseProviderKeyResponse>>;

    try {
      result = await parseProviderKeyResponse(await mutation());
    } catch {
      setSubmissionState({
        activeAction: null,
        fieldErrors: {},
        formErrors: ["Provider key action failed."],
        status: "idle",
      });
      return;
    }

    if (!result.ok) {
      setSubmissionState({
        activeAction: null,
        fieldErrors: result.fieldErrors,
        formErrors: result.formErrors,
        status: "idle",
      });
      return;
    }

    afterSuccess?.();
    setSubmissionState({
      activeAction: null,
      fieldErrors: {},
      formErrors: [],
      status: "saved",
    });
    router.refresh();
  };

  const saveProviderKey = async (
    providerId: ProviderId,
    maybeExistingKey: ProviderApiKeyMetadata | null,
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const apiKey = apiKeyInputs[providerId] ?? "";
    const endpoint = maybeExistingKey
      ? `/api/settings/provider-keys/${providerId}`
      : "/api/settings/provider-keys";
    const method = maybeExistingKey ? "PUT" : "POST";

    await performMutation(`${providerId}:save`, () =>
      fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId,
          apiKey,
          enabled: true,
        }),
      }), () => {
      setApiKeyInputs((currentInputs) => ({
        ...currentInputs,
        [providerId]: "",
      }));
    });
  };

  const setProviderKeyEnabled = async (
    providerId: ProviderId,
    enabled: boolean,
  ): Promise<void> => {
    await performMutation(`${providerId}:enabled`, () =>
      fetch(`/api/settings/provider-keys/${providerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      }),
    );
  };

  const validateProviderKey = async (providerId: ProviderId): Promise<void> => {
    await performMutation(`${providerId}:validate`, () =>
      fetch(`/api/settings/provider-keys/${providerId}/validate`, {
        method: "POST",
      }),
    );
  };

  const deleteProviderKey = async (providerId: ProviderId): Promise<void> => {
    await performMutation(`${providerId}:delete`, () =>
      fetch(`/api/settings/provider-keys/${providerId}`, {
        method: "DELETE",
      }),
    );
  };

  const isBusy = submissionState.status === "submitting";

  return (
    <div className="space-y-4">
      {providers.map((provider) => {
        if (!isKeyManageableProviderId(provider.id)) {
          return <ProviderReadOnlyStatus key={provider.id} provider={provider} />;
        }

        const maybeExistingKey = providerKeyForProvider(
          providerKeys,
          provider.id,
        );
        const providerApiKeyInput = apiKeyInputs[provider.id] ?? "";
        const activeAction = submissionState.activeAction ?? "";
        const hasApiKeyError = Boolean(submissionState.fieldErrors.apiKey);

        return (
          <form
            className="space-y-5 rounded-3xl border border-white/10 bg-slate-900/70 p-5"
            key={provider.id}
            onSubmit={(event) => {
              void saveProviderKey(provider.id, maybeExistingKey, event);
            }}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-white">
                  {provider.label}
                </h3>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
                  {keyManageableProviderIds.includes(provider.id)
                    ? "Key managed"
                    : "Read only"}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-400">
                {provider.safeDescription}
              </p>
              {maybeExistingKey ? (
                <p className="text-xs text-slate-500">
                  Saved key suffix{" "}
                  <span className="font-mono text-slate-300">
                    {maybeExistingKey.maskedSuffix}
                  </span>
                  , validation {maybeExistingKey.validationStatus}.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  No saved key metadata is present.
                </p>
              )}
            </div>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-200">
                {maybeExistingKey ? "Replace API key" : "API key"}
              </span>
              <input
                autoComplete="off"
                className={inputClassName(hasApiKeyError)}
                name={`${provider.id}-api-key`}
                onChange={(event) =>
                  setApiKeyInput(provider.id, event.target.value)
                }
                placeholder={
                  maybeExistingKey
                    ? "Enter a new key to replace the saved key"
                    : "Enter provider API key"
                }
                type="password"
                value={providerApiKeyInput}
              />
              {submissionState.fieldErrors.apiKey ? (
                <p className="text-xs text-rose-300">
                  {submissionState.fieldErrors.apiKey}
                </p>
              ) : null}
            </label>

            {submissionState.formErrors.length > 0 ? (
              <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {submissionState.formErrors.map((formError) => (
                  <p key={formError}>{formError}</p>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy || providerApiKeyInput.trim().length === 0}
                type="submit"
              >
                {activeAction === `${provider.id}:save`
                  ? "Saving..."
                  : maybeExistingKey
                    ? "Replace key"
                    : "Save key"}
              </button>

              {maybeExistingKey ? (
                <>
                  <button
                    className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isBusy}
                    onClick={() => {
                      void setProviderKeyEnabled(
                        provider.id,
                        !maybeExistingKey.enabled,
                      );
                    }}
                    type="button"
                  >
                    {activeAction === `${provider.id}:enabled`
                      ? "Updating..."
                      : maybeExistingKey.enabled
                        ? "Disable"
                        : "Enable"}
                  </button>
                  <button
                    className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isBusy}
                    onClick={() => {
                      void validateProviderKey(provider.id);
                    }}
                    type="button"
                  >
                    {activeAction === `${provider.id}:validate`
                      ? "Validating..."
                      : "Validate"}
                  </button>
                  <button
                    className="rounded-full border border-rose-300/30 px-4 py-2.5 text-sm font-medium text-rose-200 transition hover:border-rose-200/60 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isBusy}
                    onClick={() => {
                      void deleteProviderKey(provider.id);
                    }}
                    type="button"
                  >
                    {activeAction === `${provider.id}:delete`
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </>
              ) : null}
            </div>
          </form>
        );
      })}
    </div>
  );
}
