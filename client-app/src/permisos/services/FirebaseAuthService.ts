import {
  OAuthProvider,
  getAdditionalUserInfo,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import {
  firebaseAuth,
  githubProvider,
  googleProvider,
  microsoftProvider,
} from "../../config/firebase";

class FirebaseAuthServiceClass {
  private normalizeEmail(value: string | null | undefined): string | null {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private isGithubPrivateEmail(email: string | null): boolean {
    if (!email) {
      return true;
    }

    return email.endsWith("@users.noreply.github.com");
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("No fue posible convertir la imagen"));
      };
      reader.onerror = () => reject(new Error("No fue posible leer la imagen"));
      reader.readAsDataURL(blob);
    });
  }

  private async getMicrosoftPhotoFromGraph(
    userCredential: UserCredential,
  ): Promise<string | null> {
    const credential = OAuthProvider.credentialFromResult(userCredential);
    const accessToken = credential?.accessToken;
    if (!accessToken) {
      return null;
    }

    try {
      const response = await fetch(
        "https://graph.microsoft.com/v1.0/me/photo/$value",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        return null;
      }

      return this.blobToDataUrl(blob);
    } catch {
      return null;
    }
  }

  private extractUrlCandidates(profile: unknown): string[] {
    if (!profile || typeof profile !== "object") {
      return [];
    }

    const typedProfile = profile as Record<string, unknown>;
    const possibleKeys = [
      "picture",
      "photo",
      "photoUrl",
      "photoURL",
      "avatar_url",
      "avatar",
      "profile_image_url",
      "profilePhoto",
      "image",
      "url",
    ];

    const collected: string[] = [];
    for (const key of possibleKeys) {
      const value = typedProfile[key];
      if (typeof value === "string" && value.trim().length > 0) {
        collected.push(value.trim());
      }

      if (value && typeof value === "object") {
        collected.push(...this.extractUrlCandidates(value));
      }
    }

    for (const value of Object.values(typedProfile)) {
      if (value && typeof value === "object") {
        collected.push(...this.extractUrlCandidates(value));
      }
    }

    return collected;
  }

  private getPhotoFromProviderProfile(profile: unknown): string | null {
    const candidates = this.extractUrlCandidates(profile);
    for (const candidate of candidates) {
      if (
        candidate.startsWith("http://") ||
        candidate.startsWith("https://") ||
        candidate.startsWith("data:image/")
      ) {
        return candidate;
      }
    }

    return null;
  }

  getSocialMetadata(userCredential: UserCredential): {
    photoUrl: string | null;
    githubUsername: string | null;
  } {
    const additionalUserInfo = getAdditionalUserInfo(userCredential);
    const username = additionalUserInfo?.username;
    const fallbackPhoto = this.getPhotoFromProviderProfile(
      additionalUserInfo?.profile,
    );

    return {
      photoUrl: userCredential.user.photoURL ?? fallbackPhoto,
      githubUsername: typeof username === "string" ? username : null,
    };
  }

  getGithubEmail(userCredential: UserCredential): string | null {
    const githubProviderData = userCredential.user.providerData.find(
      (provider) => provider.providerId === "github.com",
    );

    const providerEmail = this.normalizeEmail(githubProviderData?.email);
    const userEmail = this.normalizeEmail(userCredential.user.email);

    if (providerEmail && !this.isGithubPrivateEmail(providerEmail)) {
      return providerEmail;
    }

    if (userEmail && !this.isGithubPrivateEmail(userEmail)) {
      return userEmail;
    }

    return null;
  }

  requiresGithubAlternativeEmail(userCredential: UserCredential): boolean {
    return this.getGithubEmail(userCredential) === null;
  }

  async getMicrosoftSocialMetadata(userCredential: UserCredential): Promise<{
    photoUrl: string | null;
    githubUsername: string | null;
  }> {
    const baseMetadata = this.getSocialMetadata(userCredential);
    if (baseMetadata.photoUrl) {
      return baseMetadata;
    }

    const graphPhoto = await this.getMicrosoftPhotoFromGraph(userCredential);
    return {
      ...baseMetadata,
      photoUrl: graphPhoto,
    };
  }

  async signInWithEmailPassword(
    email: string,
    password: string,
  ): Promise<UserCredential> {
    return signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  async signInWithGoogle(): Promise<UserCredential> {
    return signInWithPopup(firebaseAuth, googleProvider);
  }

  async signInWithGithub(): Promise<UserCredential> {
    return signInWithPopup(firebaseAuth, githubProvider);
  }

  async signInWithMicrosoft(): Promise<UserCredential> {
    return signInWithPopup(firebaseAuth, microsoftProvider);
  }

  async getIdToken(userCredential: UserCredential): Promise<string> {
    return userCredential.user.getIdToken();
  }
}

export const FirebaseAuthService = new FirebaseAuthServiceClass();
