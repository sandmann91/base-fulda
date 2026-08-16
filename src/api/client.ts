const CSRF_STORAGE_KEY = "base-fulda-admin-csrf";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export function getCsrfToken(): string | null {
  return sessionStorage.getItem(CSRF_STORAGE_KEY);
}

export function setCsrfToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  }
}

interface RequestOptions extends RequestInit {
  /** Hängt den CSRF-Header für geschützte Admin-Requests an. */
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth, headers, ...init } = options;
  const finalHeaders = new Headers(headers);

  if (auth) {
    const token = getCsrfToken();
    if (token) {
      finalHeaders.set("X-CSRF-Token", token);
    }
  }

  const response = await fetch(`/api/${path}`, {
    credentials: "include",
    headers: finalHeaders,
    ...init,
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const payload = (body ?? {}) as { ok?: boolean; error?: string };
  if (!response.ok || payload.ok === false) {
    throw new ApiError(payload.error ?? "request_failed", response.status);
  }

  return body as T;
}
