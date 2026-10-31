// client/src/utils/dateHelpers.js

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateISO(d = new Date()) {
  const date = typeof d === "string" ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get human-readable friendly date: e.g. "Wednesday, Oct 28, 2026"
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format 24h "HH:mm" string to 12h "hh:mm AM/PM"
 */
export function formatTime12(time24) {
  if (!time24 || typeof time24 !== "string") return "";
  const parts = time24.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  if (isNaN(hours)) return time24;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Convert "HH:mm" to minutes from 00:00
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convert minutes from 00:00 to "HH:mm"
 */
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Calculate formatted duration string between two 24h time strings
 * e.g., "09:00" and "10:30" => "1h 30m"
 */
export function calculateDuration(startTime, endTime) {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const diff = Math.max(0, endMins - startMins);

  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get days array for the week containing `targetDateStr` (Monday to Sunday)
 */
export function getWeekDays(targetDateStr = formatDateISO()) {
  const [y, m, d] = targetDateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);

  // Day of week: 0 is Sun, 1 is Mon, ..., 6 is Sat
  const dayOfWeek = target.getDay();
  // We want week starting on Monday
  const distanceToMonday = (dayOfWeek + 6) % 7;

  const monday = new Date(target);
  monday.setDate(target.getDate() - distanceToMonday);

  const days = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const dateStr = formatDateISO(cur);
    days.push({
      dateStr,
      dayName: dayNames[i],
      dayNumber: cur.getDate(),
      monthNumber: cur.getMonth() + 1,
      isToday: dateStr === formatDateISO(),
      isSelected: dateStr === targetDateStr,
    });
  }

  return days;
}

/**
 * Check if the current clock time is between startTime and endTime for today
 */
export function isCurrentTimeInRange(startTime, endTime, targetDateStr = formatDateISO()) {
  if (targetDateStr !== formatDateISO()) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  return currentMinutes >= startMins && currentMinutes < endMins;
}

/**
 * Audio chime generator using browser Web Audio API
 * Plays a pleasant modern double-tone chime
 */
export function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch (err) {
    // Ignore audio permission/context errors silently
  }
}

