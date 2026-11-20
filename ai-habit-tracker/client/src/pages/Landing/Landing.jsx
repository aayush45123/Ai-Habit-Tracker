/**
 * Landing.jsx — Award-Winning 3D Interactive Habit Tracker Platform
 *
 * Designed with a light Nihilism Monochrome aesthetic:
 * - Direct integration with pure Three.js HeroCanvas
 * - 6 Storytelling stages driven by continuous scroll choreography
 * - Clean two-column split layouts preventing any text/3D object congestion
 */

import React, { useEffect, useRef, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Zap,
  ArrowRight,
  Brain,
  Flame,
  Calendar,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Activity,
  Layers,
  Timer,
  Trophy,
} from "lucide-react";

const HeroCanvas = lazy(() => import("./components/HeroCanvas"));
import styles from "./Landing.module.css";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: "10K+", label: "Active Trackers" },
  { value: "2M+", label: "Habits Completed" },
  { value: "98.4%", label: "Streak Adherence" },
  { value: "21 Days", label: "Neuroplasticity Lock-in" },
];

export default function Landing() {
  const navigate = useNavigate();
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Redirect authenticated user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard", { replace: true });
  }, [navigate]);

  // Scroll progress normalized 0 to 1
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mouse coordinates for 3D parallax
  useEffect(() => {
    const onMouseMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * -2,
      };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // GSAP Animations
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.fromTo(
        `.${styles.heroStagger}`,
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.2 }
      );

      // Section reveal triggers
      gsap.utils.toArray(`.${styles.narrativeBlock}`).forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.landingContainer}>
      {/* ─── 1. FIXED 3D WEBGL HERO CANVAS ─── */}
      <Suspense fallback={null}>
        <HeroCanvas scrollRef={scrollRef} mouseRef={mouseRef} />
      </Suspense>

      {/* ─── 2. SUBTLE ARCHITECTURAL DOT-GRID ─── */}
      <div className={styles.dotGrid} aria-hidden="true" />

      {/* ─── 3. STICKY NEO-BRUTALIST NAVBAR ─── */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Zap size={18} strokeWidth={3} />
            </div>
            <span>HabitAI</span>
          </Link>

          <nav className={styles.navMenu}>
            <button onClick={() => scrollTo("calendar-stage")} className={styles.navItem}>
              3D Calendar
            </button>
            <button onClick={() => scrollTo("ai-stage")} className={styles.navItem}>
              Neural Coach
            </button>
            <button onClick={() => scrollTo("dashboard-stage")} className={styles.navItem}>
              Ecosystem
            </button>
            <button onClick={() => scrollTo("streak-stage")} className={styles.navItem}>
              Streaks
            </button>
          </nav>

          <div className={styles.navCtas}>
            <Link to="/login" className={styles.loginBtn}>
              Log In
            </Link>
            <Link to="/signup" className={styles.signupBtn}>
              <span>Start Journey</span>
              <ArrowRight size={15} strokeWidth={2.75} />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── SECTION 1: HERO EXPERIENCE (TWO-COLUMN UNCONGESTED LAYOUT) ─── */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          {/* Left Column: Typography, CTAs & Metrics */}
          <div className={styles.heroContent}>
            <div className={`${styles.pillBadge} ${styles.heroStagger}`}>
              <Sparkles size={14} strokeWidth={2.5} />
              <span>AI-POWERED HABIT ARCHITECTURE</span>
            </div>

            <h1 className={`${styles.heroHeading} ${styles.heroStagger}`}>
              Build Better Habits.<br />
              <span className={styles.headingAccent}>Become Your Best Self.</span>
            </h1>

            <p className={`${styles.heroSub} ${styles.heroStagger}`}>
              Your personal AI-powered system to build consistency, track progress,
              and transform your everyday routine with mathematical precision.
            </p>

            <div className={`${styles.heroActions} ${styles.heroStagger}`}>
              <Link to="/signup" className={styles.btnPrimary}>
                <span>Start Your Journey</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <button onClick={() => scrollTo("calendar-stage")} className={styles.btnSecondary}>
                <span>Explore 3D Ecosystem</span>
                <ChevronDown size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Minimalist Stats Strip */}
            <div className={`${styles.heroMetrics} ${styles.heroStagger}`}>
              {STATS.map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className={styles.metricDivider} />}
                  <div className={styles.metricItem}>
                    <span className={styles.metricVal}>{s.value}</span>
                    <span className={styles.metricLbl}>{s.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right Column: Clean Open Viewport for 3D Habit Core */}
          <div className={styles.heroVisualSpace} aria-hidden="true" />
        </div>

        <div className={styles.scrollIndicator}>
          <span>Scroll to explore 3D journey</span>
          <ChevronDown size={18} className={styles.bounceIcon} />
        </div>
      </section>

      {/* ─── SECTION 2: 3D HABIT CALENDAR STORY ─── */}
      <section id="calendar-stage" className={styles.storySection}>
        <div className={styles.storyContainer}>
          <div className={styles.narrativeBlock}>
            <div className={styles.stageTag}>
              <Calendar size={14} strokeWidth={2.5} />
              <span>CHAPTER 01 / VISUAL ADHERENCE</span>
            </div>
            <h2 className={styles.stageTitle}>
              Every Day A Monolith.<br />
              Watch Consistency Take Form.
            </h2>
            <p className={styles.stageDesc}>
              Forget flat checkboxes. As you scroll, witness your 3D calendar blocks
              physically rise, flip, and lock into obsidian permanence. Each completed
              day solidifies your momentum into an unbroken chain of truth.
            </p>

            <div className={styles.featurePills}>
              <div className={styles.featurePill}>
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span>IST Midnight Safety Net (00:01 IST)</span>
              </div>
              <div className={styles.featurePill}>
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span>Extruded 35-Day Consistency Heatmaps</span>
              </div>
              <div className={styles.featurePill}>
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span>Zero-Willpower Micro-Habit Scaling</span>
              </div>
            </div>

            <Link to="/signup" className={styles.inlineCta}>
              <span>Build Your 3D Streak</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>

          <div className={styles.viewportSpacer} aria-hidden="true" />
        </div>
      </section>

      {/* ─── SECTION 3: 3D AI NEURAL INTELLIGENCE ─── */}
      <section id="ai-stage" className={styles.storySection}>
        <div className={styles.storyContainer + " " + styles.storyReverse}>
          <div className={styles.narrativeBlock}>
            <div className={styles.stageTag}>
              <Brain size={14} strokeWidth={2.5} />
              <span>CHAPTER 02 / NEURAL REASONING</span>
            </div>
            <h2 className={styles.stageTitle}>
              An AI Coach That Understands<br />
              Your Chronobiology.
            </h2>
            <p className={styles.stageDesc}>
              Powered by Groq Llama 3.3 70B, our Neural Intelligence engine continuously
              correlates your sleep, mood, hydration, and habit completion. It surfaces
              explainable insights with confidence scores and fatigue forecasts.
            </p>

            <div className={styles.telemetryCard}>
              <div className={styles.telemetryHeader}>
                <span className={styles.telemetryDot} />
                <span>LIVE TELEMETRY INSIGHT</span>
              </div>
              <p className={styles.telemetryBody}>
                "Morning focus window identified at 09:30 AM. Habit adherence rises by +44%
                when preceded by 7+ hours of sleep. Pomodoro protocol prepared."
              </p>
              <div className={styles.telemetryFooter}>
                <span>Confidence: 94.8%</span>
                <span>Explainable AI Engine</span>
              </div>
            </div>

            <Link to="/signup" className={styles.inlineCta}>
              <span>Consult Neural Coach</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>

          <div className={styles.viewportSpacer} aria-hidden="true" />
        </div>
      </section>

      {/* ─── SECTION 4: 3D LAYERED DASHBOARD ECOSYSTEM ─── */}
      <section id="dashboard-stage" className={styles.storySection}>
        <div className={styles.storyContainer}>
          <div className={styles.narrativeBlock}>
            <div className={styles.stageTag}>
              <Layers size={14} strokeWidth={2.5} />
              <span>CHAPTER 03 / SPATIAL DASHBOARD</span>
            </div>
            <h2 className={styles.stageTitle}>
              Your Entire Productivity Stack.<br />
              Unified In Three Dimensions.
            </h2>
            <p className={styles.stageDesc}>
              Seamlessly toggle between your Workout Timetable, Daily Time-blocking Schedule,
              Calorie Engine, and Pomodoro Timer. Layered floating slabs create instant
              spatial awareness of what matters right now.
            </p>

            <div className={styles.stackGrid}>
              <div className={styles.stackItem}>
                <div className={styles.stackIcon}><Calendar size={18} /></div>
                <div>
                  <h4 className={styles.stackTitle}>Smart Timetable</h4>
                  <p className={styles.stackSub}>Live 'Happening Now' banner & audio chime</p>
                </div>
              </div>
              <div className={styles.stackItem}>
                <div className={styles.stackIcon}><Timer size={18} /></div>
                <div>
                  <h4 className={styles.stackTitle}>Pomodoro Focus</h4>
                  <p className={styles.stackSub}>Deep work sprints with velocity analytics</p>
                </div>
              </div>
              <div className={styles.stackItem}>
                <div className={styles.stackIcon}><Activity size={18} /></div>
                <div>
                  <h4 className={styles.stackTitle}>Calorie & Fuel</h4>
                  <p className={styles.stackSub}>Mifflin-St Jeor TDEE & macro calibration</p>
                </div>
              </div>
            </div>

            <Link to="/signup" className={styles.inlineCta}>
              <span>Explore Full Dashboard</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>

          <div className={styles.viewportSpacer} aria-hidden="true" />
        </div>
      </section>

      {/* ─── SECTION 5: 3D STREAK & CONSISTENCY MONUMENT ─── */}
      <section id="streak-stage" className={styles.storySection}>
        <div className={styles.storyContainer + " " + styles.storyReverse}>
          <div className={styles.narrativeBlock}>
            <div className={styles.stageTag}>
              <Flame size={14} strokeWidth={2.5} />
              <span>CHAPTER 04 / NEUROPLASTICITY</span>
            </div>
            <h2 className={styles.stageTitle}>
              Lock In The 21-Day Shift.<br />
              Earn XP, Level Up Your Life.
            </h2>
            <p className={styles.stageDesc}>
              Consistency is gamified into an undeniable progression curve. Every completed
              habit logs verified XP, levels up your tier from Novice to Master, and unlocks
              tangible reward shop items while rewiring neural pathways.
            </p>

            <div className={styles.streakMilestones}>
              {[
                { days: "7 Days", title: "Activation Threshold", sub: "+50 Bonus XP" },
                { days: "14 Days", title: "Habit Momentum", sub: "Streak Protection Shield" },
                { days: "21 Days", title: "Neuroplastic Lock-in", sub: "Permanent Behavioral Rewire" },
              ].map((m, i) => (
                <div key={i} className={styles.milestoneRow}>
                  <div className={styles.milestoneBadge}>{m.days}</div>
                  <div>
                    <div className={styles.milestoneTitle}>{m.title}</div>
                    <div className={styles.milestoneSub}>{m.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/signup" className={styles.inlineCta}>
              <span>Start 21-Day Bootcamp</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>

          <div className={styles.viewportSpacer} aria-hidden="true" />
        </div>
      </section>

      {/* ─── SECTION 6: FINAL CTA & FULL PULLBACK ─── */}
      <section className={styles.finalCtaSection}>
        <div className={styles.ctaBox}>
          <div className={styles.pillBadge}>
            <Trophy size={14} strokeWidth={2.5} />
            <span>THE PRODUCTION-GRADE ENGINE</span>
          </div>

          <h2 className={styles.ctaHeading}>
            Stop Relying On Willpower.<br />
            Start Operating On Systems.
          </h2>

          <p className={styles.ctaDesc}>
            Join thousands of high performers building unbreakable daily routines.
            Free to start, zero credit card required, production-grade from day one.
          </p>

          <div className={styles.ctaBtnGroup}>
            <Link to="/signup" className={styles.btnPrimaryLarge}>
              <span>Start Your Journey Free</span>
              <ArrowRight size={20} strokeWidth={2.75} />
            </Link>
            <Link to="/login" className={styles.btnSecondary}>
              Log In to Account
            </Link>
          </div>

          <div className={styles.trustStrip}>
            <span>✓ 100% Free Tier</span>
            <span>•</span>
            <span>✓ IST Timezone Synchronized</span>
            <span>•</span>
            <span>✓ No Credit Card</span>
            <span>•</span>
            <span>✓ Instant Access</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className={styles.siteFooter}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon} style={{ width: 30, height: 30 }}>
                <Zap size={16} strokeWidth={3} />
              </div>
              <span>HabitAI</span>
            </div>
            <p className={styles.footerDesc}>
              Intelligent habit architecture, schedule optimization, and neural growth systems.
            </p>
          </div>

          <div className={styles.footerNav}>
            <button onClick={() => scrollTo("calendar-stage")} className={styles.footerLink}>
              3D Calendar
            </button>
            <button onClick={() => scrollTo("ai-stage")} className={styles.footerLink}>
              Neural Coach
            </button>
            <button onClick={() => scrollTo("dashboard-stage")} className={styles.footerLink}>
              Ecosystem
            </button>
            <button onClick={() => scrollTo("streak-stage")} className={styles.footerLink}>
              Streaks
            </button>
            <Link to="/about" className={styles.footerLink}>
              About
            </Link>
            <Link to="/login" className={styles.footerLink}>
              Log In
            </Link>
          </div>
        </div>

        <div className={styles.footerCopy}>
          <p>© {new Date().getFullYear()} HabitAI • Engineered by Aayush Bharda • All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
