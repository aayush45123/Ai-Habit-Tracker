import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
};

// Initialize Firebase safely
let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

export { app, auth, googleProvider };

/**
 * Sign in or Sign up with Google popup
 * Returns the Firebase ID Token to send to the backend
 */
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error(
      "Firebase is not configured. Please add VITE_FIREBASE_* variables in client/.env"
    );
  }
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    user: result.user,
    idToken,
  };
};

/**
 * Set up reCAPTCHA verifier for Phone Auth
 * @param {string} containerId - DOM ID where reCAPTCHA will render
 * @param {Function} [onSuccess] - Optional callback
 */
export const initRecaptchaVerifier = (containerId, onSuccess) => {
  if (!auth) {
    throw new Error("Firebase is not initialized");
  }

  // Clear existing verifier if window has one
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      // ignore
    }
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      if (onSuccess) onSuccess();
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired. Resetting...");
    },
  });

  return window.recaptchaVerifier;
};

/**
 * Send Phone OTP via Firebase
 * @param {string} fullPhoneNumber - Phone number in E.164 format (+919876543210)
 * @param {RecaptchaVerifier} appVerifier
 */
export const sendPhoneOtp = async (fullPhoneNumber, appVerifier) => {
  if (!auth) {
    throw new Error("Firebase is not initialized");
  }
  return await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
};
