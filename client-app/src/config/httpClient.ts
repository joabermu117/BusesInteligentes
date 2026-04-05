import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "auth_token";

const httpClient = axios.create();

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const setAuthToken = (token: string | null): void => {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export default httpClient;
