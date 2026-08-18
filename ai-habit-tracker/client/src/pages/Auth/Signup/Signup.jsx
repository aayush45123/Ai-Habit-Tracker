import { useState } from "react";
import api from "../../../utils/api";
import styles from "./Signup.module.css";
import { Link, useNavigate } from "react-router-dom";
import { Check, AlertCircle, ArrowRight, Mail, RefreshCw } from "lucide-react";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/signup", form);
      if (res.status === 201 || res.status === 200) {
        setRegisteredEmail(form.email);
        setSignupSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    setResendLoading(true);
    setResendMsg("");

    try {
      const res = await api.post("/auth/resend-verification", { email: registeredEmail });
      setResendMsg(res.data?.message || "Verification email resent! Check your inbox.");
    } catch (err) {
      setResendMsg(err.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* State A: Verification Email Sent */}
        {signupSuccess ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "3px solid var(--color-border)",
                backgroundColor: "var(--color-bg-primary)",
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
                boxShadow: "4px 4px 0 0 var(--color-border)",
              }}
            >
              <Mail size={28} />
            </div>

            <h2 className={styles.authTitle}>Verify Your Email</h2>
            <p className={styles.authSubtitle} style={{ marginTop: "0.5rem", lineHeight: "1.6" }}>
              We sent a verification link to{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>{registeredEmail}</strong>.
              <br />
              Please click the link in your email to activate your account.
            </p>

            {resendMsg && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  border: "2px solid var(--color-border)",
                  backgroundColor: "#e6ffed",
                  color: "#22863a",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  margin: "1rem 0",
                  textAlign: "left",
                }}
              >
                {resendMsg}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
              <Link
                to="/login"
                className={styles.submitBtn}
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <span>Go to Login</span>
                <ArrowRight size={16} />
              </Link>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                style={{
                  padding: "0.75rem",
                  border: "2px solid var(--color-border)",
                  backgroundColor: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  boxShadow: "3px 3px 0 0 var(--color-border)",
                }}
              >
                {resendLoading ? "Resending..." : "Resend Verification Email"}
              </button>
            </div>
          </div>
        ) : (
          /* State B: Signup Form */
          <>
            <div className={styles.authHeader}>
              <div className={styles.aiIcon}>AI</div>
              <h2 className={styles.authTitle}>Get Started</h2>
              <p className={styles.authSubtitle}>Create your habit tracker account</p>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={16} className={styles.errorIcon} />
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.authForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
                <div className={styles.inputBorder}></div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
                <div className={styles.inputBorder}></div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  minLength={6}
                />
                <div className={styles.inputBorder}></div>
                <span className={styles.inputHint}>Minimum 6 characters</span>
              </div>

              <button
                type="submit"
                className={`${styles.submitBtn} ${isLoading ? styles.btnLoading : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span className={styles.btnText}>Create Account</span>
                    <ArrowRight size={16} className={styles.btnIcon} />
                  </>
                )}
              </button>
            </form>

            <div className={styles.authFooter}>
              <p className={styles.footerText}>
                Already have an account?
                <Link to="/login" className={styles.authLink}>
                  Login Here
                </Link>
              </p>
            </div>
          </>
        )}

        {/* Decorative Elements */}
        <div className={styles.decorElements}>
          <span className={styles.miniElement}>•</span>
          <span className={styles.miniElement}>•</span>
          <span className={styles.miniElement}>•</span>
          <span className={styles.miniElement}>•</span>
        </div>
      </div>
    </div>
  );
}

export default Signup;
