type ErrorRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === "object" && value !== null;
}

function isResponse(value: unknown): value is Response {
  return typeof Response !== "undefined" && value instanceof Response;
}

function serializeResponse(response: Response): ErrorRecord {
  return {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
  };
}

function getKnownErrorFields(record: ErrorRecord): ErrorRecord {
  return Object.fromEntries(
    [
      "name",
      "message",
      "details",
      "hint",
      "code",
      "status",
      "statusText",
      "error",
      "error_description",
    ]
      .map((key) => [key, record[key]])
      .filter(([, value]) => value !== undefined),
  );
}

function getJsonPayload(record: ErrorRecord): unknown {
  const toJSON = record.toJSON;
  if (typeof toJSON !== "function") return undefined;

  try {
    return toJSON.call(record);
  } catch {
    return undefined;
  }
}

function extractKnownMessage(record: ErrorRecord): string | undefined {
  const candidates = [
    record.message,
    record.error_description,
    typeof record.error === "string" ? record.error : undefined,
  ];

  return candidates.find((value): value is string => typeof value === "string" && value.length > 0);
}

export function formatErrorDetails(error: unknown): unknown {
  if (isResponse(error)) {
    return serializeResponse(error);
  }

  if (error instanceof Error) {
    const record = error as ErrorRecord;
    const jsonPayload = getJsonPayload(record);
    const jsonDetails = jsonPayload !== undefined ? formatErrorDetails(jsonPayload) : undefined;
    const context = "context" in record ? record.context : undefined;

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(jsonDetails && isRecord(jsonDetails) ? jsonDetails : {}),
      ...(context !== undefined
        ? {
            context: isResponse(context)
              ? serializeResponse(context)
              : formatErrorDetails(context),
          }
        : {}),
      ...(error.cause !== undefined ? { cause: formatErrorDetails(error.cause) } : {}),
    };
  }

  if (isRecord(error)) {
    const jsonPayload = getJsonPayload(error);
    if (jsonPayload !== undefined && jsonPayload !== error) {
      return formatErrorDetails(jsonPayload);
    }

    const knownFields = getKnownErrorFields(error);
    if (Object.keys(knownFields).length > 0) {
      return knownFields;
    }
  }

  return error;
}

export function normalizeError(error: unknown, fallbackMessage = "Unexpected error"): Error {
  if (error instanceof Error && error.message) {
    return error;
  }

  const details = formatErrorDetails(error);
  const message =
    (isRecord(details) ? extractKnownMessage(details) : undefined) ??
    (typeof details === "string" && details.length > 0 ? details : undefined) ??
    fallbackMessage;

  const normalized = new Error(message);
  const name =
    (isRecord(details) && typeof details.name === "string" ? details.name : undefined) ??
    (isRecord(error) && typeof error.name === "string" ? error.name : undefined);

  if (name) {
    normalized.name = name;
  }

  (normalized as Error & { cause?: unknown }).cause = error;

  return normalized;
}

export function logError(context: string, error: unknown, fallbackMessage?: string): Error {
  const normalized = normalizeError(error, fallbackMessage ?? context);
  console.error(context, formatErrorDetails(error));
  return normalized;
}
