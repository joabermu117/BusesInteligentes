import { API_CONFIG } from "../../config/apiConfig";
import httpClient, { setAuthToken } from "../../config/httpClient";

interface LoginResponse {
  token: string;
}

interface LoginChallengeResponse {
  challengeId: string;
  maskedEmail: string;
  expiresInSeconds: number;
}

interface VerifyOtpPayload {
  challengeId: string;
  code: string;
}

interface GenericMessageResponse {
  message: string;
}

interface RegisterPayload {
  name?: string;
  email: string;
  password: string;
}

class SecurityServiceClass {
  async loginWithEmailPassword(
    email: string,
    password: string,
    recaptchaToken: string,
  ): Promise<LoginChallengeResponse> {
    const response = await httpClient.post<LoginChallengeResponse>(
      `${API_CONFIG.securityBaseUrl}/login`,
      { email, password, recaptchaToken },
    );
    return response.data;
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

  async verifyOtpCode(payload: VerifyOtpPayload): Promise<void> {
    const response = await httpClient.post<LoginResponse>(
      `${API_CONFIG.securityBaseUrl}/2fa/verify`,
      payload,
    );

    const token = response.data?.token;
    if (!token) {
      throw new Error("No se recibio token de autenticacion");
    }

    setAuthToken(token);
  }

  async resendOtpCode(challengeId: string): Promise<LoginChallengeResponse> {
    const response = await httpClient.post<LoginChallengeResponse>(
      `${API_CONFIG.securityBaseUrl}/2fa/resend`,
      { challengeId },
    );

    return response.data;
  }

  async cancelOtpChallenge(challengeId: string): Promise<void> {
    await httpClient.post(`${API_CONFIG.securityBaseUrl}/2fa/cancel`, {
      challengeId,
    });
  }

  async requestPasswordRecovery(
    email: string,
    recaptchaToken: string,
  ): Promise<GenericMessageResponse> {
    const response = await httpClient.post<GenericMessageResponse>(
      `${API_CONFIG.securityBaseUrl}/password-recovery/request`,
      { email, recaptchaToken },
    );

    return response.data;
  }
}

export const SecurityService = new SecurityServiceClass();