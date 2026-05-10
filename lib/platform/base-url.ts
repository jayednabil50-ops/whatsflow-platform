const LOCAL_URL_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

function trimBaseUrl(value?: string | null) {
  return (value || "").trim().replace(/\/+$/, "");
}

export function isLocalBaseUrl(value?: string | null) {
  const url = trimBaseUrl(value);
  return Boolean(url) && LOCAL_URL_PATTERN.test(url);
}

export function resolvePublicBaseUrl(configuredBaseUrl?: string | null, activeOrigin?: string | null) {
  const configured = trimBaseUrl(configuredBaseUrl);
  const active = trimBaseUrl(activeOrigin);

  if (active && !isLocalBaseUrl(active)) {
    return active;
  }

  if (configured && !isLocalBaseUrl(configured)) {
    return configured;
  }

  return active || configured || "https://your-domain.com";
}

export function getRequestOrigin(headersMap: Headers) {
  const forwardedProto = headersMap.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = headersMap.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = headersMap.get("host")?.split(",")[0]?.trim();

  if (!forwardedHost && !host) {
    return "";
  }

  return `${forwardedProto || "https"}://${forwardedHost || host}`;
}
