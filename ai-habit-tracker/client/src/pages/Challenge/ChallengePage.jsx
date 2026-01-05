// client/src/pages/ChallengePage/ChallengePage.jsx (FIXED - Persistent Completion)
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import styles from "./ChallengePage.module.css";
import ChallengeHeatmap from "../../components/ChallengeHeatMap/ChallengeHeatMap";
import ChallengeTrend from "../../components/ChallengeTrend/ChallengeTrend";

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
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);
  const [showHistory, setShowHistory] = useState(false); // ✅ NEW
  const [challengeHistory, setChallengeHistory] = useState([]); // ✅ NEW
  const [loadingHistory, setLoadingHistory] = useState(false); // ✅ NEW

  /* Load challenge */
  useEffect(() => {
    loadChallenge();
    loadHistory(); // ✅ Load history on mount
  }, []);

  async function loadChallenge() {
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

      const res = await api.get(
        `/challenge/current?hour=${hour}&minute=${minute}&today=${today}`
      );

      // ✅ Handle completed challenge - DON'T auto-reload
      if (res.data.completed) {
        setChallengeCompleted(true);
        setCompletionStats(res.data.stats);
        setExisting(null);
        setMessage("");
        // ✅ REMOVED: Don't call loadChallenge again
        return;
      }

      if (res.data.active) {
        const challenge = res.data.challenge;
        setExisting(challenge);
        setDays(res.data.days);
        setChallengeCompleted(false);
        setCompletionStats(null);

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
      } else {
        setExisting(null);
        setChallengeCompleted(false);
        setCompletionStats(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ✅ NEW: Load challenge history
  async function loadHistory() {
    try {
      setLoadingHistory(true);
      const res = await api.get("/challenge/history");
      setChallengeHistory(res.data.history || []);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoadingHistory(false);
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
      setChallengeCompleted(false);
      setCompletionStats(null);
      loadChallenge();
      loadHistory(); // ✅ Refresh history
      setMessage("Challenge started! 🚀");
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
      setMessage("Error updating challenge.");
    }
  }

  /* Mark habit done */
  async function markDone(dayIndex, habitIndex) {
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

      await api.post(
        `/challenge/done/${existing._id}/${habitIndex}?hour=${hour}&minute=${minute}&today=${today}`
      );
      loadChallenge();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.challengeEnded) {
        // ✅ Don't reload, just show message
        setMessage("🎉 Challenge completed! Start a new one.");
        setChallengeCompleted(true);
      }
    }
  }

  /* Reset form to start new challenge */
  function resetForm() {
    setHabits(
      Array.from({ length: 6 }, () => ({
        title: "",
        startTime: "",
        startPeriod: "AM",
        endTime: "",
        endPeriod: "AM",
      }))
    );
    setMessage("");
    setChallengeCompleted(false);
    setCompletionStats(null);
    setExisting(null);
  }

  // ✅ NEW: Delete old challenge
  async function deleteOldChallenge(challengeId) {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      await api.delete(`/challenge/${challengeId}`);
      loadHistory();
      alert("Challenge deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete challenge");
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

        {/* ✅ NEW: History Button */}
        <button
          className={styles.historyBtn}
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "📊 Hide History" : "📜 View History"}
        </button>
      </div>

      {/* ✅ NEW: HISTORY SECTION */}
      {showHistory && (
        <div className={styles.historySection}>
          <h3 className={styles.historyTitle}>Your Challenge History</h3>
          {loadingHistory ? (
            <p className={styles.historyLoading}>Loading history...</p>
          ) : challengeHistory.length === 0 ? (
            <p className={styles.historyEmpty}>
              No past challenges yet. Complete your first one!
            </p>
          ) : (
            <div className={styles.historyGrid}>
              {challengeHistory.map((challenge, index) => (
                <div key={challenge._id} className={styles.historyCard}>
                  <div className={styles.historyCardHeader}>
                    <span className={styles.historyBadge}>
                      {challenge.isActive ? "🟢 Active" : "✅ Completed"}
                    </span>
                    <span className={styles.historyNumber}>
                      Challenge #{challengeHistory.length - index}
                    </span>
                  </div>

                  <div className={styles.historyDates}>
                    <span>
                      {new Date(challenge.startDate).toLocaleDateString()}
                    </span>
                    <span>→</span>
                    <span>
                      {new Date(challenge.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className={styles.historyStats}>
                    <div className={styles.historyStat}>
                      <span className={styles.historyStatValue}>
                        {challenge.completionRate}%
                      </span>
                      <span className={styles.historyStatLabel}>
                        Completion
                      </span>
                    </div>
                    <div className={styles.historyStat}>
                      <span className={styles.historyStatValue}>
                        {challenge.totalCompleted}
                      </span>
                      <span className={styles.historyStatLabel}>Done</span>
                    </div>
                    <div className={styles.historyStat}>
                      <span className={styles.historyStatValue}>
                        {challenge.habitCount}
                      </span>
                      <span className={styles.historyStatLabel}>Habits</span>
                    </div>
                  </div>

                  {!challenge.isActive && (
                    <button
                      className={styles.historyDeleteBtn}
                      onClick={() => deleteOldChallenge(challenge._id)}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* ✅ COMPLETION CELEBRATION - PERSISTENT */}
      {challengeCompleted && completionStats && (
        <div className={styles.completionCard}>
          <div className={styles.completionHeader}>
            <h2 className={styles.completionTitle}>🎉 Challenge Completed!</h2>
            <p className={styles.completionSubtitle}>
              Congratulations on completing your 21-day journey!
            </p>
          </div>

          <div className={styles.completionStats}>
            <div className={styles.completionStat}>
              <span className={styles.completionStatNumber}>
                {completionStats.completionRate}%
              </span>
              <span className={styles.completionStatLabel}>
                Overall Completion
              </span>
            </div>
            <div className={styles.completionStat}>
              <span className={styles.completionStatNumber}>
                {completionStats.perfectDays}
              </span>
              <span className={styles.completionStatLabel}>Perfect Days</span>
            </div>
            <div className={styles.completionStat}>
              <span className={styles.completionStatNumber}>
                {completionStats.completedHabits}/{completionStats.totalHabits}
              </span>
              <span className={styles.completionStatLabel}>Habits Done</span>
            </div>
          </div>

          <button className={styles.startNewBtn} onClick={resetForm}>
            🚀 Start New Challenge
          </button>
        </div>
      )}

      {existing && !editMode && !challengeCompleted && (
        <button className={styles.editBtn} onClick={() => setEditMode(true)}>
          ✏️ Edit Challenge
        </button>
      )}

      {/* Only show form if no active challenge or in edit mode */}
      {(!existing || editMode) && !challengeCompleted && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            {existing && editMode
              ? "Edit Your Challenge"
              : "Set Up Your Challenge"}
          </h3>

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
                  onChange={(e) => updateHabit(i, "startTime", e.target.value)}
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
                  onChange={(e) => updateHabit(i, "endPeriod", e.target.value)}
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

          {editMode && (
            <button
              className={styles.cancelBtn}
              onClick={() => {
                setEditMode(false);
                loadChallenge();
              }}
            >
              Cancel
            </button>
          )}

          {message && <p className={styles.msg}>{message}</p>}
        </div>
      )}

      {/* VIEW MODE */}
      {existing && !editMode && !challengeCompleted && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Your Challenge</h3>
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
        </div>
      )}

      {/* PROGRESS GRID */}
      {existing && !challengeCompleted && (
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
      {(existing || challengeCompleted) && <ChallengeHeatmap />}

      {/* TREND ANALYSIS SECTION */}
      {(existing || challengeCompleted) && <ChallengeTrend />}
    </div>
  );
}
