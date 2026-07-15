const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

const ACCESS_TOKEN_KEY = "auth_access_token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiFetchOptions extends RequestInit {
  auth?: boolean;
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;

  if (typeof obj.detail === "string") return obj.detail;

  const firstKey = Object.keys(obj)[0];
  if (firstKey) {
    const value = obj[firstKey];
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string") return value;
  }

  return fallback;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, { ...rest, headers: finalHeaders });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // If the server says the token is invalid or the user is inactive,
    // clear the local session so the ProtectedRoute redirects to /login.
    if (response.status === 401) {
      localStorage.removeItem("auth_access_token");
      localStorage.removeItem("auth_refresh_token");
      localStorage.removeItem("auth_user");
    }
    throw new ApiError(extractErrorMessage(data, "Error de conexión con el servidor"), response.status);
  }

  return data as T;
}
