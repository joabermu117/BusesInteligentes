import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "auth_token";

// Public auth routes must stay reachable without forcing JWT redirects.
const PUBLIC_AUTH_PATHS = new Set([
  "/login",
  "/2fa",
  "/password-recovery",
  "/reset-password",
  "/register",
]);

const isPublicAuthRoute = (pathName: string): boolean => {
  return PUBLIC_AUTH_PATHS.has(pathName);
};

const isPublicSecurityEndpoint = (url?: string): boolean => {
  if (!url) {
    return false;
  }

  return url.includes("/api/public/security/");
};

const httpClient = axios.create();

// Lightweight JWT payload decode used only for exp validation.
const getTokenPayload = (token: string): { exp?: number } | null => {
  try {
    const tokenParts = token.split(".");
    if (tokenParts.length < 2) {
      return null;
    }

    const payloadBase64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payloadBase64.padEnd(
      payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(paddedPayload));
  } catch {
    return null;
  }
};

export const isAuthTokenExpired = (token: string): boolean => {
  const payload = getTokenPayload(token);

  if (!payload?.exp) {
    return false;
  }

  const currentTimestampInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= currentTimestampInSeconds;
};

// Adds Authorization header except when token is expired.
// For public auth endpoints we do not force redirect to avoid breaking login/2FA flows.
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (token) {
    if (isAuthTokenExpired(token)) {
      setAuthToken(null);
      if (
        !isPublicAuthRoute(window.location.pathname) &&
        !isPublicSecurityEndpoint(config.url)
      ) {
        window.location.replace("/login");
      }

      return config;
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handles unauthorized responses while preserving expected behavior on public auth endpoints.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (isPublicSecurityEndpoint(error.config?.url)) {
        return Promise.reject(error);
      }

      setAuthToken(null);

      if (!isPublicAuthRoute(window.location.pathname)) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export const AUTH_ROLES_STORAGE_KEY = "auth_roles";

export const setAuthToken = (token: string | null): void => {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_ROLES_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const setAuthRoles = (roles: string[] | null): void => {
  if (!roles || roles.length === 0) {
    localStorage.removeItem(AUTH_ROLES_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_ROLES_STORAGE_KEY, JSON.stringify(roles));
};

export const getAuthRoles = (): string[] => {
  try {
    const raw = localStorage.getItem(AUTH_ROLES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
};

export default httpClient;
