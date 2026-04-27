import { formatErrorDetails } from "@/lib/error-formatting";

type FetchLike = typeof fetch;

function readRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.method.toUpperCase();
  }
  return "GET";
}

function readRequestUrl(input: RequestInfo | URL): URL | undefined {
  try {
    if (input instanceof URL) return input;
    if (typeof input === "string") return new URL(input);
    if (typeof Request !== "undefined" && input instanceof Request) return new URL(input.url);
  } catch {
    return undefined;
  }

  return undefined;
}

function redactHeaders(headers: HeadersInit | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;

  const source = new Headers(headers);
  const entries = [...source.entries()];
  if (entries.length === 0) return undefined;

  return Object.fromEntries(
    entries.map(([key, value]) => [
      key,
      key === "authorization" || key === "apikey" ? "<redacted>" : value,
    ]),
  );
}

function parseJsonString(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function serializeRequestBody(body: BodyInit | null | undefined): unknown {
  if (!body || typeof body !== "string") return undefined;
  return parseJsonString(body);
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  return parseJsonString(text);
}

function pickResponseMetadata(response: Response): Record<string, unknown> {
  return {
    requestId: response.headers.get("x-request-id") ?? undefined,
    contentRange: response.headers.get("content-range") ?? undefined,
  };
}

export function createSupabaseLoggingFetch(baseFetch: FetchLike = fetch): FetchLike {
  return async (input, init) => {
    const method = readRequestMethod(input, init);
    const url = readRequestUrl(input);
    const path = url ? `${url.pathname}${url.search}` : String(input);
    const headers = redactHeaders(init?.headers);
    const requestBody = serializeRequestBody(init?.body);

    try {
      const response = await baseFetch(input, init);

      if (!response.ok) {
        console.error("[supabase] response failed", {
          method,
          path,
          status: response.status,
          statusText: response.statusText,
          ...pickResponseMetadata(response),
          headers,
          requestBody,
          responseBody: await readResponseBody(response.clone()),
        });
      }

      return response;
    } catch (error) {
      console.error("[supabase] network request failed", {
        method,
        path,
        headers,
        requestBody,
        error: formatErrorDetails(error),
      });
      throw error;
    }
  };
}
