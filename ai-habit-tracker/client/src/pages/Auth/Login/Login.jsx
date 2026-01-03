import { useState } from "react";
import api from "../../../utils/api";
import styles from "./Login.module.css";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", form);

      if (res.status === 200) {
        localStorage.setItem("token", res.data.token);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* AI Habit Tracker Header */}
        <div className={styles.authHeader}>
          <div className={styles.aiIcon}>🤖</div>
          <h2 className={styles.authTitle}>Welcome Back</h2>
          <p className={styles.authSubtitle}>Access your habit tracker</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>!</span>
            <p className={styles.errorText}>{error}</p>
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
            className={`${styles.submitBtn} ${
              isLoading ? styles.btnLoading : ""
            }`}
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
                <span className={styles.btnIcon}>➜</span>
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
