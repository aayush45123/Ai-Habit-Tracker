import React from "react";
import { Link } from "react-router-dom";
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
  return (
    <div className={styles.landingPage}>
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
            Build Better Habits,
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

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>10K+</div>
              <div className={styles.statLabel}>Active Users</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>500K+</div>
              <div className={styles.statLabel}>Habits Tracked</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>85%</div>
              <div className={styles.statLabel}>Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
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
          />
          <FeatureCard
            icon={<Brain size={28} strokeWidth={2} />}
            title="AI Insights"
            description="Get personalized recommendations and insights powered by artificial intelligence."
          />
          <FeatureCard
            icon={<TrendingUp size={28} strokeWidth={2} />}
            title="Progress Analytics"
            description="Visualize your progress with detailed charts and comprehensive analytics."
          />
          <FeatureCard
            icon={<Flame size={28} strokeWidth={2} />}
            title="Streak Building"
            description="Build momentum with streak tracking and celebrate your consistency."
          />
          <FeatureCard
            icon={<Calendar size={28} strokeWidth={2} />}
            title="21-Day Challenge"
            description="Transform habits into routines with guided challenges and milestones."
          />
          <FeatureCard
            icon={<BarChart3 size={28} strokeWidth={2} />}
            title="Focus Mode"
            description="Stay productive with integrated Pomodoro timer and focus tracking tools."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
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
          />
          <StepCard
            number="02"
            title="Add Your Habits"
            description="Choose from templates or create custom habits that match your goals."
          />
          <StepCard
            number="03"
            title="Track & Improve"
            description="Mark habits daily, build streaks, and watch your progress grow."
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
          <h2 className={styles.ctaTitle}>Ready to Build Better Habits?</h2>
          <p className={styles.ctaSubtitle}>
            Start tracking your habits today and transform your life one day at
            a time.
          </p>
          <Link to="/signup" className={styles.ctaPrimaryLarge}>
            <span>Get Started Free</span>
            <ArrowRight size={22} strokeWidth={2.5} />
          </Link>
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
          <p>© 2024 HabitAI. Built with ❤️ by Aayush Bharda</p>
        </div>
      </footer>
    </div>
  );
}

/* Helper Components */

function FeatureCard({ icon, title, description }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className={styles.stepCard}>
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
