import {
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { firebaseAuth, googleProvider, githubProvider } from "../../config/firebase";

class FirebaseAuthServiceClass {
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

  async getIdToken(userCredential: UserCredential): Promise<string> {
    return userCredential.user.getIdToken();
  }
}

export const FirebaseAuthService = new FirebaseAuthServiceClass();