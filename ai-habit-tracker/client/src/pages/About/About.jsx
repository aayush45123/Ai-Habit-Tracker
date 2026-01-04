import React from "react";
import {
  BarChart3,
  Cpu,
  Target,
  Mail,
  Github,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";
import styles from "./About.module.css";
import me from "../../assets/me.jpg";

export default function About() {
  return (
    <div className={styles.root}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.title}>HabitAI</h1>
        <p className={styles.subtitle}>
          Your AI-Powered Habit Tracking Companion
        </p>
      </section>

      {/* Mission Section */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Our Mission</h2>
        <p className={styles.cardText}>
          We believe that building better habits is the foundation of personal
          growth. HabitAI combines proven habit-tracking techniques with
          artificial intelligence to help you stay consistent, motivated, and on
          track toward your goals.
        </p>
      </section>

      {/* Features Grid */}
      <section className={styles.featuresGrid}>
        <Feature
          icon={<BarChart3 size={24} strokeWidth={2} />}
          title="Track Progress"
          text="Monitor your habits with detailed analytics and visualizations."
        />
        <Feature
          icon={<Cpu size={24} strokeWidth={2} />}
          title="AI Insights"
          text="Get personalized recommendations powered by artificial intelligence."
        />
        <Feature
          icon={<Target size={24} strokeWidth={2} />}
          title="Focus Mode"
          text="Stay productive with Pomodoro timer and focus tracking."
        />
      </section>

      {/* Stats Section */}
      <section className={styles.statsCard}>
        <h2 className={styles.cardTitle}>By The Numbers</h2>
        <div className={styles.statsGrid}>
          <Stat number="10K+" label="Active Users" />
          <Stat number="500K+" label="Habits Tracked" />
          <Stat number="85%" label="Success Rate" />
        </div>
      </section>

      {/* Tech Stack */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Built With</h2>
        <div className={styles.techStack}>
          <span className={styles.techItem}>React</span>
          <span className={styles.techItem}>Node.js</span>
          <span className={styles.techItem}>MongoDB</span>
          <span className={styles.techItem}>Express</span>
          <span className={styles.techItem}>Groq AI</span>
        </div>
      </section>

      {/* Creator Section */}
      <section className={styles.creatorCard}>
        <h2 className={styles.cardTitle}>Meet The Creator</h2>

        <div className={styles.creatorContent}>
          <div className={styles.imageWrapper}>
            <img src={me} alt="Aayush Bharda" className={styles.creatorImage} />
          </div>

          <div className={styles.creatorInfo}>
            <h3 className={styles.creatorName}>Aayush Bharda</h3>
            <p className={styles.creatorRole}>Full Stack Developer</p>

            <p className={styles.creatorBio}>
              HabitAI is a passion project built from scratch, combining AI,
              productivity, and clean system design to help people build
              long-lasting habits.
            </p>

            <div className={styles.socialLinks}>
              <Social
                href="https://github.com/aayush45123"
                icon={<Github size={20} strokeWidth={2} />}
                label="GitHub"
              />
              <Social
                href="https://www.linkedin.com/in/aayush-bharda-399958311/"
                icon={<Linkedin size={20} strokeWidth={2} />}
                label="LinkedIn"
              />
              <Social
                href="https://x.com/AayushBhar56806"
                icon={<Twitter size={20} strokeWidth={2} />}
                label="Twitter"
              />
              <Social
                href="https://aayush45123.github.io/My-PortFolio/"
                icon={<Globe size={20} strokeWidth={2} />}
                label="Portfolio"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contactCard}>
        <h2 className={styles.cardTitle}>Get In Touch</h2>
        <p className={styles.cardText}>
          Have questions or feedback? I'd love to hear from you.
        </p>

        <div className={styles.contactButtons}>
          <a
            href="mailto:aayushbharda999@gmail.com"
            className={styles.primaryBtn}
          >
            <Mail size={18} strokeWidth={2} />
            <span>Email Me</span>
          </a>

          <a
            href="https://github.com/aayush45123"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryBtn}
          >
            <Github size={18} strokeWidth={2} />
            <span>View Code</span>
          </a>
        </div>
      </section>
    </div>
  );
}

/* ---------- Small Components ---------- */

function Feature({ icon, title, text }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureText}>{text}</p>
    </div>
  );
}

function Stat({ number, label }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statNumber}>{number}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function Social({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.socialLink}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
