import { API_CONFIG } from "../../config/apiConfig";
import httpClient, { setAuthToken } from "../../config/httpClient";

interface LoginResponse {
  token: string;
}

interface RegisterPayload {
  name?: string;
  email: string;
  password: string;
}

class SecurityServiceClass {
  async loginWithEmailPassword(email: string, password: string): Promise<void> {
    const response = await httpClient.post<LoginResponse>(
      `${API_CONFIG.securityBaseUrl}/login`,
      { email, password },
    );
    const token = response.data?.token;
    if (!token) throw new Error("No se recibio token de autenticacion");
    setAuthToken(token);
  }

  async exchangeFirebaseToken(idToken: string): Promise<void> {
    const response = await httpClient.post<LoginResponse>(
      `${API_CONFIG.securityBaseUrl}/firebase-login`,
      { idToken },
    );
    const token = response.data?.token;
    if (!token) throw new Error("No se recibio token de autenticacion");
    setAuthToken(token);
  }

  async exchangeGithubToken(idToken: string): Promise<void> {
    const response = await httpClient.post<LoginResponse>(
      `${API_CONFIG.securityBaseUrl}/github-login`,
      { idToken },
    );
    const token = response.data?.token;
    if (!token) throw new Error("No se recibio token de autenticacion");
    setAuthToken(token);
  }

  async registerWithEmailPassword(payload: RegisterPayload): Promise<void> {
    const response = await httpClient.post<LoginResponse>(
      `${API_CONFIG.securityBaseUrl}/register`,
      payload,
    );

    const token = response.data?.token;
    if (!token) {
      throw new Error("No se recibio token de autenticacion");
    }

    setAuthToken(token);
  }
}

export const SecurityService = new SecurityServiceClass();