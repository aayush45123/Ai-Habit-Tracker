// server/src/utils/getTodayIST.js

/**
 * Get today's date in IST (YYYY-MM-DD format)
 */
export const getTodayIST = () => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 330 * 60000); // Add 5.5 hours in milliseconds
  return istDate.toISOString().split("T")[0];
};

/**
 * Get yesterday's date in IST (YYYY-MM-DD format)
 */
export const getYesterdayIST = () => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 330 * 60000);
  istDate.setDate(istDate.getDate() - 1);
  return istDate.toISOString().split("T")[0];
};

/**
 * Normalize a date to IST (handles various date formats)
 * @param {Date|String} date - Date object or ISO string
 * @returns {String} - Date in YYYY-MM-DD format (IST)
 */
export const normalizeDateIST = (date) => {
  if (!date) return getTodayIST();

  // If it's already a string in YYYY-MM-DD format, return it
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Convert to Date object if string
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Convert to IST
  const istDate = new Date(dateObj.getTime() + 330 * 60000);
  return istDate.toISOString().split("T")[0];
};

/**
 * Get date N days ago in IST
 * @param {Number} daysAgo - Number of days to go back
 * @returns {String} - Date in YYYY-MM-DD format (IST)
 */
export const getDaysAgoIST = (daysAgo) => {
  const now = new Date();
  const istDate = new Date(now.getTime() + 330 * 60000);
  istDate.setDate(istDate.getDate() - daysAgo);
  return istDate.toISOString().split("T")[0];
};

/**
 * Check if two dates are consecutive (exactly 1 day apart)
 * @param {String} date1 - First date (YYYY-MM-DD)
 * @param {String} date2 - Second date (YYYY-MM-DD)
 * @returns {Boolean}
 */
export const areConsecutiveDays = (date1, date2) => {
  const d1 = new Date(date1 + "T00:00:00Z");
  const d2 = new Date(date2 + "T00:00:00Z");

  const diffMs = Math.abs(d2 - d1);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays === 1;
};

/**
 * Get current IST time as Date object
 */
export const getCurrentISTDate = () => {
  const now = new Date();
  return new Date(now.getTime() + 330 * 60000);
};
