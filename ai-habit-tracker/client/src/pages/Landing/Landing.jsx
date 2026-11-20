/**
 * Landing.jsx — Award-Winning 3D Interactive Habit Tracker Platform
 *
 * Human-Crafted Modern SaaS Design:
 * - Apple / Linear / Raycast-caliber light theme aesthetics
 * - Embedded 3D Three.js hardware showcase with interactive mouse parallax
 * - Live interactive habit completion simulator with real-time feedback
 * - Interactive Chronobiology AI coach preview with Groq telemetry tabs
 * - Apple-style Spatial Bento Grid showcasing timetable, pomodoro, calories & bootcamp
 * - Interactive Productivity ROI Calculator with dynamic slider
 * - 4-Tier Neuroplasticity Gamification Ladder
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
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
  ShieldCheck,
  Clock,
  TrendingUp,
  Sliders,
  Check,
  Sun,
  Code,
  Dumbbell,
  Target,
  BarChart3,
} from "lucide-react";

const HeroCanvas = lazy(() => import("./components/HeroCanvas"));
import styles from "./Landing.module.css";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: "10K+", label: "Active Trackers" },
  { value: "2M+", label: "Habits Completed" },
  { value: "98.4%", label: "Streak Adherence" },
  { value: "21 Days", label: "Neuroplastic Lock-in" },
];

const AI_TABS = [
  {
    id: "chronobiology",
    title: "Chronobiology Peak",
    badge: "Circadian Sync",
    quote:
      "Deep focus window identified between 09:15 AM - 11:30 AM based on your sleep log. Scheduled 'Deep Work Sprint' here for +44% adherence.",
    confidence: "96.4%",
    latency: "140ms Groq Llama 3.3",
  },
  {
    id: "fatigue",
    title: "Fatigue Risk Forecast",
    badge: "Predictive Guardrail",
    quote:
      "Logged 5.5 hours sleep (below 7h baseline). Reduced workout threshold from 60m to 25m micro-habit to protect your 14-day streak.",
    confidence: "93.8%",
    latency: "128ms Groq Llama 3.3",
  },
  {
    id: "stacking",
    title: "Atomic Habit Stacking",
    badge: "BJ Fogg Protocol",
    quote:
      "Pairing 'Morning Sunlight' immediately after 'Espresso Preparation' produces a 98.2% lock-in rate over 21 consecutive cycles.",
    confidence: "98.1%",
    latency: "135ms Groq Llama 3.3",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Interactive Habit Simulator State
  const [habits, setHabits] = useState([
    {
      id: 1,
      name: "Morning Sunlight & Hydration",
      time: "07:30 AM",
      icon: <Sun size={18} />,
      xp: "+30 XP",
      completed: true,
    },
    {
      id: 2,
      name: "Deep Work Sprint (90m)",
      time: "10:00 AM",
      icon: <Code size={18} />,
      xp: "+60 XP",
      completed: false,
    },
    {
      id: 3,
      name: "Strength Training & Fuel",
      time: "05:30 PM",
      icon: <Dumbbell size={18} />,
      xp: "+45 XP",
      completed: false,
    },
  ]);
  const [streak, setStreak] = useState(14);
  const [confetti, setConfetti] = useState(false);

  // AI Tab state
  const [activeAiTab, setActiveAiTab] = useState(0);

  // ROI Calculator state
  const [habitCount, setHabitCount] = useState(4);

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
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", delay: 0.1 }
      );
    });

    return () => ctx.revert();
  }, []);

  // Toggle habit simulator
  const toggleHabit = (id) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextState = !h.completed;
          if (nextState) {
            setStreak((s) => s + 1);
            setConfetti(true);
            setTimeout(() => setConfetti(false), 1600);
          } else {
            setStreak((s) => Math.max(14, s - 1));
          }
          return { ...h, completed: nextState };
        }
        return h;
      })
    );
  };

  const completedHabits = habits.filter((h) => h.completed).length;
  const progressPct = Math.round((completedHabits / habits.length) * 100);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.landingContainer}>
      {/* ─── Ambient Glow Mesh ─── */}
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.dotGrid} aria-hidden="true" />

      {/* ─── 1. MODERN GLASS NAVBAR ─── */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Zap size={18} strokeWidth={2.75} />
            </div>
            <span>HabitAI</span>
          </Link>

          <nav className={styles.navMenu}>
            <button onClick={() => scrollTo("interactive-engine")} className={styles.navItem}>
              Interactive Simulator
            </button>
            <button onClick={() => scrollTo("ai-coach")} className={styles.navItem}>
              Neural AI Coach
            </button>
            <button onClick={() => scrollTo("bento-stack")} className={styles.navItem}>
              Productivity Stack
            </button>
            <button onClick={() => scrollTo("roi-calculator")} className={styles.navItem}>
              ROI Calculator
            </button>
          </nav>

          <div className={styles.navCtas}>
            <Link to="/login" className={styles.loginBtn}>
              Log In
            </Link>
            <Link to="/signup" className={styles.signupBtn}>
              <span>Get Started</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO EXPERIENCE (APPLE/LINEAR STYLE) ─── */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          {/* Eyebrow Pill */}
          <div className={`${styles.pillBadge} ${styles.heroStagger}`}>
            <Sparkles size={14} className={styles.sparkleIcon} />
            <span>THE AI-POWERED PRODUCTIVITY ECOSYSTEM</span>
          </div>

          {/* Headline */}
          <h1 className={`${styles.heroHeading} ${styles.heroStagger}`}>
            Build Better Habits.<br />
            <span className={styles.headingGradient}>Become Your Best Self.</span>
          </h1>

          {/* Subtitle */}
          <p className={`${styles.heroSub} ${styles.heroStagger}`}>
            Your personal AI-driven system to build consistency, eliminate cognitive fatigue,
            and master daily execution with chronobiology intelligence.
          </p>

          {/* CTAs */}
          <div className={`${styles.heroActions} ${styles.heroStagger}`}>
            <Link to="/signup" className={styles.btnPrimary}>
              <span>Start Your Journey Free</span>
              <ArrowRight size={17} strokeWidth={2.5} />
            </Link>
            <button onClick={() => scrollTo("interactive-engine")} className={styles.btnSecondary}>
              <span>Try Live Simulator</span>
              <ChevronDown size={17} strokeWidth={2.5} />
            </button>
          </div>

          {/* Metric Bar */}
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

        {/* ─── 3D HARDWARE SHOWCASE STAGE ─── */}
        <div className={styles.hero3DStage}>
          <div className={styles.canvasWrapper}>
            <Suspense fallback={<div className={styles.canvasPlaceholder} />}>
              <HeroCanvas scrollRef={scrollRef} mouseRef={mouseRef} />
            </Suspense>
          </div>
          <div className={styles.stageReflection} />
        </div>
      </section>

      {/* ─── 3. LIVE INTERACTIVE HABIT SIMULATOR ─── */}
      <section id="interactive-engine" className={styles.sectionPadding}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Calendar size={14} />
            <span>INTERACTIVE HABIT CORE</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Experience The Habit Engine.<br />
            Click Below To Test Daily Flow.
          </h2>
          <p className={styles.sectionSub}>
            Don't take our word for it. Complete today's non-negotiable habits right now
            and watch your adherence ring and consistency streak advance.
          </p>
        </div>

        <div className={styles.simulatorGrid}>
          {/* Left Column: Interactive Checklist Card */}
          <div className={styles.simulatorCard}>
            <div className={styles.simCardHeader}>
              <div>
                <span className={styles.simCardDate}>TODAY'S PROTOCOL</span>
                <h3 className={styles.simCardTitle}>Daily Non-Negotiables</h3>
              </div>
              <div className={styles.streakBadge}>
                <Flame size={16} className={styles.flameIcon} />
                <span>{streak} Days</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className={styles.simProgressTrack}>
              <div className={styles.simProgressBar} style={{ width: `${progressPct}%` }} />
            </div>
            <div className={styles.simProgressLabel}>
              <span>{completedHabits} of {habits.length} Completed</span>
              <span className={styles.progressPctText}>{progressPct}%</span>
            </div>

            {/* Interactive Habit Items */}
            <div className={styles.habitList}>
              {habits.map((h) => (
                <div
                  key={h.id}
                  onClick={() => toggleHabit(h.id)}
                  className={`${styles.habitItem} ${h.completed ? styles.habitCompleted : ""}`}
                >
                  <div className={styles.habitCheck}>
                    {h.completed ? <Check size={14} strokeWidth={3} /> : null}
                  </div>
                  <div className={styles.habitInfo}>
                    <span className={styles.habitName}>{h.name}</span>
                    <span className={styles.habitTime}>{h.time}</span>
                  </div>
                  <span className={styles.habitXp}>{h.xp}</span>
                </div>
              ))}
            </div>

            {confetti && (
              <div className={styles.confettiBanner}>
                <Sparkles size={16} />
                <span>Streak Momentum Maintained! +XP Awarded</span>
              </div>
            )}
          </div>

          {/* Right Column: Architectural Highlights */}
          <div className={styles.featuresColumn}>
            <div className={styles.featureBox}>
              <div className={styles.featureIconWrap}>
                <Clock size={20} className={styles.featureIcon} />
              </div>
              <div>
                <h4 className={styles.featureTitle}>IST Midnight Safety Net</h4>
                <p className={styles.featureDesc}>
                  Habit rollover occurs at 00:01 IST with an automatic grace buffer.
                  Your streak never resets unfairly due to late-night productivity sprints.
                </p>
              </div>
            </div>

            <div className={styles.featureBox}>
              <div className={styles.featureIconWrap}>
                <BarChart3 size={20} className={styles.featureIcon} />
              </div>
              <div>
                <h4 className={styles.featureTitle}>35-Day Consistency Heatmaps</h4>
                <p className={styles.featureDesc}>
                  High-resolution visual telemetry maps your execution density across 5 weeks,
                  revealing compounding momentum and behavioral blind spots.
                </p>
              </div>
            </div>

            <div className={styles.featureBox}>
              <div className={styles.featureIconWrap}>
                <Target size={20} className={styles.featureIcon} />
              </div>
              <div>
                <h4 className={styles.featureTitle}>Zero-Willpower Micro Habits</h4>
                <p className={styles.featureDesc}>
                  Automatically scales habit friction down during high-fatigue days to preserve
                  the neural circuitry of showing up without breaking your streak.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. NEURAL AI COACH (GROQ LLAMA 3.3 TELEMETRY) ─── */}
      <section id="ai-coach" className={`${styles.sectionPadding} ${styles.altBg}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Brain size={14} />
            <span>NEURAL INTELLIGENCE</span>
          </div>
          <h2 className={styles.sectionTitle}>
            An AI Coach That Understands<br />
            Your Chronobiology.
          </h2>
          <p className={styles.sectionSub}>
            Powered by Groq Llama 3.3 70B, our Neural Intelligence engine continuously
            correlates your sleep, mood, hydration, and habit completion to optimize execution.
          </p>
        </div>

        <div className={styles.aiTelemetryContainer}>
          {/* Tab selector */}
          <div className={styles.aiTabButtons}>
            {AI_TABS.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveAiTab(idx)}
                className={`${styles.aiTabBtn} ${activeAiTab === idx ? styles.aiTabBtnActive : ""}`}
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Active AI Telemetry Card */}
          <div className={styles.aiCard}>
            <div className={styles.aiCardHeader}>
              <div className={styles.aiCardTag}>
                <span className={styles.livePulse} />
                <span>{AI_TABS[activeAiTab].badge}</span>
              </div>
              <div className={styles.aiCardModel}>
                <span>{AI_TABS[activeAiTab].latency}</span>
              </div>
            </div>

            <blockquote className={styles.aiCardBody}>
              "{AI_TABS[activeAiTab].quote}"
            </blockquote>

            <div className={styles.aiCardFooter}>
              <div className={styles.confidenceScore}>
                <span className={styles.confidenceDot} />
                <span>Neural Confidence: <strong>{AI_TABS[activeAiTab].confidence}</strong></span>
              </div>
              <Link to="/signup" className={styles.aiCardCta}>
                <span>Consult Neural Coach</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. APPLE-STYLE SPATIAL BENTO GRID ─── */}
      <section id="bento-stack" className={styles.sectionPadding}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Layers size={14} />
            <span>UNIFIED ARCHITECTURE</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Your Entire Productivity Stack.<br />
            Harmonized Into One Operating System.
          </h2>
          <p className={styles.sectionSub}>
            Stop juggling 5 disconnected tools. HabitAI unifies daily schedules, deep work pomodoros,
            calorie tracking, and neuroplasticity into an interconnected workflow.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {/* Bento 1: Smart Timetable (Large Card) */}
          <div className={`${styles.bentoCard} ${styles.bentoCardWide}`}>
            <div className={styles.bentoCardHeader}>
              <div className={styles.bentoIcon}><Calendar size={20} /></div>
              <span className={styles.bentoBadge}>LIVE 'HAPPENING NOW' CHIME</span>
            </div>
            <h3 className={styles.bentoTitle}>Smart Dual Timetable</h3>
            <p className={styles.bentoDesc}>
              Seamlessly toggle between your structured Workout Routine and daily Time-Blocking Planner.
              Real-time banner displays current active block with audio chime transitions.
            </p>
            <div className={styles.bentoPreviewTimetable}>
              <div className={styles.timetableRowActive}>
                <span className={styles.timeTag}>10:00 - 11:30 AM</span>
                <span className={styles.taskTag}>⚡ Deep Work: Core Engineering</span>
                <span className={styles.statusLive}>Happening Now</span>
              </div>
              <div className={styles.timetableRow}>
                <span className={styles.timeTag}>11:30 - 12:30 PM</span>
                <span className={styles.taskTag}>System Architecture Review</span>
                <span className={styles.statusQueued}>Up Next</span>
              </div>
            </div>
          </div>

          {/* Bento 2: Pomodoro Focus Engine */}
          <div className={styles.bentoCard}>
            <div className={styles.bentoCardHeader}>
              <div className={styles.bentoIcon}><Timer size={20} /></div>
              <span className={styles.bentoBadge}>VELOCITY ANALYTICS</span>
            </div>
            <h3 className={styles.bentoTitle}>Pomodoro Focus</h3>
            <p className={styles.bentoDesc}>
              Deep work sprint intervals with sound alerts, break cycles, and velocity tracking.
            </p>
            <div className={styles.pomodoroDialPreview}>
              <div className={styles.dialInner}>
                <span className={styles.dialTime}>25:00</span>
                <span className={styles.dialLabel}>SPRINT ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Bento 3: Calorie & Macro Fuel */}
          <div className={styles.bentoCard}>
            <div className={styles.bentoCardHeader}>
              <div className={styles.bentoIcon}><Activity size={20} /></div>
              <span className={styles.bentoBadge}>TDEE CALIBRATION</span>
            </div>
            <h3 className={styles.bentoTitle}>Calorie & Fuel</h3>
            <p className={styles.bentoDesc}>
              Mifflin-St Jeor metabolic expenditure calculations with precise macro nutrient targeting.
            </p>
            <div className={styles.macroSplitPreview}>
              <div className={styles.macroBar}>
                <div className={styles.macroProtein} style={{ width: "40%" }} />
                <div className={styles.macroCarbs} style={{ width: "35%" }} />
                <div className={styles.macroFats} style={{ width: "25%" }} />
              </div>
              <div className={styles.macroLegend}>
                <span>Protein 40%</span>
                <span>Carbs 35%</span>
                <span>Fats 25%</span>
              </div>
            </div>
          </div>

          {/* Bento 4: 21-Day Neuroplasticity Bootcamp */}
          <div className={`${styles.bentoCard} ${styles.bentoCardWide}`}>
            <div className={styles.bentoCardHeader}>
              <div className={styles.bentoIcon}><Flame size={20} /></div>
              <span className={styles.bentoBadge}>NEUROPLASTIC LOCK-IN</span>
            </div>
            <h3 className={styles.bentoTitle}>21-Day Habit Challenge</h3>
            <p className={styles.bentoDesc}>
              Evidence-based neuroplasticity milestones. Complete 21 consecutive days to permanently
              wire new behavioral routines into your basal ganglia.
            </p>
            <div className={styles.bootcampProgressPreview}>
              <div className={styles.bootcampStep}>
                <span className={styles.stepDay}>Day 7</span>
                <span className={styles.stepTitle}>Activation Threshold</span>
                <span className={styles.stepXp}>+50 XP</span>
              </div>
              <div className={styles.bootcampStep}>
                <span className={styles.stepDay}>Day 14</span>
                <span className={styles.stepTitle}>Momentum Shield</span>
                <span className={styles.stepXp}>Streak Freeze</span>
              </div>
              <div className={`${styles.bootcampStep} ${styles.bootcampStepHighlight}`}>
                <span className={styles.stepDay}>Day 21</span>
                <span className={styles.stepTitle}>Neural Lock-in</span>
                <span className={styles.stepXp}>Master Tier</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. INTERACTIVE PRODUCTIVITY ROI CALCULATOR ─── */}
      <section id="roi-calculator" className={`${styles.sectionPadding} ${styles.altBg}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Sliders size={14} />
            <span>COMPOUNDING CALCULATOR</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Measure The Mathematics<br />
            Of Your Consistency.
          </h2>
          <p className={styles.sectionSub}>
            Small daily habits compound into massive life transformations.
            Adjust the slider to calculate your projected 1-year compounding return.
          </p>
        </div>

        <div className={styles.calculatorCard}>
          <div className={styles.calculatorControl}>
            <div className={styles.calcSliderHeader}>
              <label htmlFor="habit-slider" className={styles.calcSliderLabel}>
                Target Daily Habits: <strong>{habitCount} Habits</strong>
              </label>
              <span className={styles.calcRecommendedBadge}>Ideal Zone: 3-5 Habits</span>
            </div>
            <input
              id="habit-slider"
              type="range"
              min="1"
              max="7"
              value={habitCount}
              onChange={(e) => setHabitCount(parseInt(e.target.value, 10))}
              className={styles.calcSlider}
            />
          </div>

          <div className={styles.calcResultsGrid}>
            <div className={styles.calcResultBox}>
              <span className={styles.calcResultVal}>{habitCount * 73} hrs</span>
              <span className={styles.calcResultLbl}>Reclaimed Deep Work / Year</span>
            </div>
            <div className={styles.calcResultBox}>
              <span className={styles.calcResultVal}>{Math.min(99, 82 + habitCount * 2.5).toFixed(1)}%</span>
              <span className={styles.calcResultLbl}>Projected Adherence Score</span>
            </div>
            <div className={styles.calcResultBox}>
              <span className={styles.calcResultVal}>21 Days</span>
              <span className={styles.calcResultLbl}>Average Neuroplastic Lock-In</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. GAMIFICATION & PROGRESSION ROADMAP ─── */}
      <section className={styles.sectionPadding}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Trophy size={14} />
            <span>PROGRESSION TIERS</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Level Up Your Life.<br />
            From Novice To Habit Architect.
          </h2>
          <p className={styles.sectionSub}>
            Every verified completion awards experience points (XP). Rise through 4 distinct tiers
            and unlock tangible streak protections in the HabitAI reward shop.
          </p>
        </div>

        <div className={styles.tiersGrid}>
          {[
            { tier: "Tier 1", name: "Novice", xp: "0 - 500 XP", desc: "Foundational micro-habit calibration and daily morning check-ins." },
            { tier: "Tier 2", name: "Practitioner", xp: "500 - 1,500 XP", desc: "Streak Freeze unlocked. Automatic chronobiology correlation active." },
            { tier: "Tier 3", name: "Architect", xp: "1,500 - 3,500 XP", desc: "Dual timetable synchronization and deep work velocity analytics." },
            { tier: "Tier 4", name: "Master", xp: "3,500+ XP", desc: "Permanent neuroplastic lock-in. Top 1% global consistency profile." },
          ].map((t, i) => (
            <div key={i} className={styles.tierCard}>
              <div className={styles.tierBadge}>{t.tier}</div>
              <h4 className={styles.tierName}>{t.name}</h4>
              <span className={styles.tierXp}>{t.xp}</span>
              <p className={styles.tierDesc}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 8. FINAL HIGH-CONVERSION CTA ─── */}
      <section className={styles.finalCtaSection}>
        <div className={styles.ctaBox}>
          <div className={styles.pillBadge}>
            <Sparkles size={14} />
            <span>START OPERATING ON SYSTEMS</span>
          </div>

          <h2 className={styles.ctaHeading}>
            Stop Relying On Willpower.<br />
            Start Building Unbreakable Momentum.
          </h2>

          <p className={styles.ctaDesc}>
            Join thousands of high performers building unbreakable daily routines.
            Free to start, zero credit card required, production-grade from day one.
          </p>

          <div className={styles.ctaBtnGroup}>
            <Link to="/signup" className={styles.btnPrimaryLarge}>
              <span>Start Your Journey Free</span>
              <ArrowRight size={18} strokeWidth={2.5} />
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
            <span>✓ Zero Credit Card Required</span>
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
              <div className={styles.logoIcon}>
                <Zap size={16} strokeWidth={2.75} />
              </div>
              <span>HabitAI</span>
            </div>
            <p className={styles.footerDesc}>
              Intelligent habit architecture, schedule optimization, and neural growth systems.
            </p>
          </div>

          <div className={styles.footerNav}>
            <button onClick={() => scrollTo("interactive-engine")} className={styles.footerLink}>
              Simulator
            </button>
            <button onClick={() => scrollTo("ai-coach")} className={styles.footerLink}>
              Neural AI Coach
            </button>
            <button onClick={() => scrollTo("bento-stack")} className={styles.footerLink}>
              Productivity Stack
            </button>
            <button onClick={() => scrollTo("roi-calculator")} className={styles.footerLink}>
              ROI Calculator
            </button>
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
