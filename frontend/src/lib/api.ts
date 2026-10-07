// ─── API client — axios wrapper pointing to Express backend ──────────────────
import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // sends httpOnly refresh cookie automatically
  headers: { "Content-Type": "application/json" },
});

// Attach access token from memory on every request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401 (only for non-auth requests)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.includes("/auth/");

    if (error.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const { data } = await axios.post("/api/auth/refresh", {}, { withCredentials: true });
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        clearAccessToken();
      }
    }
    return Promise.reject(error);
  }
);

// ── In-memory access token store ──────────────────────────────────────────────
// Access token is NOT stored in localStorage (XSS-safe: lives in JS memory only)
// Refresh token is in httpOnly cookie (CSRF-safe)

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string) {
  _accessToken = token;
}

export function clearAccessToken() {
  _accessToken = null;
}
