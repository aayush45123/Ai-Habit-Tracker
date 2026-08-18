// server/src/services/email.service.js
// Uses Brevo (formerly Sendinblue) SMTP — works on Render, no domain verification needed
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "../templates");

// ──────────────────────────────────────────
// Nodemailer transporter (Brevo SMTP)
// Brevo SMTP is NOT blocked by Render unlike Gmail SMTP
// ──────────────────────────────────────────
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.BREVO_SMTP_LOGIN || process.env.EMAIL_USER;
  const pass = process.env.BREVO_SMTP_KEY  || process.env.EMAIL_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: { user, pass },
      // Force IPv4 — avoids IPv6 resolution issues on cloud hosts
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    console.log("Email service: Brevo SMTP configured");
  } else {
    // Fallback: log warning — email will silently fail but app won't crash
    console.warn(
      "[Email] No SMTP credentials found. Set BREVO_SMTP_LOGIN + BREVO_SMTP_KEY in environment variables."
    );
    // Return a dummy transporter that logs instead of sending
    transporter = {
      sendMail: async (opts) => {
        console.log(`[Email MOCK] Would have sent to: ${opts.to} | Subject: ${opts.subject}`);
        return { messageId: "mock-no-credentials" };
      },
    };
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

    const from = process.env.EMAIL_FROM || "HabitAI <noreply@habitai.app>";

    const info = await transport.sendMail({ from, to, subject, html });

    console.log(`Email sent to ${to} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("Email send error:", err.message);
    return { success: false, error: err.message };
  }
}

// ──────────────────────────────────────────
// PUBLIC SEND FUNCTIONS
// ──────────────────────────────────────────

/**
 * Send daily reminder email with list of incomplete habits
 */
export async function sendDailyReminderEmail(user, incompleteHabits) {
  const habitListHtml = incompleteHabits
    .map((title) => `<li style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${title}</li>`)
    .join("");

  const html = loadTemplate("dailyReminder.html", {
    USER_NAME: user.name,
    HABIT_COUNT: incompleteHabits.length,
    HABIT_LIST: `<ul style="padding-left:20px;margin:0;">${habitListHtml}</ul>`,
    YEAR: new Date().getFullYear(),
  });

  return sendEmail({
    to: user.email,
    subject: "Don't Break Your Streak — HabitAI Daily Reminder",
    html,
  });
}

/**
 * Send weekly progress summary email
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
    subject: "Your Weekly HabitAI Progress Report",
    html,
  });
}

/**
 * Send streak-lost recovery email
 */
export async function sendStreakLostEmail(user, habitTitle) {
  const html = loadTemplate("streakLost.html", {
    USER_NAME: user.name,
    HABIT_TITLE: habitTitle,
    YEAR: new Date().getFullYear(),
  });

  return sendEmail({
    to: user.email,
    subject: "Your streak ended — but that's okay | HabitAI",
    html,
  });
}

/**
 * Send goal achieved celebration email
 */
export async function sendGoalAchievedEmail(user, milestone) {
  const html = loadTemplate("goalAchieved.html", {
    USER_NAME: user.name,
    MILESTONE: milestone,
    YEAR: new Date().getFullYear(),
  });

  return sendEmail({
    to: user.email,
    subject: "Achievement Unlocked — HabitAI",
    html,
  });
}

/**
 * Send email verification link
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
