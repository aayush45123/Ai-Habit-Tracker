import { useState } from "react";
import { Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { signInWithGoogle, isFirebaseConfigured } from "../../utils/firebase";
import PhoneAuthModal from "./PhoneAuthModal";
import styles from "./SocialAuthButtons.module.css";

export default function SocialAuthButtons({ mode = "login", onError }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleClick = async () => {
    if (onError) onError("");

    if (!isFirebaseConfigured()) {
      if (onError) {
        onError(
          "Firebase is not configured yet. Please configure VITE_FIREBASE_* keys in client/.env"
        );
      }
      return;
    }

    setGoogleLoading(true);
    try {
      const { idToken } = await signInWithGoogle();

      // Post to backend auth endpoint
      const res = await api.post("/auth/google", { idToken });

      if (res.status === 200 || res.status === 201) {
        // Direct login — NO email verification requested!
        login(res.data.token, res.data.sessionId);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Google Auth error:", err);
      let errorMsg = "Google Sign-In failed. Please try again.";
      if (err.code === "auth/popup-closed-by-user") {
        errorMsg = "Google sign-in popup was closed before completing.";
      } else if (err.code === "auth/cancelled-popup-request") {
        errorMsg = "Popup request cancelled.";
      } else if (err.code === "auth/configuration-not-found") {
        errorMsg = "Google Sign-In is not enabled in Firebase Console. Please enable Google under Authentication > Sign-in method.";
      } else if (err.code === "auth/unauthorized-domain") {
        errorMsg = "This domain is not authorized. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMsg = "Google sign-in is disabled in your Firebase project. Please enable it in the Firebase Console.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      if (onError) onError(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={googleLoading}
          className={styles.socialBtn}
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>
            {googleLoading
              ? "Signing in with Google..."
              : mode === "signup"
              ? "Sign up with Google"
              : "Sign in with Google"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsPhoneModalOpen(true)}
          className={styles.socialBtn}
        >
          <Phone size={18} className={styles.phoneIcon} />
          <span>
            {mode === "signup"
              ? "Sign up with Phone"
              : "Sign in with Phone"}
          </span>
        </button>

        <div className={styles.divider}>
          <span>Or with Email</span>
        </div>
      </div>

      <PhoneAuthModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        mode={mode}
      />
    </>
  );
}
