// server/src/services/email.service.js
// Uses Brevo Transactional Email API (HTTP) — works on Render, no SMTP ports needed
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "../templates");

// ──────────────────────────────────────────
// Brevo API client
// ──────────────────────────────────────────
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function getBrevoHeaders() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[Email] BREVO_API_KEY is not set. Add it to your environment variables."
    );
  }
  return {
    "api-key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    const safeVal = key === "HABIT_LIST" ? String(value ?? "") : escapeHtml(value);
    html = html.replace(new RegExp(`{{${key}}}`, "g"), safeVal);
  }

  return html;
}

// ──────────────────────────────────────────
// Core send helper — uses Brevo REST API
// ──────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const fromName    = process.env.EMAIL_FROM_NAME    || "HabitAI";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "esanjeevani92@gmail.com";

  const payload = {
    sender:  { name: fromName, email: fromAddress },
    to:      [{ email: to }],
    subject,
    htmlContent: html,
  };

  try {
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: getBrevoHeaders(),
      timeout: 15000,
    });

    const messageId = response.data?.messageId || "brevo-api";
    console.log(`[Email] Sent OK to ${to} | Subject: "${subject}" | ID: ${messageId}`);
    return { success: true, messageId };
  } catch (err) {
    const detail = err.response?.data?.message || err.message;
    console.error(`[Email] FAILED to send to ${to} | Error: ${detail}`);
    throw new Error(detail);
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
    .map((title) => `<li style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${escapeHtml(title)}</li>`)
    .join("");

  const html = loadTemplate("dailyReminder.html", {
    USER_NAME:   user.name,
    HABIT_COUNT: incompleteHabits.length,
    HABIT_LIST:  `<ul style="padding-left:20px;margin:0;">${habitListHtml}</ul>`,
    YEAR:        new Date().getFullYear(),
  });

  return sendEmail({
    to:      user.email,
    subject: "Don't Break Your Streak — HabitAI Daily Reminder",
    html,
  });
}

/**
 * Send weekly progress summary email
 */
export async function sendWeeklySummaryEmail(user, stats) {
  const html = loadTemplate("weeklySummary.html", {
    USER_NAME:         user.name,
    STREAK:            stats.streak || 0,
    COMPLETION_RATE:   stats.completionRate || 0,
    BEST_DAY:          stats.bestDay || "N/A",
    WORST_DAY:         stats.worstDay || "N/A",
    AI_RECOMMENDATION: stats.aiRecommendation || "Keep building those habits!",
    YEAR:              new Date().getFullYear(),
  });

  return sendEmail({
    to:      user.email,
    subject: "Your Weekly HabitAI Progress Report",
    html,
  });
}

/**
 * Send streak-lost recovery email
 */
export async function sendStreakLostEmail(user, habitTitle) {
  const html = loadTemplate("streakLost.html", {
    USER_NAME:   user.name,
    HABIT_TITLE: habitTitle,
    YEAR:        new Date().getFullYear(),
  });

  return sendEmail({
    to:      user.email,
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
    YEAR:      new Date().getFullYear(),
  });

  return sendEmail({
    to:      user.email,
    subject: "Achievement Unlocked — HabitAI",
    html,
  });
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(user, verificationUrl) {
  const html = loadTemplate("verifyEmail.html", {
    USER_NAME:        user.name,
    VERIFICATION_URL: verificationUrl,
    YEAR:             new Date().getFullYear(),
  });

  return sendEmail({
    to:      user.email,
    subject: "Verify Your Email Address — HabitAI",
    html,
  });
}

/**
 * Send secure password reset link (15-min single-use)
 */
export async function sendPasswordResetEmail(user, resetUrl) {
  const html = `
    <div style="font-family:'Sora',sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <h2 style="color:#0f172a;margin-top:0;">Password Reset Request</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;">
        Hello ${user.name || "there"},<br/><br/>
        We received a request to reset the password for your HabitAI account. Click the secure button below to choose a new password:
      </p>
      <div style="margin:28px 0;text-align:center;">
        <a href="${resetUrl}" style="background:#0f172a;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">
          Reset My Password
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.5;">
        This single-use link is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains completely secure.
      </p>
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        © ${new Date().getFullYear()} HabitAI • High Performance Habit Architecture
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: "Password Reset Request — HabitAI",
    html,
  });
}

