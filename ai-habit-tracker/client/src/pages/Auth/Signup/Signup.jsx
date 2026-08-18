import { useState } from "react";
import api from "../../../utils/api";
import styles from "./Signup.module.css";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Mail,
  CheckCircle2,
  RefreshCw,
  Check,
  X,
} from "lucide-react";

// Password rules must match backend (auth.validator.js)
const passwordRules = [
  { id: "len",  label: "At least 8 characters",       test: (p) => p.length >= 8 },
  { id: "up",   label: "One uppercase letter (A–Z)",  test: (p) => /[A-Z]/.test(p) },
  { id: "low",  label: "One lowercase letter (a–z)",  test: (p) => /[a-z]/.test(p) },
  { id: "num",  label: "One number (0–9)",             test: (p) => /[0-9]/.test(p) },
  { id: "sym",  label: "One special character (!@#…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState({ type: "", text: "" });
  const [showPwRules, setShowPwRules] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const allRulesPassed = passwordRules.every((r) => r.test(form.password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side guard before hitting the server
    if (!allRulesPassed) {
      setError("Password does not meet the requirements listed below.");
      setShowPwRules(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/signup", form);
      if (res.status === 201 || res.status === 200) {
        setRegisteredEmail(form.email);
        setSignupSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResendLoading(true);
    setResendMsg({ type: "", text: "" });
    try {
      const res = await api.post("/auth/resend-verification", { email: registeredEmail });
      setResendMsg({ type: "success", text: res.data?.message || "Verification email resent! Check your inbox." });
    } catch (err) {
      setResendMsg({ type: "error", text: err.response?.data?.message || "Failed to resend. Try again." });
    } finally {
      setResendLoading(false);
    }
  };

  // ─── CHECK YOUR INBOX SCREEN ──────────────────────────────────────────────
  if (signupSuccess) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          {/* Animated envelope icon */}
          <div className={styles.successIconWrap}>
            <Mail size={36} strokeWidth={1.75} />
          </div>

          <h2 className={styles.authTitle} style={{ textAlign: "center" }}>Check Your Inbox</h2>
          <p className={styles.authSubtitle} style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            We sent a verification link to{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>{registeredEmail}</strong>.
            Click the link in the email to activate your account. The link expires in 24 hours.
          </p>

          {/* Steps */}
          <div className={styles.stepsBox}>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>1</span>
              <span className={styles.stepText}>Open your email inbox</span>
            </div>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepText}>Find the email from HabitAI</span>
            </div>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>3</span>
              <span className={styles.stepText}>Click "Verify Email Address"</span>
            </div>
            <div className={styles.stepRow}>
              <span className={styles.stepNum}>4</span>
              <span className={styles.stepText}>Login to your new account</span>
            </div>
          </div>

          {resendMsg.text && (
            <div className={`${styles.msgBox} ${resendMsg.type === "success" ? styles.msgSuccess : styles.msgError}`}>
              {resendMsg.type === "success"
                ? <CheckCircle2 size={15} />
                : <AlertCircle size={15} />}
              <span>{resendMsg.text}</span>
            </div>
          )}

          <Link to="/login" className={styles.submitBtn} style={{ textDecoration: "none", marginTop: "1.25rem", display: "flex" }}>
            <span className={styles.btnText}>Go to Login</span>
            <ArrowRight size={16} className={styles.btnIcon} />
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className={styles.resendBtn}
          >
            <RefreshCw size={14} />
            {resendLoading ? "Sending..." : "Resend Verification Email"}
          </button>

          <p className={styles.spamNote}>
            Didn't receive it? Check your spam/junk folder.
          </p>

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

  // ─── SIGNUP FORM ─────────────────────────────────────────────────────────
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
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
          {/* Name */}
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
              minLength={3}
            />
            <div className={styles.inputBorder}></div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              onFocus={() => setShowPwRules(true)}
              className={styles.input}
              required
            />
            <div className={styles.inputBorder}></div>

            {/* Password strength rules */}
            {showPwRules && (
              <div className={styles.pwRules}>
                {passwordRules.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <div
                      key={rule.id}
                      className={`${styles.pwRule} ${passed ? styles.pwRuleOk : styles.pwRuleFail}`}
                    >
                      {passed ? <Check size={12} /> : <X size={12} />}
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
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
            <Link to="/login" className={styles.authLink}>Login Here</Link>
          </p>
        </div>

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
