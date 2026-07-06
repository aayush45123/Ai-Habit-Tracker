import React, { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CircleAlert, Save, TimerReset } from "lucide-react";
import styles from "./TimetableCheckpointPanel.module.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getTodayDayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

export default function TimetableCheckpointPanel({
  timetable,
  analytics,
  loading,
  onSubmit,
}) {
  const scheduleDays = timetable?.weeklySchedule?.length
    ? timetable.weeklySchedule.map((day) => day.day)
    : DAYS;

  const defaultDay = useMemo(() => {
    const today = getTodayDayName();
    return scheduleDays.includes(today) ? today : scheduleDays[0];
  }, [scheduleDays]);

  const [day, setDay] = useState(defaultDay);
  const [status, setStatus] = useState("correct");
  const [note, setNote] = useState("");

  useEffect(() => {
    setDay(defaultDay);
  }, [defaultDay]);

  const summary = analytics?.summary || {};
  const recentCheckpoints = analytics?.recentCheckpoints || [];

  const handleSubmit = (event) => {
    event.preventDefault();

    const selectedDay = scheduleDays.includes(day) ? day : defaultDay;
    const selectedSchedule = timetable?.weeklySchedule?.find(
      (item) => item.day === selectedDay,
    );

    onSubmit?.({
      day: selectedDay,
      status,
      note,
      focusArea: selectedSchedule?.focusArea || "",
      plannedExercises: (selectedSchedule?.exercises || []).map(
        (exercise) => exercise.name,
      ),
      completedExercises:
        status === "correct"
          ? (selectedSchedule?.exercises || []).map((exercise) => exercise.name)
          : [],
      missedExercises:
        status === "missed"
          ? (selectedSchedule?.exercises || []).map((exercise) => exercise.name)
          : [],
    });

    setNote("");
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.kicker}>Checkpoint</span>
          <h3 className={styles.title}>Workout Confirmation</h3>
          <p className={styles.subtitle}>
            Mark each timetable session as correct or missed and track the
            results over time.
          </p>
        </div>

        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Success Rate</span>
            <strong className={styles.summaryValue}>
              {summary.adherenceRate || 0}%
            </strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Current Streak</span>
            <strong className={styles.summaryValue}>
              {summary.currentStreak || 0}
            </strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Logged</span>
            <strong className={styles.summaryValue}>
              {summary.totalCheckpoints || 0}
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Timetable Day</label>
            <select
              className={styles.select}
              value={day}
              onChange={(event) => setDay(event.target.value)}
            >
              {scheduleDays.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Checkpoint Status</label>
            <div className={styles.segmentedControl}>
              <button
                type="button"
                className={`${styles.segment} ${status === "correct" ? styles.segmentActive : ""}`}
                onClick={() => setStatus("correct")}
              >
                <CalendarCheck2 className={styles.segmentIcon} />
                Correct
              </button>
              <button
                type="button"
                className={`${styles.segment} ${status === "missed" ? styles.segmentMissed : ""}`}
                onClick={() => setStatus("missed")}
              >
                <CircleAlert className={styles.segmentIcon} />
                Missed
              </button>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Note</label>
            <textarea
              className={styles.textarea}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional context for this checkpoint"
              rows={4}
            />
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <TimerReset className={styles.submitIcon} />
                Saving...
              </>
            ) : (
              <>
                <Save className={styles.submitIcon} />
                Save Checkpoint
              </>
            )}
          </button>
        </form>

        <div className={styles.activityPanel}>
          <div className={styles.activityHeader}>
            <h4 className={styles.activityTitle}>Recent Checkpoints</h4>
            <span className={styles.activityCount}>
              {recentCheckpoints.length}
            </span>
          </div>

          {recentCheckpoints.length > 0 ? (
            <div className={styles.activityList}>
              {recentCheckpoints.map((checkpoint) => (
                <div
                  key={`${checkpoint.date}-${checkpoint.day}`}
                  className={styles.activityItem}
                >
                  <div>
                    <strong className={styles.activityDay}>
                      {checkpoint.day}
                    </strong>
                    <p className={styles.activityMeta}>
                      {checkpoint.date} · {checkpoint.focusArea || "General"}
                    </p>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${
                      checkpoint.status === "correct"
                        ? styles.statusCorrect
                        : styles.statusMissed
                    }`}
                  >
                    {checkpoint.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              No checkpoints recorded yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
