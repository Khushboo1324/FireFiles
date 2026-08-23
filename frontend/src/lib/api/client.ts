const DEVELOPMENT_API_URL = "http://localhost:8000";

function resolveApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return DEVELOPMENT_API_URL;
  }

  throw new Error("NEXT_PUBLIC_API_URL must be configured.");
}

// One normalized base URL keeps every API module consistent across environments.
export const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildApiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), { ...init, headers });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Unable to connect to the FireFiles API.", null);
  }

  if (!response.ok) {
    // Preserve the status without exposing FastAPI response details to the UI.
    throw new ApiError(
      `The FireFiles API request failed (HTTP ${response.status}).`,
      response.status,
    );
  }

  // A 204 response has no JSON body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      "The FireFiles API returned an invalid JSON response.",
      response.status,
    );
  }
}
