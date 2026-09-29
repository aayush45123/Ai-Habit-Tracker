import { useState, useEffect } from "react";
import { Phone, X, AlertCircle, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  initRecaptchaVerifier,
  sendPhoneOtp,
  isFirebaseConfigured,
} from "../../utils/firebase";
import styles from "./PhoneAuthModal.module.css";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91 (India)" },
  { code: "+1", label: "🇺🇸/🇨🇦 +1 (USA/Canada)" },
  { code: "+44", label: "🇬🇧 +44 (UK)" },
  { code: "+61", label: "🇦🇺 +61 (Australia)" },
  { code: "+971", label: "🇦🇪 +971 (UAE)" },
  { code: "+49", label: "🇩🇪 +49 (Germany)" },
  { code: "+65", label: "🇸🇬 +65 (Singapore)" },
];

export default function PhoneAuthModal({ isOpen, onClose, mode = "login" }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setStep("phone");
      setPhone("");
      setOtp("");
      setError("");
      setLoading(false);
      setConfirmationResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!isFirebaseConfigured()) {
      setError(
        "Firebase credentials are not configured. Please set VITE_FIREBASE_* in client/.env"
      );
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 7) {
      setError("Please enter a valid phone number");
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanPhone}`;
    setLoading(true);

    try {
      const appVerifier = initRecaptchaVerifier("recaptcha-phone-container");
      const confirmation = await sendPhoneOtp(fullPhoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep("otp");
      setResendTimer(60);
    } catch (err) {
      console.error("Phone OTP error:", err);
      let msg = "Failed to send SMS code. Please try again.";
      if (err.code === "auth/invalid-phone-number") {
        msg = "The provided phone number is invalid.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many requests. Please try again later.";
      } else if (err.code === "auth/captcha-check-failed") {
        msg = "reCAPTCHA verification failed. Please try again.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.trim().length < 6) {
      setError("Please enter the 6-digit OTP sent to your phone");
      return;
    }

    if (!confirmationResult) {
      setError("Session expired. Please request a new OTP.");
      setStep("phone");
      return;
    }

    setLoading(true);

    try {
      // 1. Confirm code with Firebase
      const result = await confirmationResult.confirm(otp.trim());
      const idToken = await result.user.getIdToken();

      // 2. Exchange Firebase ID token with backend API
      const res = await api.post("/auth/phone", {
        idToken,
        name: name.trim() || undefined,
      });

      if (res.status === 200 || res.status === 201) {
        // Direct login — NO email verification requested!
        login(res.data.token, res.data.sessionId);
        onClose();
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      let msg = "Invalid verification code. Please check and try again.";
      if (err.code === "auth/invalid-verification-code") {
        msg = "Invalid verification code. Please try again.";
      } else if (err.code === "auth/code-expired") {
        msg = "Verification code has expired. Please request a new one.";
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* reCAPTCHA anchor container */}
        <div id="recaptcha-phone-container"></div>

        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Phone size={24} />
          </div>
          <h3 className={styles.title}>
            {step === "phone"
              ? mode === "signup"
                ? "Sign Up with Phone"
                : "Sign In with Phone"
              : "Enter Verification Code"}
          </h3>
          <p className={styles.subtitle}>
            {step === "phone"
              ? "We'll send a 6-digit verification code to your phone number"
              : `Code sent to ${countryCode} ${phone}`}
          </p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className={styles.form}>
            {mode === "signup" && (
              <div className={styles.field}>
                <label className={styles.label}>Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Phone Number</label>
              <div className={styles.phoneInputGroup}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={styles.countryCodeSelect}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={styles.input}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !phone}
            >
              {loading ? (
                "Sending Code..."
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>6-Digit OTP</label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className={`${styles.input} ${styles.otpInput}`}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || otp.length < 6}
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>

            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className={styles.linkBtn}
                disabled={loading}
              >
                Change Phone
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                className={styles.linkBtn}
                disabled={loading || resendTimer > 0}
              >
                {resendTimer > 0 ? (
                  `Resend in ${resendTimer}s`
                ) : (
                  <>
                    <RotateCcw size={13} style={{ display: "inline", marginRight: 4 }} />
                    Resend Code
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
