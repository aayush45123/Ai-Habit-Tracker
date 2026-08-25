import { useState } from "react";
import api from "../../../utils/api";
import styles from "./Login.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requireVerification, setRequireVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRequireVerification(false);
    setResendSuccess("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", form);

      if (res.status === 200) {
        login(res.data.token);
        navigate("/dashboard");
      }
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.requireVerification) {
        setRequireVerification(true);
        setUnverifiedEmail(data.email || form.email);
        setError(data.message || "Please verify your email before logging in.");
      } else if (!err.response || err.response?.status === 503) {
        setError(
          "⚠️ Server is currently under scheduled maintenance until Sept 1st. Authentication is temporarily paused."
        );
      } else {
        setError(data?.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    setResendSuccess("");
    setError("");

    try {
      const res = await api.post("/auth/resend-verification", { email: unverifiedEmail });
      setResendSuccess(res.data?.message || "Verification email sent! Check your inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* AI Habit Tracker Header */}
        <div className={styles.authHeader}>
          <div className={styles.aiIcon}>AI</div>
          <h2 className={styles.authTitle}>Welcome Back</h2>
          <p className={styles.authSubtitle}>Access your habit tracker</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={16} className={styles.errorIcon} />
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {resendSuccess && (
          <div
            style={{
              padding: "0.75rem 1rem",
              border: "2px solid var(--color-border)",
              backgroundColor: "#e6ffed",
              color: "#22863a",
              fontWeight: 700,
              fontSize: "0.85rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{resendSuccess}</span>
          </div>
        )}

        {requireVerification && (
          <div
            style={{
              padding: "1rem",
              border: "2px solid var(--color-border)",
              backgroundColor: "var(--color-bg-primary)",
              marginBottom: "1.25rem",
              boxShadow: "4px 4px 0 0 var(--color-border)",
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
              Didn't receive the verification email?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              style={{
                width: "100%",
                padding: "0.6rem 1rem",
                border: "2px solid var(--color-border)",
                backgroundColor: "var(--color-accent-primary)",
                color: "var(--color-text-on-dark)",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {resendLoading ? "Sending Link..." : "Resend Verification Link"}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm}>
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
            />
            <div className={styles.inputBorder}></div>
          </div>

          <button
            type="submit"
            className={`${styles.submitBtn} ${isLoading ? styles.btnLoading : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span className={styles.btnText}>Login</span>
                <ArrowRight size={16} className={styles.btnIcon} />
              </>
            )}
          </button>
        </form>

        <div className={styles.authFooter}>
          <p className={styles.footerText}>
            Don't have an account?
            <Link to="/signup" className={styles.authLink}>
              Create Account
            </Link>
          </p>
        </div>

        {/* Decorative Elements */}
        <div className={styles.decorElements}>
          <span className={styles.miniElement}>•</span>
          <span className={styles.miniElement}>•</span>
          <span className={styles.miniElement}>•</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
