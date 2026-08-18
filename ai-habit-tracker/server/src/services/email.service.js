// server/src/services/email.service.js
// Uses Resend (HTTPS API) — bypasses SMTP port blocks on Render/cloud hosts
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "../templates");

// ──────────────────────────────────────────
// Resend client (lazy init)
// ──────────────────────────────────────────
let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set in environment variables. Get a free key at https://resend.com"
    );
  }
  resendClient = new Resend(apiKey);
  console.log("Email service: Resend configured");
  return resendClient;
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
// Core send helper (Resend HTTP API)
// ──────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  try {
    const client = getResendClient();

    // Resend requires a verified domain "from" address.
    // Until domain is verified, use "onboarding@resend.dev" (only delivers to your own verified email).
    // After verifying your domain at resend.com, change this to your own domain email.
    const from = process.env.EMAIL_FROM || "HabitAI <onboarding@resend.dev>";

    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error.message);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully. ID:", data?.id);
    return { success: true, messageId: data?.id };
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
    subject: "Don't Break Your Streak — HabitAI Daily Reminder",
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
    subject: "Your Weekly HabitAI Progress Report",
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
    subject: "Your streak ended — but that's okay | HabitAI",
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
    subject: "Achievement Unlocked — HabitAI",
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
