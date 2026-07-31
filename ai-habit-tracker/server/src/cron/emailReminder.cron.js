// server/src/cron/emailReminder.cron.js
import cron from "node-cron";
import User from "../models/User.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import {
  sendDailyReminderEmail,
  sendWeeklySummaryEmail,
} from "../services/email.service.js";
import { getTodayIST } from "../utils/getTodayIST.js";

// ──────────────────────────────────────────
// Get IST hour in HH:MM format
// ──────────────────────────────────────────
function getCurrentISTTime() {
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60000);
  const hh = String(ist.getUTCHours()).padStart(2, "0");
  const mm = String(ist.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getCurrentISTHour() {
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60000);
  return ist.getUTCHours();
}

// ──────────────────────────────────────────
// Core Logic: Find incomplete habits & send
// ──────────────────────────────────────────
async function processUserReminders(users) {
  const todayISO = getTodayIST();
  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      // Fetch all habits for this user
      const habits = await Habit.find({ userId: user._id });

      if (!habits.length) {
        skipped++;
        continue;
      }

      // Find today's log for each habit
      const todayLogs = await HabitLog.find({
        habitId: { $in: habits.map((h) => h._id) },
        date: todayISO,
      });

      const doneIds = new Set(
        todayLogs
          .filter((l) => l.status === "done")
          .map((l) => l.habitId.toString())
      );

      // Filter incomplete habits
      const incomplete = habits.filter(
        (h) => !doneIds.has(h._id.toString())
      );

      if (!incomplete.length) {
        skipped++;
        console.log(`✅ ${user.email}: All habits done. Skipping reminder.`);
        continue;
      }

      const titles = incomplete.map((h) => h.title);
      const result = await sendDailyReminderEmail(user, titles);

      if (result.success) {
        sent++;
        console.log(
          `📧 Reminder sent to ${user.email} (${titles.length} habits pending)`
        );
      } else {
        skipped++;
        console.error(
          `❌ Failed to send reminder to ${user.email}:`,
          result.error
        );
      }
    } catch (err) {
      console.error(`❌ Error processing reminder for ${user.email}:`, err.message);
      skipped++;
    }
  }

  console.log(`📊 Reminder run complete: ${sent} sent, ${skipped} skipped`);
}

// ──────────────────────────────────────────
// DAILY REMINDER CRON (Runs every hour, IST)
// Checks which users have their dailyReminderTime set to the current hour
// e.g. user sets "20:00" → email is sent when IST hour is 20
// ──────────────────────────────────────────
export function scheduleDailyReminderCron() {
  cron.schedule(
    "0 * * * *", // Every hour
    async () => {
      const currentHour = getCurrentISTHour();
      console.log(`\n⏰ Hourly email check — current IST hour: ${currentHour}`);

      try {
        // Find all users with reminders enabled
        const eligibleUsers = await User.find({
          emailNotifications: true,
          isReminderEnabled: true,
          isActive: true,
        });

        // Filter users whose reminder time matches this hour
        const dueUsers = eligibleUsers.filter((user) => {
          if (!user.dailyReminderTime) return false;
          const [hh] = user.dailyReminderTime.split(":");
          return parseInt(hh) === currentHour;
        });

        if (!dueUsers.length) {
          console.log(`No users scheduled for hour ${currentHour}`);
          return;
        }

        console.log(
          `📬 Processing ${dueUsers.length} users for hour ${currentHour}`
        );
        await processUserReminders(dueUsers);
      } catch (err) {
        console.error("❌ Daily reminder cron error:", err.message);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("📅 Daily email reminder cron scheduled (runs every hour IST)");
}

// ──────────────────────────────────────────
// WEEKLY SUMMARY CRON (Every Sunday at 9 AM IST)
// ──────────────────────────────────────────
export function scheduleWeeklySummaryCron() {
  cron.schedule(
    "0 9 * * 0", // Sunday 9:00 AM IST
    async () => {
      console.log("\n📊 Running weekly summary email job...");

      try {
        const users = await User.find({
          emailNotifications: true,
          isReminderEnabled: true,
          isActive: true,
        });

        let sent = 0;

        for (const user of users) {
          try {
            const habits = await Habit.find({ userId: user._id });
            if (!habits.length) continue;

            // Get stats for last 7 days
            const maxStreak = Math.max(...habits.map((h) => h.streak || 0), 0);
            const allDone = habits.filter(
              (h) =>
                h.lastStatus === "done" &&
                h.lastDate === getTodayIST()
            ).length;
            const completionRate =
              habits.length > 0
                ? Math.round((allDone / habits.length) * 100)
                : 0;

            const stats = {
              streak: maxStreak,
              completionRate,
              bestDay: "Monday",
              worstDay: "Sunday",
              aiRecommendation:
                "Focus on building consistency — even a 5-minute commitment is better than skipping.",
            };

            const result = await sendWeeklySummaryEmail(user, stats);
            if (result.success) {
              sent++;
              console.log(`📊 Weekly summary sent to ${user.email}`);
            }
          } catch (err) {
            console.error(`❌ Weekly summary error for ${user.email}:`, err.message);
          }
        }

        console.log(`📊 Weekly summary complete: ${sent} emails sent`);
      } catch (err) {
        console.error("❌ Weekly summary cron error:", err.message);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("📅 Weekly summary cron scheduled (every Sunday 9:00 AM IST)");
}
