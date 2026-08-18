// server/src/services/email.service.js
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "../templates");

// ──────────────────────────────────────────
// Create Nodemailer transporter
// Falls back to Ethereal (catch-all test) if env vars are not set
// ──────────────────────────────────────────
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  ) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: parseInt(process.env.EMAIL_PORT || "587") === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Force IPv4 — Render resolves smtp.gmail.com to IPv6 which is unreachable
      family: 4,
      // Fail fast — don't hang for 90 seconds
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: { rejectUnauthorized: false },
    });
    console.log("Email transporter: SMTP configured (IPv4 forced)");
  } else {
    // Ethereal test account – emails are not delivered, only previewed
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(
      "⚠️  Email transporter: using Ethereal test account (emails not delivered). Set EMAIL_HOST/USER/PASS in .env for real delivery."
    );
  }

  return transporter;
}

// ──────────────────────────────────────────
// Helper: Load & interpolate HTML template
// ──────────────────────────────────────────
function loadTemplate(templateName, variables = {}) {
  const filePath = path.join(TEMPLATES_DIR, templateName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Email template not found: ${templateName}`);
  }

  let html = fs.readFileSync(filePath, "utf-8");

  // Replace {{KEY}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  return html;
}

// ──────────────────────────────────────────
// Core send helper
// ──────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  try {
    const transport = await getTransporter();

    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || '"HabitAI" <noreply@habitai.app>',
      to,
      subject,
      html,
    });

    if (process.env.NODE_ENV !== "production") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📧 Email preview (Ethereal): ${previewUrl}`);
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Email send error:", err.message);
    return { success: false, error: err.message };
  }
}

// ──────────────────────────────────────────
// PUBLIC SEND FUNCTIONS
// ──────────────────────────────────────────

/**
 * Send daily reminder email with list of incomplete habits
 * @param {Object} user - User document
 * @param {Array}  incompleteHabits - Array of habit title strings
 */
export async function sendDailyReminderEmail(user, incompleteHabits) {
  const habitListHtml = incompleteHabits
    .map(
      (title) =>
        `<li style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${title}</li>`
    )
    .join("");

  const html = loadTemplate("dailyReminder.html", {
    USER_NAME: user.name,
    HABIT_COUNT: incompleteHabits.length,
    HABIT_LIST: `<ul style="padding-left:20px;margin:0;">${habitListHtml}</ul>`,
    YEAR: new Date().getFullYear(),
  });

  return sendEmail({
    to: user.email,
    subject: "Don't Break Your Streak 🔥 — HabitAI Daily Reminder",
    html,
  });
}

/**
 * Send weekly progress summary email
 * @param {Object} user - User document
 * @param {Object} stats - { streak, completionRate, bestDay, worstDay, aiRecommendation }
 */
export async function sendWeeklySummaryEmail(user, stats) {
  const html = loadTemplate("weeklySummary.html", {
    USER_NAME: user.name,
    STREAK: stats.streak || 0,
    COMPLETION_RATE: stats.completionRate || 0,
    BEST_DAY: stats.bestDay || "N/A",
    WORST_DAY: stats.worstDay || "N/A",
    AI_RECOMMENDATION: stats.aiRecommendation || "Keep building those habits!",
    YEAR: new Date().getFullYear(),
  });

  return sendEmail({
    to: user.email,
    subject: "Your Weekly HabitAI Progress Report 📊",
    html,
  });
}

/**
 * Send streak-lost recovery email
 * @param {Object} user - User document
 * @param {string} habitTitle - The habit that broke the streak
 */
export async function sendStreakLostEmail(user, habitTitle) {
  const html = loadTemplate("streakLost.html", {
    USER_NAME: user.name,
    HABIT_TITLE: habitTitle,
    YEAR: new Date().getFullYear(),
  });

  return sendEmail({
    to: user.email,
    subject: "Your streak ended — but that's okay 💪 | HabitAI",
    html,
  });
}

/**
 * Send goal achieved celebration email
 * @param {Object} user - User document
 * @param {string} milestone - Description of the achievement
 */
export async function sendGoalAchievedEmail(user, milestone) {
  const html = loadTemplate("goalAchieved.html", {
    USER_NAME: user.name,
    MILESTONE: milestone,
    YEAR: new Date().getFullYear(),
  });

  return sendEmail({
    to: user.email,
    subject: "🏆 You crushed it! Achievement Unlocked — HabitAI",
    html,
  });
}

/**
 * Send email verification link
 * @param {Object} user - User document
 * @param {string} verificationUrl - Full verification link URL
 */
export async function sendVerificationEmail(user, verificationUrl) {
  const html = loadTemplate("verifyEmail.html", {
    USER_NAME: user.name,
    VERIFICATION_URL: verificationUrl,
    YEAR: new Date().getFullYear(),
  });

  return sendEmail({
    to: user.email,
    subject: "Verify Your Email Address — HabitAI",
    html,
  });
}

