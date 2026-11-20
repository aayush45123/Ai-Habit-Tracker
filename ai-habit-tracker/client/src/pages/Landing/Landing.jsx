import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import styles from "./Landing.module.css";

// 3D Scroll-Driven Components
import Hero3DScrollStage from "./components/Hero3DScrollStage";
import LiveCommunityTicker from "./components/LiveCommunityTicker";
import InteractiveHabitSimulator from "./components/InteractiveHabitSimulator";
import Feature3DScrollVault from "./components/Feature3DScrollVault";
import Steps3DScroll from "./components/Steps3DScroll";
import Testimonials3DScroll from "./components/Testimonials3DScroll";
import MagneticTunnelCTA from "./components/MagneticTunnelCTA";

export default function Landing() {
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={styles.landingPage}>
      {/* Subtle Structural Grid Background (No decorative cubes) */}
      <div className={styles.gridBackground} aria-hidden="true" />

      {/* Sticky Neo-Brutalist Glass Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIconWrap}>
              <Zap size={20} strokeWidth={2.75} />
            </div>
            <span>HabitAI</span>
          </Link>

          <div className={styles.navLinks}>
            <a
              href="#feature-vault"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("feature-vault");
              }}
              className={styles.navLink}
            >
              3D Feature Vault
            </a>
            <a
              href="#simulator"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("simulator");
              }}
              className={styles.navLink}
            >
              Interactive Demo
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("how-it-works");
              }}
              className={styles.navLink}
            >
              Architecture
            </a>
            <a
              href="#testimonials"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("testimonials");
              }}
              className={styles.navLink}
            >
              Proof
            </a>
          </div>

          <div className={styles.navButtons}>
            <Link to="/login" className={styles.loginBtn}>
              Log In
            </Link>
            <Link to="/signup" className={styles.signupBtn}>
              <span>Get Started</span>
              <ArrowRight size={15} strokeWidth={2.75} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── 1. Pinned 3D Hero Camera Zoom & Device Unfold ─── */}
      <Hero3DScrollStage />

      {/* ─── 2. Real-Time Community Ticker ─── */}
      <LiveCommunityTicker />

      {/* ─── 3. Pinned 3D Unfolding Feature Vault ─── */}
      <Feature3DScrollVault />

      {/* ─── 4. Interactive 3D Habit Chamber ─── */}
      <section id="simulator" className={styles.simulatorSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Tactile Playground</div>
          <h2 className={styles.sectionTitle}>Experience The Dopamine Loop</h2>
          <p className={styles.sectionSubtitle}>
            Witness how instant positive feedback and milestone XP triggers keep
            you motivated day after day.
          </p>
        </div>

        <InteractiveHabitSimulator />
      </section>

      {/* ─── 5. 3D Spatial Steps Architecture ─── */}
      <Steps3DScroll />

      {/* ─── 6. 3D Parallax Testimonials ─── */}
      <Testimonials3DScroll />

      {/* ─── 7. Magnetic 3D Tunnel Final CTA ─── */}
      <MagneticTunnelCTA />

      {/* ─── 8. Minimalist Structured Footer ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <div className={styles.logoIconWrap} style={{ width: 30, height: 30 }}>
                <Zap size={16} strokeWidth={3} />
              </div>
              <span>HabitAI</span>
            </div>
            <p className={styles.footerTagline}>
              Intelligent habit architecture for high performers
            </p>
          </div>

          <div className={styles.footerLinks}>
            <a
              href="#feature-vault"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("feature-vault");
              }}
              className={styles.footerLink}
            >
              Features
            </a>
            <a
              href="#simulator"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("simulator");
              }}
              className={styles.footerLink}
            >
              Demo
            </a>
            <Link to="/about" className={styles.footerLink}>
              About
            </Link>
            <Link to="/login" className={styles.footerLink}>
              Log In
            </Link>
            <Link to="/signup" className={styles.footerLink}>
              Sign Up
            </Link>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} HabitAI. Built with precision for ambitious humans.</p>
          <p>Created by Aayush Bharda • All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
