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

// Decodifica base64 a UTF-8 (atob es Latin-1, rompe acentos y ñ)
const base64ToUtf8 = (b64: string): string => {
  const binaryStr = atob(b64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    return JSON.parse(base64ToUtf8(padded));
  } catch {
    return null;
  }
};

// Lightweight JWT payload decode used only for exp validation.
const getTokenPayload = (token: string): { exp?: number } | null => {
  return decodeJwtPayload(token) as { exp?: number } | null;
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

// Checks if error.response?.data indicates a genuine auth failure vs a permission denial.
// - SecurityGuard (NestJS) returns 401 with "Permisos insuficientes" when token is valid
//   but the user's role lacks the required permission.
// - A real auth failure (invalid/expired token) returns a different message.
const isRealAuthFailure = (error: unknown): boolean => {
  if (!axios.isAxiosError(error) || !error.response) return true;

  const message =
    error.response.data?.message ??
    (typeof error.response.data === "string" ? error.response.data : "");

  // SecurityGuard (NestJS) throws UnauthorizedException("Permisos insuficientes")
  // or UnauthorizedException("Error al validar permisos") — these mean the token
  // was actually valid but the ACL check rejected the URL+method.
  if (
    typeof message === "string" &&
    (message.includes("Permisos insuficientes") ||
      message.includes("Error al validar permisos") ||
      message.includes("PERMISSION_DENIED") ||
      message.includes("No tienes permiso"))
  ) {
    return false;
  }

  return true;
};

// Handles unauthorized responses while preserving expected behavior on public auth endpoints.
// Only logs out on *real* auth failures (invalid/expired token), not on permission denials.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (isPublicSecurityEndpoint(error.config?.url)) {
        return Promise.reject(error);
      }

      // Token was valid but user lacks permission — don't log them out
      if (!isRealAuthFailure(error)) {
        console.warn(
          "Permiso denegado para",
          error.config?.url,
          "— la sesión sigue activa",
        );
        return Promise.reject(error);
      }

      // Real auth failure — clear session
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

/** Lee el email del usuario desde el JWT almacenado */
export const getUserEmailFromToken = (): string | null => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;
    return (decodeJwtPayload(token)?.email as string) ?? null;
  } catch {
    return null;
  }
};

/** Hook para obtener el email del usuario desde el JWT */
export const useUserEmail = (): string | null => {
  return getUserEmailFromToken();
};

/** Lee el nombre del usuario desde el JWT almacenado */
export const getUserNameFromToken = (): string | null => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;
    return (decodeJwtPayload(token)?.name as string) ?? null;
  } catch {
    return null;
  }
};

/** Lee el userId del usuario desde el JWT almacenado */
export const getAuthUserId = (): string | null => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    return (payload?.id ?? payload?.userId ?? null) as string | null;
  } catch {
    return null;
  }
};

export default httpClient;
