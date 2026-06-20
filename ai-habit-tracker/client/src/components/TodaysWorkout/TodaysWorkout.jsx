// client/src/components/TodaysWorkout/TodaysWorkout.jsx
import React, { useState } from "react";
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  Flame,
  Target,
  Sun,
  Sunset,
  Moon,
  Lightbulb,
} from "lucide-react";
import styles from "./TodaysWorkout.module.css";

export default function TodaysWorkout({ workout }) {
  const [completedExercises, setCompletedExercises] = useState([]);

  if (!workout) return null;

  const toggleExercise = (index) => {
    if (completedExercises.includes(index)) {
      setCompletedExercises(completedExercises.filter((i) => i !== index));
    } else {
      setCompletedExercises([...completedExercises, index]);
    }
  };

  const completionPercentage =
    workout.exercises.length > 0
      ? Math.round((completedExercises.length / workout.exercises.length) * 100)
      : 0;

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
            <span className={styles.progressLabel}>Completion</span>
            <span className={styles.progressValue}>
              {completionPercentage}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${completionPercentage}%` }}
            ></div>
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
            {workout.exercises.map((exercise, index) => (
              <div
                key={index}
                className={`${styles.exerciseCard} ${
                  completedExercises.includes(index) ? styles.completed : ""
                }`}
                onClick={() => toggleExercise(index)}
              >
                <div className={styles.exerciseHeader}>
                  <div className={styles.exerciseNumber}>{index + 1}</div>
                  <h5 className={styles.exerciseName}>{exercise.name}</h5>
                  <div className={styles.exerciseCheck}>
                    {completedExercises.includes(index) ? (
                      <CheckCircle2 className={styles.checkIcon} />
                    ) : (
                      <div className={styles.emptyCheck}></div>
                    )}
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
            ))}
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
