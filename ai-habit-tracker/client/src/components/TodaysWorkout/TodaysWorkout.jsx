// client/src/components/TodaysWorkout/TodaysWorkout.jsx
import React from "react";
import {
  PlayCircle,
  Clock,
  Flame,
  Target,
  Sun,
  Sunset,
  Moon,
  Lightbulb,
} from "lucide-react";
import styles from "./TodaysWorkout.module.css";

export default function TodaysWorkout({
  workout,
  completedExerciseIds = [],
  completionPercentage = 0,
  onToggleExercise,
  onCompleteWorkout,
}) {
  if (!workout) return null;

  const completedCount = completedExerciseIds.length;
  const totalCount = workout.exercises.length;
  const normalizedCompletion = completionPercentage;

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <PlayCircle className={styles.icon} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>Today's Workout</h3>
            <p className={styles.subtitle}>{workout.day}</p>
          </div>
        </div>

        <div className={styles.badge}>
          {workout.isRestDay ? (
            <span className={styles.restBadge}>Rest Day</span>
          ) : (
            <span className={styles.activeBadge}>{workout.focusArea}</span>
          )}
        </div>
      </div>

      {/* PROGRESS BAR */}
      {!workout.isRestDay && workout.exercises.length > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Exercise Completion</span>
            <span className={styles.progressValue}>
              {normalizedCompletion}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${normalizedCompletion}%` }}
            ></div>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryText}>
              {completedCount} / {totalCount} exercises completed
            </span>
            <span className={styles.summaryText}>
              {normalizedCompletion}% of today's plan
            </span>
          </div>
        </div>
      )}

      {/* TIME BLOCKS */}
      <div className={styles.timeBlocks}>
        <div className={styles.timeBlock}>
          <div className={styles.timeBlockIcon}>
            <Sun />
          </div>
          <div className={styles.timeBlockContent}>
            <span className={styles.timeBlockLabel}>Morning</span>
            <span className={styles.timeBlockText}>
              {workout.timeBlock?.morning || "Rest"}
            </span>
          </div>
        </div>

        <div className={styles.timeBlock}>
          <div className={styles.timeBlockIcon}>
            <Sunset />
          </div>
          <div className={styles.timeBlockContent}>
            <span className={styles.timeBlockLabel}>Evening</span>
            <span className={styles.timeBlockText}>
              {workout.timeBlock?.evening || "Rest"}
            </span>
          </div>
        </div>

        <div className={styles.timeBlock}>
          <div className={styles.timeBlockIcon}>
            <Moon />
          </div>
          <div className={styles.timeBlockContent}>
            <span className={styles.timeBlockLabel}>Night</span>
            <span className={styles.timeBlockText}>
              {workout.timeBlock?.night || "Rest"}
            </span>
          </div>
        </div>
      </div>

      {/* EXERCISES */}
      {!workout.isRestDay && workout.exercises.length > 0 && (
        <div className={styles.exercisesSection}>
          <div className={styles.exercisesHeader}>
            <Target className={styles.exercisesIcon} />
            <h4 className={styles.exercisesTitle}>Exercises</h4>
          </div>

          <div className={styles.exercisesList}>
            {workout.exercises.map((exercise, index) => {
              const exerciseId =
                exercise._id?.toString() || `${workout.day}-${index}`;
              const isCompleted = completedExerciseIds.includes(exerciseId);

              return (
                <div
                  key={exerciseId}
                  className={`${styles.exerciseCard} ${
                    isCompleted ? styles.completed : ""
                  }`}
                  onClick={() => onToggleExercise?.(exerciseId)}
                >
                  <div className={styles.exerciseHeader}>
                    <div className={styles.exerciseNumber}>{index + 1}</div>
                    <h5 className={styles.exerciseName}>{exercise.name}</h5>
                    <div className={styles.exerciseCheck}>
                      <button
                        type="button"
                        className={`${styles.exerciseCheckbox} ${
                          isCompleted ? styles.exerciseCheckboxChecked : ""
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleExercise?.(exerciseId);
                        }}
                        aria-label={`Mark ${exercise.name} as ${
                          isCompleted ? "not completed" : "completed"
                        }`}
                      >
                        {isCompleted ? "☑" : "☐"}
                      </button>
                    </div>
                  </div>

                  <div className={styles.exerciseDetails}>
                    {exercise.sets && (
                      <div className={styles.exerciseDetail}>
                        <Flame className={styles.detailIcon} />
                        <span>
                          <strong>Sets:</strong> {exercise.sets}
                        </span>
                      </div>
                    )}

                    {exercise.reps && (
                      <div className={styles.exerciseDetail}>
                        <Target className={styles.detailIcon} />
                        <span>
                          <strong>Reps:</strong> {exercise.reps}
                        </span>
                      </div>
                    )}

                    {exercise.duration && (
                      <div className={styles.exerciseDetail}>
                        <Clock className={styles.detailIcon} />
                        <span>
                          <strong>Duration:</strong> {exercise.duration}
                        </span>
                      </div>
                    )}
                  </div>

                  {exercise.notes && (
                    <div className={styles.exerciseNotes}>
                      <span>
                        <Lightbulb className={styles.notesIcon} />{" "}
                        {exercise.notes}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.completeButton}
              onClick={() => onCompleteWorkout?.()}
            >
              Complete Workout
            </button>
          </div>
        </div>
      )}

      {/* REST DAY MESSAGE */}
      {workout.isRestDay && (
        <div className={styles.restMessage}>
          <div className={styles.restIcon}>
            <Moon />
          </div>
          <h4 className={styles.restTitle}>Recovery Day</h4>
          <p className={styles.restText}>
            Rest is crucial for muscle growth and recovery. Use this day for
            light activities, stretching, or complete rest.
          </p>
        </div>
      )}
    </div>
  );
}
