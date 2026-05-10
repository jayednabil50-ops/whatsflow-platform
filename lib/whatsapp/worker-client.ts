const defaultWorkerUrl = "http://127.0.0.1:3101";
const defaultWorkerSecret = "local-dev-worker-secret";

export class WhatsAppWorkerUnavailableError extends Error {
  constructor(message: string = "WhatsApp runtime is offline right now. Try again in a few seconds.") {
    super(message);
    this.name = "WhatsAppWorkerUnavailableError";
  }
}

type WorkerHttpError = Error & { status?: number; payload?: unknown };

function getWorkerUrl(): string {
  return (process.env.WHATSFLOW_WORKER_URL || defaultWorkerUrl).trim().replace(/\/+$/, "");
}

function getWorkerSecret(): string {
  return (process.env.WHATSFLOW_WORKER_SECRET || defaultWorkerSecret).trim();
}

async function parseWorkerJson(response: Response): Promise<any> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export async function callWhatsAppWorker<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? 20000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(init?.headers || {});
    headers.set("x-whatsflow-worker-secret", getWorkerSecret());

    if (init?.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(`${getWorkerUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal
    });
    const payload = await parseWorkerJson(response);

    if (!response.ok) {
      const message =
        typeof payload?.error === "string" && payload.error.trim().length > 0
          ? payload.error
          : `WhatsApp runtime request failed with status ${response.status}.`;
      const error = new Error(message) as Error & { status?: number; payload?: unknown };
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new WhatsAppWorkerUnavailableError(
        "WhatsApp runtime took too long to respond. Try again in a few seconds."
      );
    }

    if (error instanceof Error && "status" in error) {
      throw error;
    }

    throw new WhatsAppWorkerUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

export function isWhatsAppWorkerHttpError(error: unknown): error is WorkerHttpError {
  return error instanceof Error && typeof (error as WorkerHttpError).status === "number";
}
