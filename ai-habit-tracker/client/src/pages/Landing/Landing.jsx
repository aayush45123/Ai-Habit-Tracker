/**
 * Landing.jsx — Premium 3D Habit Tracker Landing Page
 *
 * Architecture:
 * - HeroCanvas (fixed behind everything) driven by scrollRef + mouseRef
 * - HTML sections scroll normally over the canvas
 * - GSAP ScrollTrigger animates section text layers
 * - Full theme compliance: white bg, black accents, Sora font, brutalist borders
 */

import React, { useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Zap, ArrowRight, Brain, Flame, BarChart3,
  Timer, Trophy, Calendar, CheckCircle2,
  TrendingUp, Sparkles, ChevronDown,
} from "lucide-react";

// Three.js canvas — lazy loaded so it doesn't block initial render
const HeroCanvas = lazy(() => import("./components/HeroCanvas"));
import styles from "./Landing.module.css";

gsap.registerPlugin(ScrollTrigger);

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Flame size={22} strokeWidth={2.5} />,
    title: "Daily Habit Streaks",
    desc:  "Build unbreakable chains of consistency. IST-aware streak engine that never lets a midnight slip count against you.",
    tag:   "CORE ENGINE",
  },
  {
    icon: <Brain size={22} strokeWidth={2.5} />,
    title: "AI Habit Coach",
    desc:  "Groq Llama-powered intelligence that surfaces personalized recommendations, fatigue forecasts, and intervention alerts.",
    tag:   "NEURAL AI",
  },
  {
    icon: <BarChart3 size={22} strokeWidth={2.5} />,
    title: "Deep Analytics",
    desc:  "30-day heatmaps, 4-week momentum charts, Pearson correlation across lifestyle variables, and exportable PDF audits.",
    tag:   "INSIGHTS",
  },
  {
    icon: <Calendar size={22} strokeWidth={2.5} />,
    title: "Smart Timetable",
    desc:  "Dual scheduling system: workout builder and time-block planner with conflict detection and live \"Happening Now\" banners.",
    tag:   "SCHEDULING",
  },
  {
    icon: <Timer size={22} strokeWidth={2.5} />,
    title: "Pomodoro Focus",
    desc:  "Configurable deep work sprints with Web Audio chime alerts, session analytics, and productivity velocity tracking.",
    tag:   "FOCUS MODE",
  },
  {
    icon: <Trophy size={22} strokeWidth={2.5} />,
    title: "XP & Gamification",
    desc:  "Level up through real habits. XP transactions, badge catalog, virtual reward shop, and 21-day neuroplasticity challenges.",
    tag:   "GAMIFIED",
  },
];

const STEPS = [
  { num: "01", title: "Set Your Habits",        desc: "Define daily non-negotiables. Daily, weekly, or custom frequency with time windows." },
  { num: "02", title: "Log & Complete",          desc: "One tap to mark complete. Instant XP, streak update, and AI feedback loop." },
  { num: "03", title: "Get AI Coaching",         desc: "The neural coach analyzes patterns and surfaces insights you couldn't see yourself." },
  { num: "04", title: "Track Your Growth",       desc: "Watch correlations emerge. See how sleep, focus, and habits compound over time." },
];

const STATS = [
  { value: "10K+",   label: "Active Users"       },
  { value: "2M+",    label: "Habits Logged"      },
  { value: "98.4%",  label: "Streak Consistency" },
  { value: "21 Days", label: "Avg. Habit Lock-in" },
];

// ─── Reusable section header ─────────────────────────────────────────────────
function SectionHeader({ tag, title, subtitle, light }) {
  return (
    <div className={`${styles.sectionHeader} ${light ? styles.sectionHeaderLight : ""}`}>
      <span className={styles.sectionTag}>{tag}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();

  // Shared refs for the canvas
  const scrollRef = useRef(0);   // 0–1 progress
  const mouseRef  = useRef({ x: 0, y: 0 });

  // Section refs for GSAP
  const heroRef     = useRef();
  const habitsRef   = useRef();
  const aiRef       = useRef();
  const analyticsRef= useRef();
  const routineRef  = useRef();
  const ctaRef      = useRef();
  const sectionsRef = useRef([]);

  // Redirect authenticated users
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard", { replace: true });
  }, [navigate]);

  // ── Scroll progress tracker ───────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const scrollTop  = window.scrollY;
      const maxScroll  = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = maxScroll > 0 ? scrollTop / maxScroll : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Mouse parallax tracker ────────────────────────────────────────────────
  useEffect(() => {
    const onMouse = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * -2,
      };
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  // ── GSAP: Animate HTML sections as user scrolls ────────────────────────────
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // ── Hero text entrance
      gsap.fromTo(`.${styles.heroText}`, {
        y: 40, opacity: 0,
      }, {
        y: 0, opacity: 1,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.3,
      });

      // ── Each content section fades in from below as it enters viewport
      gsap.utils.toArray(`.${styles.sectionReveal}`).forEach((el) => {
        gsap.fromTo(el, { y: 50, opacity: 0 }, {
          y: 0, opacity: 1,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            end:   "top 50%",
            scrub: false,
            toggleActions: "play none none none",
          },
        });
      });

      // ── Feature cards stagger
      gsap.utils.toArray(`.${styles.featureCard}`).forEach((card, i) => {
        gsap.fromTo(card, { y: 60, opacity: 0 }, {
          y: 0, opacity: 1,
          duration: 0.75,
          ease: "back.out(1.3)",
          delay: (i % 3) * 0.1,
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });
      });

      // ── Steps stagger
      gsap.utils.toArray(`.${styles.stepCard}`).forEach((card, i) => {
        gsap.fromTo(card, { x: i % 2 === 0 ? -40 : 40, opacity: 0 }, {
          x: 0, opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: i * 0.08,
          scrollTrigger: {
            trigger: card,
            start: "top 86%",
            toggleActions: "play none none none",
          },
        });
      });

      // ── Stats counter animation
      gsap.utils.toArray(`.${styles.statNum}`).forEach((el) => {
        gsap.fromTo(el, { scale: 0.6, opacity: 0 }, {
          scale: 1, opacity: 1,
          duration: 0.6,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });
      });

    });

    return () => ctx.revert();
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.landingPage}>

      {/* ═══ FIXED 3D CANVAS (always behind everything) ════════════════════ */}
      <Suspense fallback={null}>
        <HeroCanvas scrollRef={scrollRef} mouseRef={mouseRef} />
      </Suspense>

      {/* ═══ FIXED GRID BACKGROUND ═════════════════════════════════════════ */}
      <div className={styles.gridBg} aria-hidden="true" />

      {/* ═══ STICKY NAVBAR ══════════════════════════════════════════════════ */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.navLogo}>
            <span className={styles.navLogoIcon}><Zap size={18} strokeWidth={3} /></span>
            <span>HabitAI</span>
          </Link>

          <div className={styles.navLinks}>
            <button className={styles.navLink} onClick={() => scrollToSection("features")}>Features</button>
            <button className={styles.navLink} onClick={() => scrollToSection("how-it-works")}>How it works</button>
            <button className={styles.navLink} onClick={() => scrollToSection("ai-coach")}>AI Coach</button>
            <button className={styles.navLink} onClick={() => scrollToSection("analytics")}>Analytics</button>
          </div>

          <div className={styles.navActions}>
            <Link to="/login"  className={styles.navLogin}>Log In</Link>
            <Link to="/signup" className={styles.navCta}>
              <span>Get Started</span>
              <ArrowRight size={15} strokeWidth={2.75} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO (100vh, 3D canvas is the star)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroBadge} style={{ animationDelay: "0s" }}>
          <Sparkles size={14} strokeWidth={2.5} />
          <span>AI-Powered Habit Intelligence</span>
        </div>

        <h1 className={`${styles.heroH1} ${styles.heroText}`} style={{ animationDelay: "0.1s" }}>
          Build Better Habits.<br />
          <span className={styles.heroH1Accent}>Become Your Best Self.</span>
        </h1>

        <p className={`${styles.heroSubtitle} ${styles.heroText}`} style={{ animationDelay: "0.22s" }}>
          Your personal AI-powered system to build consistency,<br />
          track progress, and transform your everyday routine.
        </p>

        <div className={`${styles.heroCtas} ${styles.heroText}`} style={{ animationDelay: "0.34s" }}>
          <Link to="/signup" className={styles.ctaPrimary}>
            <span>Start Your Journey</span>
            <ArrowRight size={18} strokeWidth={2.75} />
          </Link>
          <button className={styles.ctaSecondary} onClick={() => scrollToSection("features")}>
            <span>Explore Features</span>
            <ChevronDown size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Stats strip */}
        <div className={`${styles.heroStats} ${styles.heroText}`} style={{ animationDelay: "0.46s" }}>
          {STATS.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className={styles.heroStatsDivider} />}
              <div className={styles.heroStat}>
                <span className={styles.statNum}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Scroll cue */}
        <div className={styles.scrollCue}>
          <span className={styles.scrollCueLabel}>Scroll to explore</span>
          <div className={styles.scrollCueArrow}>
            <ChevronDown size={20} strokeWidth={2} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — FEATURES (Habit Tracking)
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className="sectionReveal">
            <SectionHeader
              tag="WHAT YOU GET"
              title="Everything you need to build life-changing habits"
              subtitle="Six precision systems, working together as one intelligent platform."
            />
          </div>

          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`${styles.featureCard} ${styles.sectionReveal}`}>
                <div className={styles.featureTag}>{f.tag}</div>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — AI COACH
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="ai-coach" className={`${styles.section} ${styles.sectionAlt}`} ref={aiRef}>
        <div className={styles.sectionInner}>
          <div className={styles.splitLayout}>
            <div className={`${styles.splitText} ${styles.sectionReveal}`}>
              <SectionHeader
                tag="NEURAL AI"
                title="Your personal AI habit coach, available 24/7"
                subtitle="Powered by Groq Llama 3.3 70B with Explainable AI — every recommendation comes with confidence scores and reasoning, never a black box."
              />
              <ul className={styles.bulletList}>
                {[
                  "Fatigue forecast algorithm detects burnout before it happens",
                  "Context-sensitive habit sequencing based on energy patterns",
                  "Adaptive recovery protocols when streaks break",
                  "Personalized insights from Pearson correlation analysis",
                ].map((item, i) => (
                  <li key={i} className={styles.bulletItem}>
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={styles.ctaPrimary}>
                <span>Try the AI Coach</span>
                <ArrowRight size={16} strokeWidth={2.75} />
              </Link>
            </div>

            <div className={`${styles.splitVisual} ${styles.sectionReveal}`}>
              <div className={styles.aiCard}>
                <div className={styles.aiCardHeader}>
                  <div className={styles.aiCardDot} />
                  <span>AI Neural Coach</span>
                </div>
                <div className={styles.aiMessage}>
                  "Your morning routine completion is 94% when preceded by 7+ hrs of sleep.
                  Tonight's sleep window: 10:30 PM for optimal tomorrow performance."
                </div>
                <div className={styles.aiMeta}>
                  <span className={styles.aiConfidence}>Confidence: 94.2%</span>
                  <span className={styles.aiFactors}>3 factors analyzed</span>
                </div>
                <div className={styles.aiFactorBars}>
                  {[{ label: "Sleep quality", pct: 94 }, { label: "Streak momentum", pct: 78 }, { label: "Energy trend", pct: 86 }].map((b, i) => (
                    <div key={i} className={styles.aiBar}>
                      <div className={styles.aiBarLabel}>
                        <span>{b.label}</span>
                        <span>{b.pct}%</span>
                      </div>
                      <div className={styles.aiBarTrack}>
                        <div className={styles.aiBarFill} style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — ANALYTICS
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="analytics" className={styles.section} ref={analyticsRef}>
        <div className={styles.sectionInner}>
          <div className={styles.splitLayout + " " + styles.splitReverse}>
            <div className={`${styles.splitVisual} ${styles.sectionReveal}`}>
              <div className={styles.analyticsCard}>
                <div className={styles.analyticsHeader}>
                  <span className={styles.analyticsBadge}>30-DAY OVERVIEW</span>
                </div>
                {/* Mini heatmap */}
                <div className={styles.miniHeatmap}>
                  {Array.from({ length: 30 }).map((_, i) => {
                    const heat = Math.random();
                    return (
                      <div
                        key={i}
                        className={styles.heatCell}
                        style={{ opacity: heat < 0.2 ? 0.08 : 0.15 + heat * 0.85 }}
                      />
                    );
                  })}
                </div>
                <div className={styles.analyticsStats}>
                  {[
                    { v: "87%",  l: "Consistency" },
                    { v: "24d",  l: "Best Streak" },
                    { v: "+12%", l: "Week Change" },
                  ].map((s, i) => (
                    <div key={i} className={styles.analyticsStat}>
                      <span className={styles.analyticsStatVal}>{s.v}</span>
                      <span className={styles.analyticsStatLbl}>{s.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${styles.splitText} ${styles.sectionReveal}`}>
              <SectionHeader
                tag="ANALYTICS"
                title="Institutional-grade insights into your habits"
                subtitle="See patterns you've never noticed. Know exactly why you succeed — and when you're at risk."
              />
              <ul className={styles.bulletList}>
                {[
                  "30-day activity heatmap with intensity mapping",
                  "4-week momentum trend — spot improving or declining patterns",
                  "Weekday performance analysis to plan around your strongest days",
                  "Pearson correlation: sleep, energy, mood vs. habit completion",
                  "Exportable PDF performance audit reports",
                ].map((item, i) => (
                  <li key={i} className={styles.bulletItem}>
                    <TrendingUp size={16} strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={styles.ctaPrimary}>
                <span>See Your Analytics</span>
                <ArrowRight size={16} strokeWidth={2.75} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — HOW IT WORKS (Steps)
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className={`${styles.section} ${styles.sectionAlt}`} ref={routineRef}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionReveal}>
            <SectionHeader
              tag="HOW IT WORKS"
              title="Four steps to unstoppable momentum"
              subtitle="From zero to consistent in days, not months."
            />
          </div>

          <div className={styles.stepsGrid}>
            {STEPS.map((step, i) => (
              <div key={i} className={`${styles.stepCard} ${styles.sectionReveal}`}>
                <div className={styles.stepNum}>{step.num}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
                {i < STEPS.length - 1 && <div className={styles.stepConnector} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — FEATURES DETAIL (Timetable, Pomodoro, Gamification)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionReveal}>
            <SectionHeader
              tag="COMPLETE SYSTEM"
              title="Every productivity tool, deeply integrated"
              subtitle="Not just habit tracking. A complete performance operating system."
            />
          </div>

          <div className={styles.systemGrid}>
            <div className={`${styles.systemCard} ${styles.systemCardLarge} ${styles.sectionReveal}`}>
              <div className={styles.systemCardHeader}>
                <Calendar size={20} strokeWidth={2.5} />
                <span>Smart Timetable</span>
                <span className={styles.systemTag}>DUAL SYSTEM</span>
              </div>
              <p className={styles.systemDesc}>
                Two complementary schedulers: a workout timetable for exercise routines
                and a time-block planner for daily scheduling. Conflict detection, live
                "Happening Now" banners, and Web Audio reminder chimes.
              </p>
              <div className={styles.systemMini}>
                {["07:00 Morning Run", "09:00 Deep Work", "12:00 Lunch Break", "17:00 Gym Session"].map((item, i) => (
                  <div key={i} className={styles.systemMiniItem}>
                    <span className={styles.systemMiniDot} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.systemCard} ${styles.sectionReveal}`}>
              <div className={styles.systemCardHeader}>
                <Timer size={20} strokeWidth={2.5} />
                <span>Pomodoro Timer</span>
                <span className={styles.systemTag}>FOCUS</span>
              </div>
              <p className={styles.systemDesc}>
                Configurable work/break intervals with Web Audio chimes. Session
                analytics track your deep work velocity over time.
              </p>
              <div className={styles.pomodoroMini}>
                <div className={styles.pomodoroRing}>
                  <span className={styles.pomodoroTime}>25:00</span>
                  <span className={styles.pomodoroLabel}>Focus Sprint</span>
                </div>
              </div>
            </div>

            <div className={`${styles.systemCard} ${styles.sectionReveal}`}>
              <div className={styles.systemCardHeader}>
                <Trophy size={20} strokeWidth={2.5} />
                <span>XP & Badges</span>
                <span className={styles.systemTag}>GAMIFIED</span>
              </div>
              <p className={styles.systemDesc}>
                Real-time XP on every completion. Level up through 10 tiers, unlock
                badges, and spend XP in the virtual reward shop.
              </p>
              <div className={styles.xpMini}>
                <div className={styles.xpBar}>
                  <div className={styles.xpBarFill} style={{ width: "72%" }} />
                </div>
                <div className={styles.xpLabel}>Level 7 · 72% to Level 8 · +150 XP today</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — FINAL CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section className={`${styles.section} ${styles.ctaSection}`} ref={ctaRef}>
        <div className={styles.sectionInner}>
          <div className={`${styles.ctaBlock} ${styles.sectionReveal}`}>
            <span className={styles.sectionTag}>START TODAY</span>
            <h2 className={styles.ctaTitle}>
              The only habit tracker<br />
              built like you mean it.
            </h2>
            <p className={styles.ctaSubtitle}>
              Join 10,000+ people who stopped relying on willpower
              and started building systems. Free to start. Powerful from day one.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/signup" className={styles.ctaPrimary + " " + styles.ctaPrimaryLarge}>
                <span>Start Your Journey — Free</span>
                <ArrowRight size={20} strokeWidth={2.75} />
              </Link>
              <Link to="/login" className={styles.ctaSecondary}>
                Already have an account? Log In
              </Link>
            </div>
            <p className={styles.ctaMeta}>
              No credit card · No tracking · Just results
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.navLogoIcon} style={{ width: 30, height: 30 }}>
                <Zap size={16} strokeWidth={3} />
              </span>
              <span>HabitAI</span>
            </div>
            <p className={styles.footerTagline}>
              Intelligent habit architecture for high performers.
            </p>
          </div>

          <div className={styles.footerLinks}>
            {[
              { label: "Features",    action: () => scrollToSection("features") },
              { label: "How it works",action: () => scrollToSection("how-it-works") },
              { label: "AI Coach",    action: () => scrollToSection("ai-coach") },
              { label: "Analytics",   action: () => scrollToSection("analytics") },
            ].map((l, i) => (
              <button key={i} className={styles.footerLink} onClick={l.action}>{l.label}</button>
            ))}
            <Link to="/about"  className={styles.footerLink}>About</Link>
            <Link to="/login"  className={styles.footerLink}>Log In</Link>
            <Link to="/signup" className={styles.footerLink}>Sign Up</Link>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} HabitAI · Built with precision for ambitious humans.</p>
          <p>Created by Aayush Bharda · All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
