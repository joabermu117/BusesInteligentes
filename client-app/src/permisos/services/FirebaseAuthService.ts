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
  getSocialMetadata(userCredential: UserCredential): {
    photoUrl: string | null;
    githubUsername: string | null;
  } {
    const additionalUserInfo = getAdditionalUserInfo(userCredential);
    const username = additionalUserInfo?.username;

    return {
      photoUrl: userCredential.user.photoURL,
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
