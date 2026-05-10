import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getRequestOrigin, isLocalBaseUrl, resolvePublicBaseUrl } from "./base-url";

function readLiveUrlFromOutput(): string {
  try {
    const liveUrlFile = join(process.cwd(), "output", "live-url.txt");
    if (!existsSync(liveUrlFile)) {
      return "";
    }

    return readFileSync(liveUrlFile, "utf8").split(/\r?\n/)[0]?.trim() || "";
  } catch {
    return "";
  }
}

export function resolveServerPublicBaseUrl(headersMap?: Headers): string {
  const configured =
    process.env.WHATSFLOW_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  const requestOrigin = headersMap ? getRequestOrigin(headersMap) : "";
  const liveUrl = readLiveUrlFromOutput();

  const resolved = resolvePublicBaseUrl(configured, requestOrigin);
  if (resolved && resolved !== "https://your-domain.com") {
    return resolved;
  }

  return liveUrl && !isLocalBaseUrl(liveUrl) ? liveUrl : resolved;
}
