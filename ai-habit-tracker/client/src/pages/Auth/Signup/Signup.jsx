import { useState } from "react";
import api from "../../../utils/api";
import styles from "./Signup.module.css";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/signup", form);
      if (res.status === 201) {
        setSuccessMessage("Account created! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* AI Habit Tracker Header */}
        <div className={styles.authHeader}>
          <div className={styles.aiIcon}>AI</div>
          <h2 className={styles.authTitle}>Get Started</h2>
          <p className={styles.authSubtitle}>
            Create your habit tracker account
          </p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>!</span>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className={styles.successBox}>
            <span className={styles.successIcon}>✓</span>
            <p className={styles.successText}>{successMessage}</p>
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
            className={`${styles.submitBtn} ${
              isLoading ? styles.btnLoading : ""
            }`}
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
                <span className={styles.btnIcon}>➜</span>
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
