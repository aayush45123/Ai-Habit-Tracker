// src/pages/About/About.jsx
import React from "react";
import {
  FiBarChart2,
  FiCpu,
  FiTarget,
  FiTrendingUp,
  FiMail,
  FiGithub,
} from "react-icons/fi";
import styles from "./About.module.css";

export default function About() {
  return (
    <div className={styles.root}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <h1 className={styles.title}>HabitAI</h1>
        <p className={styles.subtitle}>
          Your AI-Powered Habit Tracking Companion
        </p>
      </div>

      {/* Mission Section */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Our Mission</h2>
        <p className={styles.cardText}>
          We believe that building better habits is the foundation of personal
          growth. HabitAI combines proven habit-tracking techniques with
          artificial intelligence to help you stay consistent, motivated, and on
          track toward your goals.
        </p>
      </div>

      {/* Features Grid */}
      <div className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiBarChart2 />
          </div>
          <h3 className={styles.featureTitle}>Track Progress</h3>
          <p className={styles.featureText}>
            Monitor your habits with detailed analytics and visualizations.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiCpu />
          </div>
          <h3 className={styles.featureTitle}>AI Insights</h3>
          <p className={styles.featureText}>
            Get personalized recommendations powered by artificial intelligence.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiTarget />
          </div>
          <h3 className={styles.featureTitle}>Focus Mode</h3>
          <p className={styles.featureText}>
            Stay productive with Pomodoro timer and focus tracking.
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiTrendingUp />
          </div>
          <h3 className={styles.featureTitle}>21-Day Challenge</h3>
          <p className={styles.featureText}>
            Build lasting habits with guided challenges and milestones.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles.statsCard}>
        <h2 className={styles.cardTitle}>By The Numbers</h2>
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <div className={styles.statNumber}>10K+</div>
            <div className={styles.statLabel}>Active Users</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>500K+</div>
            <div className={styles.statLabel}>Habits Tracked</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>85%</div>
            <div className={styles.statLabel}>Success Rate</div>
          </div>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Built With</h2>
        <div className={styles.techStack}>
          <div className={styles.techItem}>React</div>
          <div className={styles.techItem}>Node.js</div>
          <div className={styles.techItem}>MongoDB</div>
          <div className={styles.techItem}>Express</div>
          <div className={styles.techItem}>Groq AI</div>
        </div>
      </div>

      {/* Contact Section */}
      <div className={styles.contactCard}>
        <h2 className={styles.cardTitle}>Get In Touch</h2>
        <p className={styles.cardText}>
          Have questions or feedback? We'd love to hear from you.
        </p>
        <div className={styles.contactButtons}>
          <a
            href="mailto:aayushbharda999@gmail.com"
            className={styles.primaryBtn}
          >
            <FiMail className={styles.btnIcon} />
            Email Us
          </a>
          <a
            href="https://github.com/aayush45123"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryBtn}
          >
            <FiGithub className={styles.btnIcon} />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
