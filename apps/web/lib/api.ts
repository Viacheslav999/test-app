// 🔴 API всегда через Next-прокси (/api/*)
export const API_URL = "";

// 🔴 Socket.IO ДОЛЖЕН быть http/https, НЕ ws/wss
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // 🔥 автопрефикс /api
  const finalPath = path.startsWith("/api/")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(`${API_URL}${finalPath}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let detail = "Request failed";
    try {
      const j = await res.json();
      detail = (j as any).detail || JSON.stringify(j);
    } catch {}
    throw new Error(detail);
  }

  return (await res.json()) as T;
}

export function getGuestToken(key: string): string {
  if (typeof window === "undefined") return "";
  const k = `guest_token__${key}`;
  let v = localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(k, v);
  }
  return v;
}
