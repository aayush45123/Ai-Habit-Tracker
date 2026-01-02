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
  const [pokemonHover, setPokemonHover] = useState(false);

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
      {/* Floating Pokemon Characters */}
      <div className={styles.pokemonFloat}>
        <div className={`${styles.pokeball} ${styles.pokeball1}`}>⚪</div>
        <div className={`${styles.pokeball} ${styles.pokeball2}`}>⚪</div>
        <div className={`${styles.pokeball} ${styles.pokeball3}`}>⚪</div>
      </div>

      {/* Pikachu Character */}
      <div
        className={`${styles.pikachuChar} ${
          pokemonHover ? styles.pikachuHover : ""
        }`}
        onMouseEnter={() => setPokemonHover(true)}
        onMouseLeave={() => setPokemonHover(false)}
      >
        ⚡
      </div>

      <div className={styles.authCard}>
        {/* Pokemon Header */}
        <div className={styles.authHeader}>
          <div className={styles.pokemonIcon}>🎮</div>
          <h2 className={styles.authTitle}>Welcome Back, Trainer!</h2>
          <p className={styles.authSubtitle}>Login to continue your journey</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>⚠️</span>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>📧 Email</label>
            <input
              type="email"
              name="email"
              placeholder="ash@pokemon.com"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              required
            />
            <div className={styles.inputBorder}></div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>🔒 Password</label>
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
              Join the Adventure
            </Link>
          </p>
        </div>

        {/* Decorative Pokemon Elements */}
        <div className={styles.decorPokemon}>
          <span className={styles.miniPokemon}>🌟</span>
          <span className={styles.miniPokemon}>✨</span>
          <span className={styles.miniPokemon}>⭐</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
