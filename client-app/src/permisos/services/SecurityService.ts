import { API_CONFIG } from "../../config/apiConfig";
import httpClient, {
  setAuthRoles,
  setAuthToken,
} from "../../config/httpClient";

// Clave para persistir los roles del usuario en localStorage
export const AUTH_ROLES_STORAGE_KEY = "auth_roles";

interface TokenResponse {
  token: string;
  roles?: string[];
}

// When 2FA is enabled, login returns challenge data to redirect to OTP page.
// When 2FA is disabled via SECURITY_2FA_ENABLED=false, login returns the JWT directly.
type LoginResponse =
  | TokenResponse
  | { challengeId: string; maskedEmail: string; expiresInSeconds: number; resendCooldownSeconds: number };

export function isChallengeResponse(
  response: LoginResponse,
): response is {
  challengeId: string;
  maskedEmail: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
} {
  return "challengeId" in response;
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
  // Step 1 local login: returns challenge metadata for OTP screen,
  // or direct JWT + roles when 2FA is disabled.
  async loginWithEmailPassword(
    email: string,
    password: string,
    recaptchaToken: string,
  ): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(
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
  ): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(
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
  ): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(
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
    const response = await httpClient.post<TokenResponse>(
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
    const response = await httpClient.post<TokenResponse>(
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
  async resendOtpCode(challengeId: string): Promise<{
    challengeId: string;
    maskedEmail: string;
    expiresInSeconds: number;
    resendCooldownSeconds: number;
  }> {
    const response = await httpClient.post<{
      challengeId: string;
      maskedEmail: string;
      expiresInSeconds: number;
      resendCooldownSeconds: number;
    }>(`${API_CONFIG.securityBaseUrl}/2fa/resend`, { challengeId });

    return response.data;
  }

  // Explicitly cancels current OTP challenge.
  async cancelOtpChallenge(challengeId: string): Promise<void> {
    await httpClient.post(`${API_CONFIG.securityBaseUrl}/2fa/cancel`, {
      challengeId,
    });
  }

  // Persist JWT + roles received directly (without 2FA flow).
  persistTokenResponse(response: TokenResponse): void {
    if (response.token) {
      setAuthToken(response.token);
      setAuthRoles(response.roles ?? null);
    }
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
  }): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(
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
