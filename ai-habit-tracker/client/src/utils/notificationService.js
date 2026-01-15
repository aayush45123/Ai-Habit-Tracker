// client/src/utils/notificationService.js

class NotificationService {
  constructor() {
    this.permission = Notification.permission;
    this.isSupported = "Notification" in window;
    this.serviceWorkerRegistration = null;
    this.checkInterval = null;
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported() {
    return this.isSupported;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn("Notifications are not supported in this browser");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;

      if (permission === "granted") {
        console.log("✅ Notification permission granted");
        await this.registerServiceWorker();
        return true;
      } else if (permission === "denied") {
        console.warn("❌ Notification permission denied");
        return false;
      } else {
        console.log("⏸️ Notification permission dismissed");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  /**
   * Register service worker for background notifications
   */
  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js",
          { scope: "/" }
        );

        this.serviceWorkerRegistration = registration;
        console.log("✅ Service Worker registered:", registration);

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("✅ Service Worker is ready");

        return registration;
      } catch (error) {
        console.error("❌ Service Worker registration failed:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Show immediate notification (for testing or immediate alerts)
   */
  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== "granted") {
      console.warn("Cannot show notification: permission not granted");
      return false;
    }

    const defaultOptions = {
      icon: "/logo192.png",
      badge: "/logo192.png",
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: "habit-reminder",
    };

    const notificationOptions = { ...defaultOptions, ...options };

    try {
      if (this.serviceWorkerRegistration) {
        // Use service worker for persistent notifications
        await this.serviceWorkerRegistration.showNotification(
          title,
          notificationOptions
        );
      } else {
        // Fallback to direct notification
        new Notification(title, notificationOptions);
      }
      return true;
    } catch (error) {
      console.error("Error showing notification:", error);
      return false;
    }
  }

  /**
   * Calculate time until deadline in minutes
   */
  calculateTimeUntilDeadline(endTime) {
    const now = new Date();
    const [endHour, endMin] = endTime.split(":").map(Number);

    const deadline = new Date();
    deadline.setHours(endHour, endMin, 0, 0);

    // If deadline is in the past today, it might be for tomorrow (midnight-spanning)
    if (deadline < now) {
      deadline.setDate(deadline.getDate() + 1);
    }

    const diffMs = deadline - now;
    const diffMinutes = Math.floor(diffMs / 60000);

    return diffMinutes;
  }

  /**
   * Check if habit needs a reminder (15 minutes before deadline)
   */
  shouldSendReminder(habit, status, hasLog) {
    // Don't send if already done
    if (hasLog || status === "done") return false;

    // Only send for ongoing habits
    if (status !== "ongoing") return false;

    const minutesUntilDeadline = this.calculateTimeUntilDeadline(habit.endTime);

    // Send reminder if 10-15 minutes remaining
    return minutesUntilDeadline > 10 && minutesUntilDeadline <= 15;
  }

  /**
   * Check if habit deadline is imminent (5 minutes or less)
   */
  isDeadlineImminent(habit, status, hasLog) {
    if (hasLog || status === "done") return false;
    if (status !== "ongoing") return false;

    const minutesUntilDeadline = this.calculateTimeUntilDeadline(habit.endTime);

    // Urgent if 5 minutes or less
    return minutesUntilDeadline > 0 && minutesUntilDeadline <= 5;
  }

  /**
   * Monitor active challenge and send notifications
   */
  async startMonitoring(challenge, days) {
    if (!challenge || !days || days.length === 0) {
      console.log("No active challenge to monitor");
      return;
    }

    // Clear existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    console.log("🔔 Starting habit monitoring for notifications...");

    // Check immediately
    this.checkHabitsAndNotify(challenge, days);

    // Check every 2 minutes
    this.checkInterval = setInterval(() => {
      this.checkHabitsAndNotify(challenge, days);
    }, 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("🔕 Stopped habit monitoring");
    }
  }

  /**
   * Check all habits and send notifications if needed
   */
  async checkHabitsAndNotify(challenge, days) {
    if (this.permission !== "granted") return;

    const today = new Date().toISOString().split("T")[0];
    const todayData = days.find((d) => d.date === today);

    if (!todayData) return;

    challenge.habits.forEach((habit, index) => {
      const status = todayData.statuses[index];
      const hasLog = status === "done";

      // Check for 15-minute reminder
      if (this.shouldSendReminder(habit, status, hasLog)) {
        const minutesLeft = this.calculateTimeUntilDeadline(habit.endTime);

        this.showNotification(`⏰ Habit Reminder: ${habit.title}`, {
          body: `You have ${minutesLeft} minutes left to complete this habit!`,
          icon: "/logo192.png",
          tag: `habit-reminder-${index}`,
          data: { habitIndex: index, challengeId: challenge._id },
          actions: [
            { action: "open", title: "Mark as Done" },
            { action: "dismiss", title: "Dismiss" },
          ],
        });

        console.log(`🔔 Sent reminder for: ${habit.title}`);
      }

      // Check for urgent 5-minute alert
      if (this.isDeadlineImminent(habit, status, hasLog)) {
        const minutesLeft = this.calculateTimeUntilDeadline(habit.endTime);

        this.showNotification(`🚨 URGENT: ${habit.title}`, {
          body: `Only ${minutesLeft} minutes left! Complete your habit now!`,
          icon: "/logo192.png",
          tag: `habit-urgent-${index}`,
          requireInteraction: true,
          data: { habitIndex: index, challengeId: challenge._id, urgent: true },
          vibrate: [200, 100, 200, 100, 200],
          actions: [
            { action: "open", title: "Mark as Done Now" },
            { action: "dismiss", title: "Dismiss" },
          ],
        });

        console.log(`🚨 Sent urgent alert for: ${habit.title}`);
      }
    });
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus() {
    return {
      granted: this.permission === "granted",
      denied: this.permission === "denied",
      default: this.permission === "default",
      supported: this.isSupported,
    };
  }

  /**
   * Send a test notification
   */
  async sendTestNotification() {
    return this.showNotification("✅ Notifications Enabled!", {
      body: "You will now receive reminders for your habits.",
      icon: "/logo192.png",
      tag: "test-notification",
    });
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
