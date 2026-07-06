import React from "react";
import {
  CheckCircle2,
  Clock3,
  ListChecks,
  Save,
  ShieldAlert,
} from "lucide-react";
import styles from "./TimetableCheckpointPanel.module.css";

const STATUS_OPTIONS = [
  { value: "completed", label: "Complete" },
  { value: "partial", label: "Partial" },
  { value: "missed", label: "Missed" },
  { value: "rest", label: "Rest Day" },
];

export default function TimetableCheckpointPanel({
  workoutLog,
  workout,
  analytics,
  loading,
  completedExerciseIds = [],
  completionPercentage = 0,
  draftStatus = "partial",
  draftNote = "",
  draftDuration = 0,
  onStatusChange,
  onNoteChange,
  onDurationChange,
  onSubmit,
}) {
  const totalExercises = workout?.exercises?.length || 0;
  const completedCount = completedExerciseIds.length;
  const status = workout?.isRestDay ? "rest" : draftStatus;
  const isRestDay = workout?.isRestDay;
  const summary = analytics?.summary || {};

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      status,
      note: draftNote,
      actualDuration: Number(draftDuration) || 0,
    });
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.kicker}>Workout Log</span>
          <h3 className={styles.title}>Daily Workout Checkpoint</h3>
          <p className={styles.subtitle}>
            Finalize today's workout with a stored log. Every submit updates the
            timetable record and the analytics below.
          </p>
        </div>

        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Weekly Adherence</span>
            <strong className={styles.summaryValue}>
              {summary.weeklyAdherence || 0}%
            </strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Current Streak</span>
            <strong className={styles.summaryValue}>
              {summary.currentWorkoutStreak || 0}
            </strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Missed Workouts</span>
            <strong className={styles.summaryValue}>
              {summary.missedWorkouts || 0}
            </strong>
          </div>
        </div>
      </div>

      <form className={styles.body} onSubmit={handleSubmit}>
        <div className={styles.form}>
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <div>
                <span className={styles.progressLabel}>
                  Exercises Completed
                </span>
                <h4 className={styles.progressTitle}>
                  {completedCount} / {totalExercises}
                </h4>
              </div>
              <div className={styles.percentBadge}>{completionPercentage}%</div>
            </div>

            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className={styles.statusGroup}>
            <label className={styles.label}>Workout Status</label>
            <div className={styles.statusGrid}>
              {STATUS_OPTIONS.map((option) => {
                const isActive = status === option.value;
                const disabled = isRestDay && option.value !== "rest";

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.statusButton} ${
                      isActive ? styles.statusButtonActive : ""
                    } ${disabled ? styles.statusButtonDisabled : ""}`}
                    onClick={() => onStatusChange?.(option.value)}
                    disabled={disabled}
                  >
                    {option.value === "completed" && (
                      <CheckCircle2 className={styles.statusIcon} />
                    )}
                    {option.value === "partial" && (
                      <ListChecks className={styles.statusIcon} />
                    )}
                    {option.value === "missed" && (
                      <ShieldAlert className={styles.statusIcon} />
                    )}
                    {option.value === "rest" && (
                      <Clock3 className={styles.statusIcon} />
                    )}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Actual Duration (minutes)</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="1"
              value={draftDuration}
              onChange={(event) =>
                onDurationChange?.(Number(event.target.value) || 0)
              }
              placeholder="0"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Optional Note</label>
            <textarea
              className={styles.textarea}
              value={draftNote}
              onChange={(event) => onNoteChange?.(event.target.value)}
              placeholder="Could not complete calves due to time"
              rows={4}
            />
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={loading}
          >
            <Save className={styles.submitIcon} />
            {isRestDay ? "Save Rest Day" : "Complete Workout"}
          </button>
        </div>

        <div className={styles.activityPanel}>
          <div className={styles.activityHeader}>
            <h4 className={styles.activityTitle}>Current Log Snapshot</h4>
            <span className={styles.activityCount}>
              {workoutLog?.status || status}
            </span>
          </div>

          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <div>
                <strong className={styles.activityDay}>Scheduled Day</strong>
                <p className={styles.activityMeta}>
                  {workout?.day || workoutLog?.scheduledDay || "Today"}
                </p>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div>
                <strong className={styles.activityDay}>Status</strong>
                <p className={styles.activityMeta}>
                  {isRestDay ? "Rest day" : status.toUpperCase()}
                </p>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div>
                <strong className={styles.activityDay}>Completion</strong>
                <p className={styles.activityMeta}>{completionPercentage}%</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
