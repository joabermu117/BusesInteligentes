import {
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
  private getPhotoFromProviderProfile(profile: unknown): string | null {
    if (!profile || typeof profile !== "object") {
      return null;
    }

    const typedProfile = profile as Record<string, unknown>;
    const possibleKeys = [
      "picture",
      "photo",
      "photoUrl",
      "photoURL",
      "avatar_url",
      "avatar",
    ];

    for (const key of possibleKeys) {
      const value = typedProfile[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
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
