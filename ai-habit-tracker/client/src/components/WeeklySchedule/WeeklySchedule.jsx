// client/src/components/WeeklySchedule/WeeklySchedule.jsx
import React, { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  Flame,
  Award,
} from "lucide-react";
import styles from "./WeeklySchedule.module.css";

export default function WeeklySchedule({
  schedule,
  goal,
  level,
  timeAvailable,
  checkpointStatusByDay = {},
}) {
  const [expandedDays, setExpandedDays] = useState([]);

  const toggleDay = (day) => {
    if (expandedDays.includes(day)) {
      setExpandedDays(expandedDays.filter((d) => d !== day));
    } else {
      setExpandedDays([...expandedDays, day]);
    }
  };

  const getDayOfWeek = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[new Date().getDay()];
  };

  const currentDay = getDayOfWeek();

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Calendar className={styles.headerIcon} />
          <div className={styles.headerText}>
            <h3 className={styles.title}>Weekly Schedule</h3>
            <p className={styles.subtitle}>Your 7-day workout plan</p>
          </div>
        </div>

        <div className={styles.headerStats}>
          <div className={styles.stat}>
            <Target className={styles.statIcon} />
            <span className={styles.statLabel}>
              {goal.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <div className={styles.stat}>
            <Award className={styles.statIcon} />
            <span className={styles.statLabel}>{level.toUpperCase()}</span>
          </div>
          <div className={styles.stat}>
            <Clock className={styles.statIcon} />
            <span className={styles.statLabel}>{timeAvailable} min</span>
          </div>
        </div>
      </div>

      {/* DAYS */}
      <div className={styles.daysList}>
        {schedule.map((daySchedule, index) => {
          const isExpanded = expandedDays.includes(daySchedule.day);
          const isToday = daySchedule.day === currentDay;

          return (
            <div
              key={index}
              className={`${styles.dayCard} ${isToday ? styles.today : ""} ${
                daySchedule.isRestDay ? styles.restDay : ""
              }`}
            >
              {/* DAY HEADER */}
              <div
                className={styles.dayHeader}
                onClick={() => toggleDay(daySchedule.day)}
              >
                <div className={styles.dayHeaderLeft}>
                  <div className={styles.dayNumber}>{index + 1}</div>
                  <div className={styles.dayInfo}>
                    <h4 className={styles.dayName}>{daySchedule.day}</h4>
                    <span className={styles.dayFocus}>
                      {daySchedule.focusArea}
                    </span>
                  </div>
                </div>

                <div className={styles.dayHeaderRight}>
                  {checkpointStatusByDay[daySchedule.day] && (
                    <span
                      className={`${styles.checkpointBadge} ${
                        checkpointStatusByDay[daySchedule.day].status ===
                        "correct"
                          ? styles.correctCheckpoint
                          : styles.missedCheckpoint
                      }`}
                    >
                      {checkpointStatusByDay[daySchedule.day].status ===
                      "correct"
                        ? "CHECKED"
                        : "MISSED"}
                    </span>
                  )}
                  {isToday && <span className={styles.todayBadge}>TODAY</span>}
                  {daySchedule.isRestDay && (
                    <span className={styles.restBadge}>REST</span>
                  )}
                  <div className={styles.expandIcon}>
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </div>

              {/* EXPANDED CONTENT */}
              {isExpanded && (
                <div className={styles.dayContent}>
                  {/* TIME BLOCKS */}
                  <div className={styles.timeBlocksGrid}>
                    <div className={styles.timeBlockItem}>
                      <span className={styles.timeBlockLabel}>Morning</span>
                      <span className={styles.timeBlockValue}>
                        {daySchedule.timeBlock?.morning || "Rest"}
                      </span>
                    </div>
                    <div className={styles.timeBlockItem}>
                      <span className={styles.timeBlockLabel}>Evening</span>
                      <span className={styles.timeBlockValue}>
                        {daySchedule.timeBlock?.evening || "Rest"}
                      </span>
                    </div>
                    <div className={styles.timeBlockItem}>
                      <span className={styles.timeBlockLabel}>Night</span>
                      <span className={styles.timeBlockValue}>
                        {daySchedule.timeBlock?.night || "Rest"}
                      </span>
                    </div>
                  </div>

                  {/* EXERCISES */}
                  {!daySchedule.isRestDay &&
                    daySchedule.exercises.length > 0 && (
                      <div className={styles.exercisesSection}>
                        <div className={styles.exercisesHeader}>
                          <Flame className={styles.exercisesIcon} />
                          <span className={styles.exercisesTitle}>
                            Exercises ({daySchedule.exercises.length})
                          </span>
                        </div>

                        <div className={styles.exercisesGrid}>
                          {daySchedule.exercises.map((exercise, exIndex) => (
                            <div key={exIndex} className={styles.exerciseItem}>
                              <div className={styles.exerciseTop}>
                                <span className={styles.exerciseNum}>
                                  {exIndex + 1}
                                </span>
                                <span className={styles.exerciseName}>
                                  {exercise.name}
                                </span>
                              </div>

                              <div className={styles.exerciseSpecs}>
                                {exercise.sets && (
                                  <span className={styles.spec}>
                                    {exercise.sets} sets
                                  </span>
                                )}
                                {exercise.reps && (
                                  <span className={styles.spec}>
                                    {exercise.reps} reps
                                  </span>
                                )}
                                {exercise.duration && (
                                  <span className={styles.spec}>
                                    {exercise.duration}
                                  </span>
                                )}
                              </div>

                              {exercise.notes && (
                                <div className={styles.exerciseNotes}>
                                  {exercise.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* REST DAY INFO */}
                  {daySchedule.isRestDay && (
                    <div className={styles.restDayInfo}>
                      <p>
                        Active recovery day. Focus on stretching, light walking,
                        or complete rest to allow muscles to recover and grow.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
