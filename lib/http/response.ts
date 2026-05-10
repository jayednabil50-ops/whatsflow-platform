export async function readJsonResponse<T = Record<string, unknown>>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  if (!rawText) {
    return {} as T;
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      response.ok
        ? "The server returned an unexpected response."
        : `The server returned ${response.status} instead of JSON.`
    );
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error("The server returned invalid JSON.");
  }
}
