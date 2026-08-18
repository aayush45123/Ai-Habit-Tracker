import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import styles from "./VerifyEmail.module.css";
import { CheckCircle2, XCircle, Mail, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");
  const navigate = useNavigate();

  const [status, setStatus] = useState(token ? "verifying" : "idle"); // "verifying" | "success" | "error" | "idle"
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState(emailParam || "");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (token) {
      handleVerification(token);
    }
  }, [token]);

  const handleVerification = async (verifyToken) => {
    setStatus("verifying");
    setMessage("");

    try {
      const res = await api.post("/auth/verify-email", { token: verifyToken });
      setStatus("success");
      setMessage(res.data?.message || "Your email has been verified successfully!");
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.message ||
          "Verification link is invalid or has expired. Please request a new link below."
      );
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMessage({ type: "", text: "" });

    try {
      const res = await api.post("/auth/resend-verification", { email: resendEmail });
      setResendMessage({
        type: "success",
        text: res.data?.message || "Verification link sent! Please check your inbox.",
      });
    } catch (err) {
      setResendMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to resend verification email.",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* State 1: Verifying */}
        {status === "verifying" && (
          <div>
            <div className={`${styles.iconWrapper} ${styles.iconLoading}`}>
              <RefreshCw size={28} className={styles.spinIcon} />
            </div>
            <h2 className={styles.title}>Verifying Email</h2>
            <p className={styles.subtitle}>Please wait while we confirm your account details...</p>
            <div className={styles.spinner} />
          </div>
        )}

        {/* State 2: Success */}
        {status === "success" && (
          <div>
            <div className={`${styles.iconWrapper} ${styles.iconSuccess}`}>
              <CheckCircle2 size={32} />
            </div>
            <h2 className={styles.title}>Email Verified!</h2>
            <p className={styles.subtitle}>
              {message || "Your email address has been verified. Your HabitAI account is now active."}
            </p>

            <Link to="/login" className={styles.actionBtn}>
              <span>Proceed to Login</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {/* State 3: Error */}
        {status === "error" && (
          <div>
            <div className={`${styles.iconWrapper} ${styles.iconError}`}>
              <XCircle size={32} />
            </div>
            <h2 className={styles.title}>Verification Failed</h2>
            <p className={styles.subtitle}>{message}</p>

            <div className={styles.resendBox}>
              <h4 className={styles.resendTitle}>Request New Verification Link</h4>

              {resendMessage.text && (
                <div
                  className={`${styles.messageBox} ${
                    resendMessage.type === "success" ? styles.successMsg : styles.errorMsg
                  }`}
                >
                  {resendMessage.text}
                </div>
              )}

              <form onSubmit={handleResend}>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    className={styles.input}
                  />
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                    style={{ margin: 0, width: "auto" }}
                  >
                    {resendLoading ? "Sending..." : "Resend Link"}
                  </button>
                </div>
              </form>
            </div>

            <p className={styles.footerText}>
              Already verified?
              <Link to="/login" className={styles.link}>
                Sign In
              </Link>
            </p>
          </div>
        )}

        {/* State 4: Idle / Manual entry */}
        {status === "idle" && (
          <div>
            <div className={`${styles.iconWrapper} ${styles.iconLoading}`}>
              <Mail size={28} />
            </div>
            <h2 className={styles.title}>Verify Your Email</h2>
            <p className={styles.subtitle}>
              A verification link was sent to your email when you registered. Please click the link in the email to activate your account.
            </p>

            <div className={styles.resendBox}>
              <h4 className={styles.resendTitle}>Didn't receive the email?</h4>

              {resendMessage.text && (
                <div
                  className={`${styles.messageBox} ${
                    resendMessage.type === "success" ? styles.successMsg : styles.errorMsg
                  }`}
                >
                  {resendMessage.text}
                </div>
              )}

              <form onSubmit={handleResend}>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    placeholder="Enter your account email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    className={styles.input}
                  />
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className={styles.actionBtn}
                    style={{ margin: 0, width: "auto" }}
                  >
                    {resendLoading ? "Sending..." : "Send Link"}
                  </button>
                </div>
              </form>
            </div>

            <p className={styles.footerText}>
              Back to
              <Link to="/login" className={styles.link}>
                Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
