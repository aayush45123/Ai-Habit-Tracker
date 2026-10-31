import React, { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "./TimeSchedule.module.css";
import { formatDateISO } from "../../utils/dateHelpers";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthlyCalendarView({
  selectedDate,
  onSelectDate,
  monthlyCounts = {},
}) {
  const [currentDateObj, setCurrentDateObj] = useState(() => {
    const [y, m, d] = (selectedDate || formatDateISO()).split("-").map(Number);
    return new Date(y, m - 1, d || 1);
  });

  const year = currentDateObj.getFullYear();
  const month = currentDateObj.getMonth();

  const handlePrevMonth = () => {
    setCurrentDateObj(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDateObj(new Date(year, month + 1, 1));
  };

  // Build month cells
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dNum = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, dNum);
    const dateStr = formatDateISO(prevMonthDate);
    cells.push({
      dateStr,
      dayNumber: dNum,
      isCurrentMonth: false,
    });
  }

  // Current month days
  const todayStr = formatDateISO();
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = formatDateISO(curDate);
    cells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    });
  }

  // Next month leading days to complete grid (42 cells total for 6 rows)
  const remainingCells = 42 - cells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const dateStr = formatDateISO(nextMonthDate);
    cells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  return (
    <div className={styles.monthContainer}>
      <div className={styles.monthHeader}>
        <h3 className={styles.monthTitle}>
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className={styles.monthNavBtns}>
          <button className={styles.bannerBtn} onClick={handlePrevMonth} title="Previous Month">
            <FiChevronLeft size={18} />
          </button>
          <button
            className={styles.bannerBtn}
            onClick={() => setCurrentDateObj(new Date())}
            title="Current Month"
          >
            Today
          </button>
          <button className={styles.bannerBtn} onClick={handleNextMonth} title="Next Month">
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className={styles.monthGrid}>
        {WEEK_DAYS.map((w) => (
          <div key={w} className={styles.monthWeekDayHeader}>
            {w}
          </div>
        ))}

        {cells.map((cell, idx) => {
          const countInfo = monthlyCounts[cell.dateStr] || { total: 0, completed: 0 };

          return (
            <div
              key={idx}
              className={`${styles.monthDayCell} ${
                !cell.isCurrentMonth ? styles.cellOtherMonth : ""
              } ${cell.isToday ? styles.cellToday : ""} ${
                cell.isSelected ? styles.cellSelected : ""
              }`}
              onClick={() => onSelectDate(cell.dateStr)}
            >
              <span className={styles.cellDayNum}>{cell.dayNumber}</span>

              {countInfo.total > 0 && (
                <div className={styles.cellEventsDots}>
                  <span className={styles.eventCountBadge}>
                    {countInfo.completed}/{countInfo.total} Done
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

