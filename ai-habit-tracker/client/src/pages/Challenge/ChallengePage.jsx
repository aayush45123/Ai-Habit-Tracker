import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./ChallengePage.module.css";
import ChallengeHeatmap from "../../components/ChallengeHeatMap/ChallengeHeatMap";

/* Convert 24-hour → 12-hour */
function convert24to12(time24) {
  if (!time24) return { time: "", period: "AM" };

  let [hour, minute] = time24.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return {
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    period,
  };
}

export default function ChallengePage() {
  const [habits, setHabits] = useState(
    Array.from({ length: 6 }, () => ({
      title: "",
      startTime: "",
      startPeriod: "AM",
      endTime: "",
      endPeriod: "AM",
    }))
  );

  const [existing, setExisting] = useState(null);
  const [days, setDays] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");

  /* Load challenge */
  useEffect(() => {
    loadChallenge();
  }, []);

  async function loadChallenge() {
    try {
      const res = await api.get("/challenge/current");

      if (res.data.active) {
        const challenge = res.data.challenge;
        setExisting(challenge);
        setDays(res.data.days);

        setHabits(
          challenge.habits.map((h) => {
            const s = convert24to12(h.startTime);
            const e = convert24to12(h.endTime);

            return {
              title: h.title,
              startTime: s.time,
              startPeriod: s.period,
              endTime: e.time,
              endPeriod: e.period,
            };
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  function updateHabit(i, field, value) {
    const updated = [...habits];
    updated[i] = { ...updated[i], [field]: value };
    setHabits(updated);
  }

  /* Start challenge */
  async function startChallenge() {
    setMessage("");

    if (habits.filter((h) => h.title && h.startTime && h.endTime).length < 6) {
      setMessage("Please enter at least 6 habits.");
      return;
    }

    const formatted = habits.map((h) => ({
      title: h.title,
      startTime: `${h.startTime} ${h.startPeriod}`,
      endTime: `${h.endTime} ${h.endPeriod}`,
    }));

    try {
      const res = await api.post("/challenge/start", { habits: formatted });
      setExisting(res.data.challenge);
      loadChallenge();
      setMessage("Challenge started!");
    } catch {
      setMessage("Error starting challenge.");
    }
  }

  /* Update existing challenge */
  async function updateChallenge() {
    const formatted = habits.map((h) => ({
      title: h.title,
      startTime: `${h.startTime} ${h.startPeriod}`,
      endTime: `${h.endTime} ${h.endPeriod}`,
    }));

    try {
      const res = await api.put(`/challenge/update/${existing._id}`, {
        habits: formatted,
      });

      setExisting(res.data.challenge);
      setEditMode(false);
      loadChallenge();
      setMessage("Challenge updated!");
    } catch {
      setMessage("Error updating challenge.");
    }
  }

  /* Mark habit done */
  async function markDone(dayIndex, habitIndex) {
    try {
      await api.post(`/challenge/done/${existing._id}/${habitIndex}`);
      loadChallenge();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className={styles.root}>
      {/* HEADER SECTION */}
      <div className={styles.header}>
        <h2 className={styles.title}>21-Day Challenge</h2>
        <p className={styles.subtitle}>
          Commit to 21 days of powerful habit building.
        </p>
      </div>

      {/* DESCRIPTION BANNER */}
      <div className={styles.descriptionBanner}>
        <div className={styles.bannerContent}>
          <h3 className={styles.bannerTitle}>Why 21 Days?</h3>
          <p className={styles.bannerText}>
            Research shows it takes approximately 21 days to form a new habit.
            This challenge helps you build consistency, track your progress
            daily, and transform your routines into lasting behaviors. Choose 6
            meaningful habits and commit to completing them every day for the
            next three weeks.
          </p>
          <div className={styles.bannerStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>6</span>
              <span className={styles.statLabel}>Daily Habits</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>21</span>
              <span className={styles.statLabel}>Days to Success</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>126</span>
              <span className={styles.statLabel}>Total Completions</span>
            </div>
          </div>
        </div>
      </div>

      {existing && !editMode && (
        <button className={styles.editBtn} onClick={() => setEditMode(true)}>
          ✏️ Edit Challenge
        </button>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          {existing && !editMode ? "Your Challenge" : "Set Up Your Challenge"}
        </h3>

        {/* VIEW MODE */}
        {existing && !editMode && (
          <div className={styles.reviewBox}>
            {existing.habits.map((h, i) => {
              const s = convert24to12(h.startTime);
              const e = convert24to12(h.endTime);
              return (
                <div key={i} className={styles.reviewRow}>
                  <div className={styles.reviewHabitNum}>#{i + 1}</div>
                  <strong className={styles.reviewHabitTitle}>{h.title}</strong>
                  <span className={styles.reviewHabitTime}>
                    {s.time} {s.period} — {e.time} {e.period}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE / EDIT MODE */}
        {!existing || editMode ? (
          <>
            {habits.map((h, i) => (
              <div key={i} className={styles.row}>
                <div className={styles.habitNumber}>{i + 1}</div>
                <input
                  className={styles.textInput}
                  placeholder={`Enter habit ${i + 1} (e.g., Morning Exercise)`}
                  value={h.title}
                  onChange={(e) => updateHabit(i, "title", e.target.value)}
                />

                <div className={styles.timeGroup}>
                  <label className={styles.timeLabel}>Start</label>
                  <input
                    className={styles.timeInput}
                    placeholder="06:00"
                    value={h.startTime}
                    onChange={(e) =>
                      updateHabit(i, "startTime", e.target.value)
                    }
                  />
                  <select
                    className={styles.periodSelect}
                    value={h.startPeriod}
                    onChange={(e) =>
                      updateHabit(i, "startPeriod", e.target.value)
                    }
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>

                <div className={styles.timeGroup}>
                  <label className={styles.timeLabel}>End</label>
                  <input
                    className={styles.timeInput}
                    placeholder="08:00"
                    value={h.endTime}
                    onChange={(e) => updateHabit(i, "endTime", e.target.value)}
                  />
                  <select
                    className={styles.periodSelect}
                    value={h.endPeriod}
                    onChange={(e) =>
                      updateHabit(i, "endPeriod", e.target.value)
                    }
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>
            ))}

            <button
              className={styles.submitBtn}
              onClick={existing ? updateChallenge : startChallenge}
            >
              {existing ? "💾 Save Changes" : "🚀 Start 21-Day Challenge"}
            </button>

            {message && <p className={styles.msg}>{message}</p>}
          </>
        ) : null}
      </div>

      {/* PROGRESS GRID */}
      {existing && (
        <>
          <div className={styles.progressHeader}>
            <h3 className={styles.progressTitle}>Your Progress Journey</h3>
            <p className={styles.progressSubtitle}>
              Track your daily completion across all 21 days
            </p>
          </div>

          <div className={styles.progressGrid}>
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <span className={styles.dayLabel}>Day {dayIndex + 1}</span>
                  <span className={styles.dayDate}>{day.date.slice(5)}</span>
                </div>

                <div className={styles.statusList}>
                  {day.statuses.map((status, habitIndex) => (
                    <div key={habitIndex} className={styles.statusRow}>
                      {status === "done" && (
                        <span className={styles.done}>✔</span>
                      )}

                      {status === "expired" && (
                        <span className={styles.expired}>✖</span>
                      )}

                      {status === "future" && (
                        <span className={styles.future}>○</span>
                      )}

                      {status === "pending" && (
                        <span className={styles.comingSoon}>⏳</span>
                      )}

                      {status === "ongoing" && (
                        <button
                          className={styles.markBtn}
                          onClick={() => markDone(dayIndex, habitIndex)}
                        >
                          ✓ Mark Done
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* HEATMAP SECTION */}
      {existing && <ChallengeHeatmap />}
    </div>
  );
}
