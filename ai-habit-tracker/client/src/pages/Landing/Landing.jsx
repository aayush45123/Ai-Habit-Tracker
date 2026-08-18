import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Target,
  TrendingUp,
  Brain,
  Calendar,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Flame,
} from "lucide-react";
import styles from "./Landing.module.css";

export default function Landing() {
  const navigate = useNavigate();
  const [countersVisible, setCountersVisible] = useState(false);
  const statsRef = useRef(null);

  // Redirect to dashboard if already logged in
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
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.landingPage}>
      {/* Animated Grid Background */}
      <div className={styles.gridBackground} aria-hidden="true" />

      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <Zap size={24} strokeWidth={2.5} />
            <span>HabitAI</span>
          </div>

          <div className={styles.navButtons}>
            <Link to="/login" className={styles.loginBtn}>
              Login
            </Link>
            <Link to="/signup" className={styles.signupBtn}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <Flame size={16} strokeWidth={2} />
            <span>AI-Powered Habit Tracking</span>
          </div>

          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleLine1}>Build Better Habits,</span>
            <br />
            <span className={styles.highlightText}>Transform Your Life</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Track your daily habits, build powerful streaks, and transform your
            life one day at a time with AI-powered insights and personalized
            recommendations.
          </p>

          <div className={styles.heroButtons}>
            <Link to="/signup" className={styles.ctaPrimary}>
              <span>Start Free Today</span>
              <ArrowRight size={20} strokeWidth={2.5} />
            </Link>
            <Link to="/about" className={styles.ctaSecondary}>
              Learn More
            </Link>
          </div>

          <div className={styles.heroStats} ref={statsRef}>
            <StatCounter
              end={10000}
              suffix="+"
              label="Active Users"
              visible={countersVisible}
              display="10K+"
            />
            <div className={styles.statDivider} />
            <StatCounter
              end={500000}
              suffix="+"
              label="Habits Tracked"
              visible={countersVisible}
              display="500K+"
            />
            <div className={styles.statDivider} />
            <StatCounter
              end={85}
              suffix="%"
              label="Success Rate"
              visible={countersVisible}
              display="85%"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Features</div>
          <h2 className={styles.sectionTitle}>Everything You Need</h2>
          <p className={styles.sectionSubtitle}>
            Powerful tools to help you stay consistent and motivated
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <FeatureCard
            icon={<Target size={28} strokeWidth={2} />}
            title="Smart Tracking"
            description="Track your habits effortlessly with an intuitive interface designed for daily use."
            delay={0}
          />
          <FeatureCard
            icon={<Brain size={28} strokeWidth={2} />}
            title="AI Insights"
            description="Get personalized recommendations and insights powered by artificial intelligence."
            delay={1}
          />
          <FeatureCard
            icon={<TrendingUp size={28} strokeWidth={2} />}
            title="Progress Analytics"
            description="Visualize your progress with detailed charts and comprehensive analytics."
            delay={2}
          />
          <FeatureCard
            icon={<Flame size={28} strokeWidth={2} />}
            title="Streak Building"
            description="Build momentum with streak tracking and celebrate your consistency."
            delay={3}
          />
          <FeatureCard
            icon={<Calendar size={28} strokeWidth={2} />}
            title="21-Day Challenge"
            description="Transform habits into routines with guided challenges and milestones."
            delay={4}
          />
          <FeatureCard
            icon={<BarChart3 size={28} strokeWidth={2} />}
            title="Focus Mode"
            description="Stay productive with integrated Pomodoro timer and focus tracking tools."
            delay={5}
          />
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Process</div>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>
            Get started in three simple steps
          </p>
        </div>

        <div className={styles.stepsGrid}>
          <StepCard
            number="01"
            title="Create Your Account"
            description="Sign up in seconds and start your journey to better habits today."
            delay={0}
          />
          <StepCard
            number="02"
            title="Add Your Habits"
            description="Choose from templates or create custom habits that match your goals."
            delay={1}
          />
          <StepCard
            number="03"
            title="Track &amp; Improve"
            description="Mark habits daily, build streaks, and watch your progress grow."
            delay={2}
          />
        </div>
      </section>

      {/* Social Proof */}
      <section className={styles.socialProof}>
        <div className={styles.proofContent}>
          <h2 className={styles.proofTitle}>
            Join thousands of people building better habits
          </h2>
          <div className={styles.proofItems}>
            <ProofItem
              icon={<CheckCircle2 size={20} strokeWidth={2.5} />}
              text="No credit card required"
            />
            <ProofItem
              icon={<CheckCircle2 size={20} strokeWidth={2.5} />}
              text="Free forever plan"
            />
            <ProofItem
              icon={<CheckCircle2 size={20} strokeWidth={2.5} />}
              text="Cancel anytime"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.finalCta}>
        <div className={styles.ctaContent}>
          <div className={styles.ctaDecorTop} aria-hidden="true" />
          <h2 className={styles.ctaTitle}>Ready to Build Better Habits?</h2>
          <p className={styles.ctaSubtitle}>
            Start tracking your habits today and transform your life one day at
            a time.
          </p>
          <Link to="/signup" className={styles.ctaPrimaryLarge}>
            <span>Get Started Free</span>
            <ArrowRight size={22} strokeWidth={2.5} />
          </Link>
          <div className={styles.ctaDecorBottom} aria-hidden="true" />
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <Zap size={20} strokeWidth={2.5} />
              <span>HabitAI</span>
            </div>
            <p className={styles.footerTagline}>Build better habits with AI</p>
          </div>

          <div className={styles.footerLinks}>
            <Link to="/about" className={styles.footerLink}>
              About
            </Link>
            <Link to="/login" className={styles.footerLink}>
              Login
            </Link>
            <Link to="/signup" className={styles.footerLink}>
              Sign Up
            </Link>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2024 HabitAI. Built with care by Aayush Bharda</p>
        </div>
      </footer>
    </div>
  );
}

/* Helper Components */

function StatCounter({ display, label, visible }) {
  return (
    <div className={styles.statItem}>
      <div className={`${styles.statNumber} ${visible ? styles.statVisible : ""}`}>
        {display}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }) {
  return (
    <div
      className={styles.featureCard}
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, delay }) {
  return (
    <div
      className={styles.stepCard}
      style={{ animationDelay: `${delay * 0.12}s` }}
    >
      <div className={styles.stepNumber}>{number}</div>
      <h3 className={styles.stepTitle}>{title}</h3>
      <p className={styles.stepDescription}>{description}</p>
    </div>
  );
}

function ProofItem({ icon, text }) {
  return (
    <div className={styles.proofItem}>
      {icon}
      <span>{text}</span>
    </div>
  );
}
