import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupabaseLoggingFetch } from "./logging";

describe("createSupabaseLoggingFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs failed Supabase responses with parsed response details", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const baseFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "42703",
          message: 'column "target_direction" does not exist',
          details: null,
          hint: null,
        }),
        {
          status: 400,
          statusText: "Bad Request",
          headers: {
            "content-type": "application/json",
            "x-request-id": "req-123",
          },
        },
      ),
    );

    const loggingFetch = createSupabaseLoggingFetch(baseFetch);
    const response = await loggingFetch("https://project.supabase.co/rest/v1/habits?select=*", {
      method: "PATCH",
      body: JSON.stringify({ target_direction: "at_least" }),
      headers: {
        apikey: "secret",
        authorization: "Bearer secret-token",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "42703",
      message: 'column "target_direction" does not exist',
    });
    expect(errorSpy).toHaveBeenCalledWith(
      "[supabase] response failed",
      expect.objectContaining({
        method: "PATCH",
        path: "/rest/v1/habits?select=*",
        status: 400,
        statusText: "Bad Request",
        requestId: "req-123",
        requestBody: { target_direction: "at_least" },
        responseBody: expect.objectContaining({
          code: "42703",
          message: 'column "target_direction" does not exist',
        }),
        headers: {
          apikey: "<redacted>",
          authorization: "<redacted>",
        },
      }),
    );
  });
});
