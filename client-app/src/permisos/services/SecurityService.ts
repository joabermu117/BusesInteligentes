import { API_CONFIG } from "../../config/apiConfig";
import httpClient, {
  setAuthRoles,
  setAuthToken,
} from "../../config/httpClient";

interface LoginResponse {
  token: string;
  roles?: string[];
}

// Clave para persistir los roles del usuario en localStorage
export const AUTH_ROLES_STORAGE_KEY = "auth_roles";

interface LoginChallengeResponse {
  challengeId: string;
  maskedEmail: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
}

interface SocialLoginPayload {
  provider?: "google" | "github" | "microsoft";
  photoUrl?: string | null;
  githubUsername?: string | null;
  requiresAlternativeEmail?: boolean;
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

// Frontend gateway for auth, 2FA and password recovery endpoints.
class SecurityServiceClass {
  // Step 1 local login: returns challenge metadata for OTP screen.
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

  // Step 1 social login with Google/Microsoft token exchanged by backend.
  async exchangeFirebaseToken(
    idToken: string,
    recaptchaToken: string,
    socialPayload?: SocialLoginPayload,
  ): Promise<LoginChallengeResponse> {
    const response = await httpClient.post<LoginChallengeResponse>(
      `${API_CONFIG.securityBaseUrl}/firebase-login`,
      {
        idToken,
        recaptchaToken,
        provider: socialPayload?.provider,
        photoUrl: socialPayload?.photoUrl,
        githubUsername: socialPayload?.githubUsername,
      },
    );

    return response.data;
  }

  // Step 1 social login with GitHub token exchanged by backend.
  async exchangeGithubToken(
    idToken: string,
    recaptchaToken: string,
    socialPayload?: Omit<SocialLoginPayload, "provider">,
  ): Promise<LoginChallengeResponse> {
    const response = await httpClient.post<LoginChallengeResponse>(
      `${API_CONFIG.securityBaseUrl}/github-login`,
      {
        idToken,
        recaptchaToken,
        provider: "github",
        photoUrl: socialPayload?.photoUrl,
        githubUsername: socialPayload?.githubUsername,
        requiresAlternativeEmail: socialPayload?.requiresAlternativeEmail,
      },
    );

    return response.data;
  }

  // Register and persist returned JWT + roles.
  async registerWithEmailPassword(payload: RegisterPayload): Promise<void> {
    const response = await httpClient.post<LoginResponse>(
      `${API_CONFIG.securityBaseUrl}/register`,
      payload,
    );

    const { token, roles } = response.data;
    if (!token) {
      throw new Error("No se recibio token de autenticacion");
    }

    setAuthToken(token);
    setAuthRoles(roles ?? null);
  }

  // Step 2 login: validates OTP and persists final JWT + roles.
  async verifyOtpCode(payload: VerifyOtpPayload): Promise<void> {
    const response = await httpClient.post<LoginResponse>(
      `${API_CONFIG.securityBaseUrl}/2fa/verify`,
      payload,
    );

    const { token, roles } = response.data;
    if (!token) {
      throw new Error("No se recibio token de autenticacion");
    }

    setAuthToken(token);
    setAuthRoles(roles ?? null);
  }

  // Requests a new OTP code under backend resend cooldown policy.
  async resendOtpCode(challengeId: string): Promise<LoginChallengeResponse> {
    const response = await httpClient.post<LoginChallengeResponse>(
      `${API_CONFIG.securityBaseUrl}/2fa/resend`,
      { challengeId },
    );

    return response.data;
  }

  // Explicitly cancels current OTP challenge.
  async cancelOtpChallenge(challengeId: string): Promise<void> {
    await httpClient.post(`${API_CONFIG.securityBaseUrl}/2fa/cancel`, {
      challengeId,
    });
  }

  // Best-effort cancellation used during beforeunload events.
  cancelOtpChallengeWithBeacon(challengeId: string): void {
    if (!challengeId || typeof navigator === "undefined") {
      return;
    }

    const payload = new Blob([JSON.stringify({ challengeId })], {
      type: "application/json",
    });
    navigator.sendBeacon(`${API_CONFIG.securityBaseUrl}/2fa/cancel`, payload);
  }

  // Recovery step 1: request recovery link with anti-bot token.
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

  // Recovery step 2: confirm token and submit new password.
  async confirmPasswordRecovery(
    token: string,
    newPassword: string,
  ): Promise<GenericMessageResponse> {
    const response = await httpClient.post<GenericMessageResponse>(
      `${API_CONFIG.securityBaseUrl}/password-recovery/confirm`,
      { token, newPassword },
    );

    return response.data;
  }

  async completeGithubLoginWithEmail(payload: {
    idToken: string;
    email: string;
    name: string;
    photoUrl: string;
    githubUsername: string;
    recaptchaToken: string;
  }): Promise<LoginChallengeResponse> {
    const response = await httpClient.post<LoginChallengeResponse>(
      `${API_CONFIG.securityBaseUrl}/github-login/complete`,
      {
        idToken: payload.idToken,
        email: payload.email,
        name: payload.name,
        photoUrl: payload.photoUrl,
        githubUsername: payload.githubUsername,
        recaptchaToken: payload.recaptchaToken,
        alternateEmailFlow: true,
      },
    );
    return response.data;
  }
}

export const SecurityService = new SecurityServiceClass();
