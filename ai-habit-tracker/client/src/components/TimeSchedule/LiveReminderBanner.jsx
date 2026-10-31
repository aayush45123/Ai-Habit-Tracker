import React, { useState, useEffect } from "react";
import {
  FiClock,
  FiBell,
  FiVolume2,
  FiVolumeX,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import styles from "./TimeSchedule.module.css";
import { formatTime12, playChimeSound, timeToMinutes } from "../../utils/dateHelpers";

export default function LiveReminderBanner({
  activeEvent,
  nextUpcomingEvent,
  onToggleStatus,
  onTriggerNotification,
}) {
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("schedule_sound_chime") !== "false"
  );
  const [notificationPermission, setNotificationPermission] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );
  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // Track clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem("schedule_sound_chime", nextVal ? "true" : "false");
    if (nextVal) {
      playChimeSound();
    }
  };

  const handleRequestNotifications = async () => {
    if ("Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === "granted") {
          new Notification("HabitAI Timetable Alerts", {
            body: "Reminders enabled! You will be notified when your scheduled time slots begin.",
            icon: "/favicon.ico",
          });
        }
      } catch (err) {
        console.error("Error asking notification permission", err);
      }
    }
  };

  if (!activeEvent && !nextUpcomingEvent) {
    return (
      <div className={styles.reminderBanner}>
        <div className={styles.reminderLeft}>
          <div className={styles.idleIcon}>
            <FiClock size={20} />
          </div>
          <div className={styles.reminderContent}>
            <h4 className={styles.reminderTitle}>All Timetable Slots Clear</h4>
            <span className={styles.reminderTime}>
              No events in progress right now. Add a time slot or apply a daily routine to stay on track!
            </span>
          </div>
        </div>

        <div className={styles.reminderRight}>
          <button
            className={`${styles.bannerBtn} ${soundEnabled ? styles.bannerBtnActive : ""}`}
            onClick={handleToggleSound}
            title={soundEnabled ? "Chime Mute" : "Chime Enable"}
          >
            {soundEnabled ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
            <span>{soundEnabled ? "Chime On" : "Chime Muted"}</span>
          </button>
        </div>
      </div>
    );
  }

  // Active event running right now
  if (activeEvent) {
    const endMins = activeEvent.endMinutes;
    const remainingMins = Math.max(0, endMins - nowMinutes);

    return (
      <div className={styles.reminderBanner}>
        <div className={styles.reminderLeft}>
          <div className={styles.pulseIcon}>
            <FiClock size={20} />
          </div>
          <div className={styles.reminderContent}>
            <div className={styles.reminderStatusRow}>
              <span className={styles.liveTag}>Happening Now</span>
              <span className={styles.reminderTime}>
                {formatTime12(activeEvent.startTime)} – {formatTime12(activeEvent.endTime)} ({remainingMins}m remaining)
              </span>
            </div>
            <h4 className={styles.reminderTitle}>{activeEvent.title}</h4>
            {activeEvent.description && (
              <span className={styles.reminderTime}>{activeEvent.description}</span>
            )}
          </div>
        </div>

        <div className={styles.reminderRight}>
          <button
            className={`${styles.bannerBtn} ${styles.bannerBtnActive}`}
            onClick={() => onToggleStatus(activeEvent._id)}
          >
            <FiCheckCircle size={15} />
            <span>Mark Complete</span>
          </button>

          <button
            className={`${styles.bannerBtn} ${soundEnabled ? styles.bannerBtnActive : ""}`}
            onClick={handleToggleSound}
            title={soundEnabled ? "Chime Mute" : "Chime Enable"}
          >
            {soundEnabled ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
          </button>

          {notificationPermission !== "granted" && "Notification" in window && (
            <button
              className={styles.bannerBtn}
              onClick={handleRequestNotifications}
              title="Enable browser alerts"
            >
              <FiBell size={15} />
              <span>Enable Alerts</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Next upcoming event
  const startMins = nextUpcomingEvent.startMinutes;
  const minsUntil = Math.max(0, startMins - nowMinutes);

  return (
    <div className={styles.reminderBanner}>
      <div className={styles.reminderLeft}>
        <div className={styles.idleIcon}>
          <FiClock size={20} />
        </div>
        <div className={styles.reminderContent}>
          <div className={styles.reminderStatusRow}>
            <span className={styles.upcomingTag}>Up Next</span>
            <span className={styles.reminderTime}>
              Starts in {minsUntil > 60 ? `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m` : `${minsUntil} mins`} (at {formatTime12(nextUpcomingEvent.startTime)})
            </span>
          </div>
          <h4 className={styles.reminderTitle}>{nextUpcomingEvent.title}</h4>
        </div>
      </div>

      <div className={styles.reminderRight}>
        <button
          className={`${styles.bannerBtn} ${soundEnabled ? styles.bannerBtnActive : ""}`}
          onClick={handleToggleSound}
          title={soundEnabled ? "Chime Mute" : "Chime Enable"}
        >
          {soundEnabled ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
          <span>{soundEnabled ? "Chime On" : "Chime Muted"}</span>
        </button>

        {notificationPermission !== "granted" && "Notification" in window && (
          <button
            className={styles.bannerBtn}
            onClick={handleRequestNotifications}
            title="Enable browser alerts"
          >
            <FiBell size={15} />
            <span>Enable Alerts</span>
          </button>
        )}
      </div>
    </div>
  );
}

