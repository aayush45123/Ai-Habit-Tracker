// client/src/components/NotificationBanner/NotificationBanner.jsx
import React, { useState, useEffect } from "react";
import { Bell, BellOff, Check, X, AlertCircle, BellRing } from "lucide-react";
import notificationService from "../../utils/notificationService";
import styles from "./NotificationBanner.module.css";

export default function NotificationBanner({ challenge, days }) {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  useEffect(() => {
    // Start monitoring if permission is granted and challenge exists
    if (challenge && days && permissionStatus?.granted) {
      notificationService.startMonitoring(challenge, days);
    }

    return () => {
      notificationService.stopMonitoring();
    };
  }, [challenge, days, permissionStatus]);

  const checkPermissionStatus = () => {
    const status = notificationService.getPermissionStatus();
    setPermissionStatus(status);

    // Show banner if notifications are supported but not granted
    if (status.supported && !status.granted && !status.denied) {
      setShowBanner(true);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);

    try {
      const granted = await notificationService.requestPermission();

      if (granted) {
        // Send test notification
        await notificationService.sendTestNotification();

        // Update status
        checkPermissionStatus();
        setShowBanner(false);

        // Start monitoring immediately
        if (challenge && days) {
          notificationService.startMonitoring(challenge, days);
        }
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Store dismissal in localStorage to not show again this session
    localStorage.setItem("notification-banner-dismissed", "true");
  };

  // Don't show if dismissed this session
  useEffect(() => {
    const dismissed = localStorage.getItem("notification-banner-dismissed");
    if (dismissed === "true") {
      setShowBanner(false);
    }
  }, []);

  if (!permissionStatus?.supported) {
    return null;
  }

  // Banner for requesting permission
  if (showBanner && !permissionStatus.granted) {
    return (
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
          <Bell className={styles.icon} />
        </div>

        <div className={styles.bannerContent}>
          <h4 className={styles.bannerTitle}>Enable Habit Reminders</h4>
          <p className={styles.bannerText}>
            Get notified 15 minutes before your habit deadlines to stay on
            track!
          </p>
        </div>

        <div className={styles.bannerActions}>
          <button
            className={styles.enableBtn}
            onClick={handleEnableNotifications}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                <span>Enabling...</span>
              </>
            ) : (
              <>
                <Bell className={styles.btnIcon} />
                <span>Enable Notifications</span>
              </>
            )}
          </button>

          <button
            className={styles.dismissBtn}
            onClick={handleDismiss}
            disabled={isLoading}
          >
            <X className={styles.btnIcon} />
          </button>
        </div>
      </div>
    );
  }

  // Status indicator when notifications are enabled
  if (permissionStatus.granted) {
    return (
      <div className={styles.statusBanner}>
        <div className={styles.statusIcon}>
          <Check className={styles.icon} />
        </div>
        <div className={styles.statusContent}>
          <span className={styles.statusText}>
            <BellRing className={styles.inlineIcon} /> Notifications Enabled
          </span>
          <span className={styles.statusSubtext}>
            You'll receive reminders for upcoming habit deadlines
          </span>
        </div>
      </div>
    );
  }

  // Warning if notifications are blocked
  if (permissionStatus.denied) {
    return (
      <div className={styles.warningBanner}>
        <div className={styles.warningIcon}>
          <BellOff className={styles.icon} />
        </div>
        <div className={styles.warningContent}>
          <span className={styles.warningText}>Notifications Blocked</span>
          <span className={styles.warningSubtext}>
            Enable notifications in your browser settings to receive habit
            reminders
          </span>
        </div>
        <AlertCircle className={styles.alertIcon} />
      </div>
    );
  }

  return null;
}
