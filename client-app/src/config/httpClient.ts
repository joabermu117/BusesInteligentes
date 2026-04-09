import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "auth_token";

const httpClient = axios.create();

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

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (token) {
    if (isAuthTokenExpired(token)) {
      setAuthToken(null);
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
      return Promise.reject(new axios.Cancel("Token expirado"));
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      setAuthToken(null);

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string | null): void => {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export default httpClient;
