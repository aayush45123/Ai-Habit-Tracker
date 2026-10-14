import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  Flame,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Lock,
  ChevronDown,
} from "lucide-react";
import styles from "./Landing.module.css";

// 3D Components
import Scene3DBackground from "./components/Scene3DBackground";
import Hero3DShowcase from "./components/Hero3DShowcase";
import InteractiveHabitSimulator from "./components/InteractiveHabitSimulator";
import Feature3DTabs from "./components/Feature3DTabs";
import Steps3D from "./components/Steps3D";
import Testimonials3D from "./components/Testimonials3D";
import LiveCommunityTicker from "./components/LiveCommunityTicker";

export default function Landing() {
  const navigate = useNavigate();
  const [countersVisible, setCountersVisible] = useState(false);
  const statsRef = useRef(null);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  // Intersection observer for stat counters
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersVisible(true);
        }
      },
      { threshold: 0.25 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={styles.landingPage}>
      {/* 3D Animated Interactive Particle & Geometry Background */}
      <Scene3DBackground />

      {/* Subtle Grid Pattern Overlay */}
      <div className={styles.gridBackground} aria-hidden="true" />

      {/* Sticky Glass Navbar */}
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
              href="#simulator"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("simulator");
              }}
              className={styles.navLink}
            >
              Live Demo
            </a>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("features");
              }}
              className={styles.navLink}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("how-it-works");
              }}
              className={styles.navLink}
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("testimonials");
              }}
              className={styles.navLink}
            >
              Community
            </a>
          </div>

          <div className={styles.navButtons}>
            <Link to="/login" className={styles.loginBtn}>
              Log In
            </Link>
            <Link to="/signup" className={styles.signupBtn}>
              <span>Get Started</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <Sparkles size={15} strokeWidth={2.5} />
            <span>AI-Powered Habit Tracking • 3D Spatial Engine</span>
          </div>

          <h1 className={styles.heroTitle}>
            Build Better Habits,
            <br />
            <span className={styles.highlightText}>Transform Your Life.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Track non-negotiables, build compounding streaks, and optimize your
            daily schedule with neural AI coaching and 21-day neuroplasticity
            challenges.
          </p>

          <div className={styles.heroButtons}>
            <Link to="/signup" className={styles.ctaPrimary}>
              <span>Start Free Today</span>
              <ArrowRight size={19} strokeWidth={2.75} />
            </Link>
            <button
              onClick={() => scrollToSection("simulator")}
              className={styles.ctaSecondary}
            >
              <span>Try Interactive Demo</span>
              <ChevronDown size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Stats Bar */}
          <div className={styles.heroStats} ref={statsRef}>
            <div className={styles.statItem}>
              <div
                className={`${styles.statNumber} ${
                  countersVisible ? styles.statVisible : ""
                }`}
              >
                10,000+
              </div>
              <div className={styles.statLabel}>Active Trackers</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div
                className={`${styles.statNumber} ${
                  countersVisible ? styles.statVisible : ""
                }`}
              >
                500,000+
              </div>
              <div className={styles.statLabel}>Habits Completed</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div
                className={`${styles.statNumber} ${
                  countersVisible ? styles.statVisible : ""
                }`}
              >
                98.4%
              </div>
              <div className={styles.statLabel}>Streak Consistency</div>
            </div>
          </div>
        </div>

        {/* 3D Interactive Device Mockup with Cursor-Tracking Tilt */}
        <Hero3DShowcase />
      </section>

      {/* ─── Live Community Stream Ticker ─── */}
      <LiveCommunityTicker />

      {/* ─── Interactive Habit Simulator Section ─── */}
      <section id="simulator" className={styles.simulatorSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Interactive Playground</div>
          <h2 className={styles.sectionTitle}>Experience The Dopamine Loop</h2>
          <p className={styles.sectionSubtitle}>
            Witness how instant positive feedback and milestone XP triggers keep
            you motivated day after day.
          </p>
        </div>

        <InteractiveHabitSimulator />
      </section>

      {/* ─── 3D Feature Tabs Section ─── */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Platform Capabilities</div>
          <h2 className={styles.sectionTitle}>Everything You Need to Win</h2>
          <p className={styles.sectionSubtitle}>
            Engineered from ground up with cognitive psychology, neuroplasticity,
            and machine intelligence.
          </p>
        </div>

        <Feature3DTabs />
      </section>

      {/* ─── 3D How It Works ─── */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>The Habit Architecture</div>
          <h2 className={styles.sectionTitle}>How HabitAI Works</h2>
          <p className={styles.sectionSubtitle}>
            Three seamless steps to transform fleeting resolutions into permanent
            daily standards.
          </p>
        </div>

        <Steps3D />
      </section>

      {/* ─── 3D Testimonials & Community ─── */}
      <section id="testimonials" className={styles.testimonialsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Wall of Consistency</div>
          <h2 className={styles.sectionTitle}>Built for High Performers</h2>
          <p className={styles.sectionSubtitle}>
            Join thousands of developers, researchers, founders, and students who
            rely on HabitAI every day.
          </p>
        </div>

        <Testimonials3D />
      </section>

      {/* ─── Magnetic Final CTA ─── */}
      <section className={styles.finalCta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Build Unbreakable Momentum?</h2>
          <p className={styles.ctaSubtitle}>
            Start tracking today for free. Join over 10,000+ people compounding
            their daily habits with personalized AI guidance.
          </p>

          <div className={styles.ctaActions}>
            <Link to="/signup" className={styles.ctaPrimaryLarge}>
              <span>Get Started Free</span>
              <ArrowRight size={20} strokeWidth={3} />
            </Link>
            <Link to="/login" className={styles.ctaSecondaryLarge}>
              <span>Log In to Account</span>
            </Link>
          </div>

          <div className={styles.ctaGuarantees}>
            <div className={styles.ctaGuaranteeItem}>
              <CheckCircle2 size={16} strokeWidth={2.5} color="#27c93f" />
              <span>Free forever core plan</span>
            </div>
            <div className={styles.ctaGuaranteeItem}>
              <ShieldCheck size={16} strokeWidth={2.5} color="#27c93f" />
              <span>No credit card required</span>
            </div>
            <div className={styles.ctaGuaranteeItem}>
              <Lock size={16} strokeWidth={2.5} color="#27c93f" />
              <span>Google 1-Click sign-in</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Structured Modern Footer ─── */}
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
              Architect your life with intelligent habit tracking
            </p>
          </div>

          <div className={styles.footerLinks}>
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
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("features");
              }}
              className={styles.footerLink}
            >
              Features
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
