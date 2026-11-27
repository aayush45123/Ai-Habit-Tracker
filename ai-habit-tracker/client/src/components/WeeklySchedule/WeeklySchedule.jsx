// client/src/components/WeeklySchedule/WeeklySchedule.jsx
import React, { useState, useMemo } from "react";
import {
  Calendar,
  Target,
  Clock,
  Flame,
  Award,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Moon,
} from "lucide-react";
import styles from "./WeeklySchedule.module.css";

const ORDERED_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getWeekDates(weekOffset = 0) {
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayIdx + weekOffset * 7);

  return ORDERED_DAYS.map((dayName, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    return {
      dayName,
      shortLabel: d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
      isToday,
    };
  });
}

export default function WeeklySchedule({
  schedule = [],
  goal = "",
  level = "",
  timeAvailable = 60,
  checkpointStatusByDay = {},
}) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const currentDay = daysOfWeek[new Date().getDay()];

  const [viewMode, setViewMode] = useState("week"); // "week" | "day"
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayName, setSelectedDayName] = useState(currentDay);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const scheduleByDay = useMemo(() => {
    const map = {};
    for (const item of schedule) {
      map[item.day] = item;
    }
    return map;
  }, [schedule]);

  const weekRangeLabel = useMemo(() => {
    if (weekDates.length < 7) return "";
    return `${weekDates[0].shortLabel} – ${weekDates[6].shortLabel}`;
  }, [weekDates]);

  const activeDaySchedule = scheduleByDay[selectedDayName] || schedule[0];

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Calendar className={styles.headerIcon} />
          <div className={styles.headerText}>
            <h3 className={styles.title}>Training Schedule</h3>
            <p className={styles.subtitle}>
              Structured 7-day workout & recovery calendar
            </p>
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

      {/* CALENDAR TOOLBAR (Gymerleen-style Monochrome) */}
      <div className={styles.calendarToolbar}>
        <div className={styles.viewToggleGroup}>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${
              viewMode === "day" ? styles.viewToggleBtnActive : ""
            }`}
            onClick={() => setViewMode("day")}
          >
            Day
          </button>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${
              viewMode === "week" ? styles.viewToggleBtnActive : ""
            }`}
            onClick={() => setViewMode("week")}
          >
            Week
          </button>
        </div>

        <div className={styles.weekNavGroup}>
          <button
            type="button"
            className={styles.weekNavBtn}
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={styles.weekRangeBadge}
            onClick={() => setWeekOffset(0)}
            title="Jump to current week"
          >
            {weekRangeLabel}
          </button>
          <button
            type="button"
            className={styles.weekNavBtn}
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* WEEK 7-COLUMN CALENDAR GRID */}
      {viewMode === "week" && (
        <div className={styles.calendarScrollWrap}>
          <div className={styles.calendarGrid7}>
            {weekDates.map((dInfo) => {
              const dayItem = scheduleByDay[dInfo.dayName];
              const isSelected = selectedDayName === dInfo.dayName;
              const cp = checkpointStatusByDay[dInfo.dayName];
              const statusText = cp?.status
                ? cp.status.toUpperCase()
                : dayItem?.isRestDay
                ? "REST"
                : "PLANNED";

              return (
                <div
                  key={dInfo.dayName}
                  className={`${styles.calendarCol} ${
                    dInfo.isToday ? styles.calendarColToday : ""
                  } ${isSelected ? styles.calendarColSelected : ""}`}
                >
                  <div className={styles.calendarColHeader}>
                    <span className={styles.calendarColDate}>{dInfo.shortLabel}</span>
                    {dInfo.isToday && <span className={styles.todayDot} />}
                  </div>

                  {dInfo.isToday && <div className={styles.todayVerticalLine} />}

                  <div className={styles.calendarColBody}>
                    {dayItem ? (
                      <button
                        type="button"
                        onClick={() => setSelectedDayName(dInfo.dayName)}
                        className={`${styles.workoutGridCard} ${
                          dayItem.isRestDay ? styles.workoutGridCardRest : ""
                        } ${isSelected ? styles.workoutGridCardActive : ""}`}
                      >
                        <div className={styles.workoutGridCardTop}>
                          <span className={styles.workoutGridCardTitle}>
                            {dayItem.isRestDay
                              ? "Rest & Recovery"
                              : dayItem.focusArea || "Training Session"}
                          </span>
                          {dayItem.isRestDay ? (
                            <Moon size={14} />
                          ) : (
                            <Dumbbell size={14} />
                          )}
                        </div>

                        <div className={styles.workoutGridMetrics}>
                          <div className={styles.workoutGridMetric}>
                            <span className={styles.metricKey}>Exercises</span>
                            <span className={styles.metricVal}>
                              {dayItem.isRestDay ? "0" : dayItem.exercises?.length || 0}
                            </span>
                          </div>
                          <div className={styles.workoutGridMetric}>
                            <span className={styles.metricKey}>Mins</span>
                            <span className={styles.metricVal}>
                              {dayItem.isRestDay ? "-" : timeAvailable}
                            </span>
                          </div>
                          <div className={styles.workoutGridMetric}>
                            <span className={styles.metricKey}>Status</span>
                            <span className={styles.metricVal}>{statusText}</span>
                          </div>
                        </div>

                        {dayItem.timeBlock?.evening &&
                          dayItem.timeBlock.evening !== "Rest" && (
                            <div className={styles.workoutGridSlotTag}>
                              Evening: {dayItem.timeBlock.evening}
                            </div>
                          )}
                      </button>
                    ) : (
                      <div className={styles.emptyDaySlot}>No plan</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SELECTED DAY DETAIL PANEL (Visible in both Day & Week modes) */}
      {activeDaySchedule && (
        <div className={styles.selectedDayPanel}>
          <div className={styles.selectedDayHeader}>
            <div>
              <h4 className={styles.selectedDayTitle}>
                {activeDaySchedule.day} —{" "}
                {activeDaySchedule.isRestDay
                  ? "Rest & Recovery"
                  : activeDaySchedule.focusArea}
              </h4>
              <p className={styles.selectedDaySub}>
                {activeDaySchedule.isRestDay
                  ? "Active recovery, mobility, and hydration."
                  : `${activeDaySchedule.exercises?.length || 0} structured exercises`}
              </p>
            </div>
            <div className={styles.selectedDayPills}>
              {activeDaySchedule.day === currentDay && (
                <span className={styles.todayBadge}>TODAY</span>
              )}
              {activeDaySchedule.isRestDay && (
                <span className={styles.restBadge}>REST</span>
              )}
            </div>
          </div>

          <div className={styles.timeBlocksGrid}>
            <div className={styles.timeBlockItem}>
              <span className={styles.timeBlockLabel}>Morning</span>
              <span className={styles.timeBlockValue}>
                {activeDaySchedule.timeBlock?.morning || "Rest"}
              </span>
            </div>
            <div className={styles.timeBlockItem}>
              <span className={styles.timeBlockLabel}>Evening</span>
              <span className={styles.timeBlockValue}>
                {activeDaySchedule.timeBlock?.evening || "Rest"}
              </span>
            </div>
            <div className={styles.timeBlockItem}>
              <span className={styles.timeBlockLabel}>Night</span>
              <span className={styles.timeBlockValue}>
                {activeDaySchedule.timeBlock?.night || "Rest"}
              </span>
            </div>
          </div>

          {!activeDaySchedule.isRestDay &&
            activeDaySchedule.exercises?.length > 0 && (
              <div className={styles.exercisesSection}>
                <div className={styles.exercisesHeader}>
                  <Flame className={styles.exercisesIcon} />
                  <span className={styles.exercisesTitle}>
                    Exercises ({activeDaySchedule.exercises.length})
                  </span>
                </div>
                <div className={styles.exerciseDetailGrid}>
                  {activeDaySchedule.exercises.map((ex, idx) => (
                    <div key={idx} className={styles.exerciseDetailCard}>
                      <div className={styles.exerciseDetailName}>
                        {idx + 1}. {ex.name}
                      </div>
                      <div className={styles.exerciseDetailMeta}>
                        {ex.sets && <span>Sets: {ex.sets}</span>}
                        {ex.reps && <span>Reps: {ex.reps}</span>}
                        {ex.restBetweenSets && <span>Rest: {ex.restBetweenSets}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
