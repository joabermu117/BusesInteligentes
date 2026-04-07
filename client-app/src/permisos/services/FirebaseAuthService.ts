import {
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import {
  firebaseAuth,
  googleProvider,
  microsoftProvider,
} from "../../config/firebase";

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

  async signInWithMicrosoft(): Promise<UserCredential> {
    return signInWithPopup(firebaseAuth, microsoftProvider);
  }

  async getIdToken(userCredential: UserCredential): Promise<string> {
    return userCredential.user.getIdToken();
  }
}

export const FirebaseAuthService = new FirebaseAuthServiceClass();
