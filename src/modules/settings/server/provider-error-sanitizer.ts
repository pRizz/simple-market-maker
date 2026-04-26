import "server-only";

export const providerValidationMessageCodes = [
  "provider_key_validated",
  "provider_rejected_key",
  "provider_rate_limited",
  "provider_unavailable",
  "malformed_provider_response",
  "missing_provider_key",
] as const;

export type ProviderValidationMessageCode =
  (typeof providerValidationMessageCodes)[number];

export type SanitizedProviderError = {
  code: ProviderValidationMessageCode;
  message: string;
};

const providerValidationMessages = {
  provider_key_validated: "Provider key validated successfully.",
  provider_rejected_key: "The provider rejected the saved key.",
  provider_rate_limited: "The provider rate-limited the validation request.",
  provider_unavailable: "The provider validation request could not be completed.",
  malformed_provider_response: "The provider returned an unexpected response.",
  missing_provider_key: "A usable saved provider key is not configured.",
} as const satisfies Record<ProviderValidationMessageCode, string>;

function messageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

function codeFromMessage(message: string): ProviderValidationMessageCode {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("rate") ||
    lowerMessage.includes("frequency") ||
    lowerMessage.includes("standard api call") ||
    lowerMessage.includes("premium")
  ) {
    return "provider_rate_limited";
  }

  if (
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("rejected") ||
    lowerMessage.includes("api key") ||
    lowerMessage.includes("apikey")
  ) {
    return "provider_rejected_key";
  }

  if (
    lowerMessage.includes("malformed") ||
    lowerMessage.includes("unexpected response") ||
    lowerMessage.includes("daily candles")
  ) {
    return "malformed_provider_response";
  }

  if (
    lowerMessage.includes("missing") ||
    lowerMessage.includes("not configured") ||
    lowerMessage.includes("required") ||
    lowerMessage.includes("disabled")
  ) {
    return "missing_provider_key";
  }

  return "provider_unavailable";
}

export function redactProviderErrorMessage(
  message: string,
  redactionValues: readonly string[] = [],
): string {
  return redactionValues
    .filter((value) => value.trim().length > 0)
    .reduce((redactedMessage, value) => {
      return redactedMessage.split(value).join("[redacted]");
    }, message)
    .replace(/apikey=([^&\s]+)/gi, "apikey=[redacted]")
    .replace(/https:\/\/www\.alphavantage\.co\/query[^\s"]*/gi, "[provider-url]")
    .replace(/responseBody\s*=\s*({.*}|\[.*\]|"[^"]*")/gi, "responseBody=[redacted]");
}

export function sanitizeProviderError(
  error: unknown,
  redactionValues: readonly string[] = [],
): SanitizedProviderError {
  const redactedMessage = redactProviderErrorMessage(
    messageFromError(error),
    redactionValues,
  );
  const code = codeFromMessage(redactedMessage);

  return {
    code,
    message: providerValidationMessages[code],
  };
}
