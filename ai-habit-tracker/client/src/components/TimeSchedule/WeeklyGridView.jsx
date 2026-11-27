import React, { useMemo } from "react";
import { FiPlus, FiCheck } from "react-icons/fi";
import styles from "./TimeSchedule.module.css";
import { formatTime12, getWeekDays, timeToMinutes } from "../../utils/dateHelpers";

const START_HOUR = 6; // 6:00 AM
const END_HOUR = 22; // 10:00 PM
const HOUR_HEIGHT = 48; // px per hour
const TOTAL_HOURS = END_HOUR - START_HOUR;
const START_MINUTES = START_HOUR * 60;
const END_MINUTES = END_HOUR * 60;

const CATEGORY_BORDER_SHADES = {
  work: "#000000",
  study: "#2b2b2b",
  fitness: "#1a1a1a",
  meeting: "#404040",
  routine: "#555555",
  personal: "#737373",
  break: "#999999",
  other: "#000000",
};

function formatHourLabel(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${suffix}`;
}

export default function WeeklyGridView({
  weekEvents = [],
  selectedDate,
  onSelectDate,
  onEditEvent,
  onAddForDate,
}) {
  const weekDays = getWeekDays(selectedDate);
  const hours = useMemo(
    () => Array.from({ length: TOTAL_HOURS }, (_, idx) => START_HOUR + idx),
    []
  );

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const day of weekDays) {
      map[day.dateStr] = [];
    }
    for (const ev of weekEvents) {
      if (map[ev.date]) {
        map[ev.date].push(ev);
      }
    }
    return map;
  }, [weekDays, weekEvents]);

  // Current time line position (if within 6am - 10pm)
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinutes >= START_MINUTES && nowMinutes <= END_MINUTES;
  const nowTopPx = ((nowMinutes - START_MINUTES) / 60) * HOUR_HEIGHT;

  return (
    <div className={styles.weeklyTimeGridWrapper}>
      <div className={styles.weeklyTimeGridScroll}>
        {/* Header Row */}
        <div className={styles.timeGridHeaderRow}>
          <div className={styles.timeAxisCorner}>TIME</div>
          {weekDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const dayCount = (eventsByDate[day.dateStr] || []).length;

            return (
              <div
                key={day.dateStr}
                className={`${styles.timeGridDayHeader} ${
                  day.isToday ? styles.timeGridDayHeaderToday : ""
                } ${isSelected && !day.isToday ? styles.timeGridDayHeaderSelected : ""}`}
              >
                <button
                  type="button"
                  className={styles.timeGridDayHeaderBtn}
                  onClick={() => onSelectDate(day.dateStr)}
                  aria-label={`View ${day.dateStr}`}
                >
                  <span className={styles.colDayName}>{day.dayName}</span>
                  <span className={styles.colDayNumber}>{day.dayNumber}</span>
                  {day.isToday && <span className={styles.todayMiniTag}>TODAY</span>}
                </button>
                <button
                  type="button"
                  className={styles.timeGridAddMiniBtn}
                  onClick={() => onAddForDate(day.dateStr)}
                  title={`Add slot on ${day.dateStr} (${dayCount} scheduled)`}
                  aria-label={`Add slot on ${day.dateStr}`}
                >
                  <FiPlus size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Body Grid */}
        <div
          className={styles.timeGridBody}
          style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
        >
          {/* Sticky Left Time Axis */}
          <div className={styles.timeAxisCol}>
            {hours.map((hr) => (
              <div
                key={hr}
                className={styles.timeAxisCell}
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span>{formatHourLabel(hr)}</span>
              </div>
            ))}
          </div>

          {/* 7 Day Columns */}
          {weekDays.map((day) => {
            const dayItems = eventsByDate[day.dateStr] || [];

            return (
              <div
                key={day.dateStr}
                className={`${styles.timeGridCol} ${
                  day.isToday ? styles.timeGridColToday : ""
                }`}
              >
                {/* Hour Gridlines */}
                {hours.map((hr) => (
                  <div
                    key={hr}
                    className={styles.timeGridSlotLine}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    onClick={() => onAddForDate(day.dateStr)}
                    title={`Click to add slot on ${day.dateStr}`}
                  />
                ))}

                {/* Current Time Indicator */}
                {day.isToday && showNowLine && (
                  <div
                    className={styles.nowIndicatorLine}
                    style={{ top: `${nowTopPx}px` }}
                  >
                    <span className={styles.nowIndicatorDot} />
                  </div>
                )}

                {/* Positioned Event Blocks */}
                {dayItems.map((item) => {
                  const startMin =
                    typeof item.startMinutes === "number"
                      ? item.startMinutes
                      : timeToMinutes(item.startTime || "09:00");
                  const endMin =
                    typeof item.endMinutes === "number"
                      ? item.endMinutes
                      : timeToMinutes(item.endTime || "10:00");

                  const clampedStart = Math.max(startMin, START_MINUTES);
                  const clampedEnd = Math.min(Math.max(endMin, clampedStart + 30), END_MINUTES);
                  const topPx = ((clampedStart - START_MINUTES) / 60) * HOUR_HEIGHT;
                  const heightPx = Math.max(26, ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT - 2);
                  const isDone = item.status === "completed";
                  const borderAccent = CATEGORY_BORDER_SHADES[item.category] || "#000000";

                  return (
                    <button
                      type="button"
                      key={item._id}
                      className={`${styles.timeGridEventBlock} ${
                        isDone ? styles.timeGridEventDone : ""
                      }`}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        borderLeftColor: borderAccent,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(item);
                      }}
                      title={`${item.title} (${formatTime12(item.startTime)} - ${formatTime12(item.endTime)})`}
                    >
                      <div className={styles.timeGridEventTitleRow}>
                        <span className={styles.timeGridEventTitle}>{item.title}</span>
                        {isDone && <FiCheck size={11} className={styles.timeGridEventCheck} />}
                      </div>
                      {heightPx >= 38 && (
                        <div className={styles.timeGridEventTime}>
                          {formatTime12(item.startTime)} – {formatTime12(item.endTime)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
