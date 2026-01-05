// client/src/pages/ChallengePage/ChallengePage.jsx (ENHANCED)
import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Circle,
  Timer,
  Edit,
  Save,
  Plus,
  Trash2,
  History,
  Award,
  Target,
  TrendingUp,
  Sparkles,
  X as CloseIcon,
} from "lucide-react";
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
  const [showHistory, setShowHistory] = useState(false);
  const [challengeHistory, setChallengeHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* Load challenge */
  useEffect(() => {
    loadChallenge();
    loadHistory();
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

      if (res.data.completed) {
        setChallengeCompleted(true);
        setCompletionStats(res.data.stats);
        setExisting(null);
        setMessage("");
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
      loadHistory();
      setMessage("Challenge started!");
    } catch (err) {
      console.error(err);
      setMessage("Error starting challenge.");
    }
  }

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
        setMessage("Challenge completed! Start a new one.");
        setChallengeCompleted(true);
      }
    }
  }

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
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Target className={styles.targetIcon} />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>21-Day Challenge</h2>
            <p className={styles.subtitle}>
              Commit to 21 days of powerful habit building
            </p>
          </div>
        </div>

        <button
          className={styles.historyBtn}
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? (
            <>
              <CloseIcon className={styles.btnIcon} />
              <span>Hide History</span>
            </>
          ) : (
            <>
              <History className={styles.btnIcon} />
              <span>View History</span>
            </>
          )}
        </button>
      </div>

      {/* HISTORY SECTION */}
      {showHistory && (
        <div className={styles.historySection}>
          <div className={styles.historySectionHeader}>
            <History className={styles.sectionIcon} />
            <h3 className={styles.historyTitle}>Your Challenge History</h3>
          </div>

          {loadingHistory ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading history...</p>
            </div>
          ) : challengeHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar className={styles.emptyIcon} />
              <p className={styles.emptyText}>No past challenges yet</p>
              <p className={styles.emptySubtext}>Complete your first one!</p>
            </div>
          ) : (
            <div className={styles.historyGrid}>
              {challengeHistory.map((challenge, index) => (
                <div key={challenge._id} className={styles.historyCard}>
                  <div className={styles.historyCardHeader}>
                    <span className={styles.historyBadge}>
                      {challenge.isActive ? (
                        <>
                          <Award className={styles.badgeIcon} /> Active
                        </>
                      ) : (
                        <>
                          <CheckCircle className={styles.badgeIcon} /> Completed
                        </>
                      )}
                    </span>
                    <span className={styles.historyNumber}>
                      #{challengeHistory.length - index}
                    </span>
                  </div>

                  <div className={styles.historyDates}>
                    <Calendar className={styles.dateIcon} />
                    <span>
                      {new Date(challenge.startDate).toLocaleDateString()}
                    </span>
                    <TrendingUp className={styles.arrowIcon} />
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
                      <Trash2 className={styles.deleteIcon} />
                      <span>Delete</span>
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
        <div className={styles.bannerIcon}>
          <Sparkles className={styles.sparkleIcon} />
        </div>
        <div className={styles.bannerContent}>
          <h3 className={styles.bannerTitle}>Why 21 Days?</h3>
          <p className={styles.bannerText}>
            Research shows it takes approximately 21 days to form a new habit.
            This challenge helps you build consistency, track your progress
            daily, and transform your routines into lasting behaviors.
          </p>
          <div className={styles.bannerStats}>
            <div className={styles.stat}>
              <Target className={styles.statIcon} />
              <span className={styles.statNumber}>6</span>
              <span className={styles.statLabel}>Daily Habits</span>
            </div>
            <div className={styles.stat}>
              <Calendar className={styles.statIcon} />
              <span className={styles.statNumber}>21</span>
              <span className={styles.statLabel}>Days to Success</span>
            </div>
            <div className={styles.stat}>
              <CheckCircle className={styles.statIcon} />
              <span className={styles.statNumber}>126</span>
              <span className={styles.statLabel}>Total Completions</span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETION CELEBRATION */}
      {challengeCompleted && completionStats && (
        <div className={styles.completionCard}>
          <div className={styles.completionHeader}>
            <div className={styles.completionIcon}>
              <Award className={styles.awardIcon} />
            </div>
            <h2 className={styles.completionTitle}>Challenge Completed!</h2>
            <p className={styles.completionSubtitle}>
              Congratulations on completing your 21-day journey!
            </p>
          </div>

          <div className={styles.completionStats}>
            <div className={styles.completionStat}>
              <TrendingUp className={styles.completionStatIcon} />
              <span className={styles.completionStatNumber}>
                {completionStats.completionRate}%
              </span>
              <span className={styles.completionStatLabel}>Overall</span>
            </div>
            <div className={styles.completionStat}>
              <Award className={styles.completionStatIcon} />
              <span className={styles.completionStatNumber}>
                {completionStats.perfectDays}
              </span>
              <span className={styles.completionStatLabel}>Perfect Days</span>
            </div>
            <div className={styles.completionStat}>
              <CheckCircle className={styles.completionStatIcon} />
              <span className={styles.completionStatNumber}>
                {completionStats.completedHabits}/{completionStats.totalHabits}
              </span>
              <span className={styles.completionStatLabel}>Habits</span>
            </div>
          </div>

          <button className={styles.startNewBtn} onClick={resetForm}>
            <Plus className={styles.btnIcon} />
            <span>Start New Challenge</span>
          </button>
        </div>
      )}

      {existing && !editMode && !challengeCompleted && (
        <button className={styles.editBtn} onClick={() => setEditMode(true)}>
          <Edit className={styles.btnIcon} />
          <span>Edit Challenge</span>
        </button>
      )}

      {/* FORM - Create/Edit Mode */}
      {(!existing || editMode) && !challengeCompleted && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Plus className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>
              {existing && editMode
                ? "Edit Your Challenge"
                : "Set Up Your Challenge"}
            </h3>
          </div>

          <div className={styles.formContent}>
            {habits.map((h, i) => (
              <div key={i} className={styles.habitRow}>
                <div className={styles.habitNumber}>{i + 1}</div>

                <div className={styles.habitInput}>
                  <input
                    className={styles.textInput}
                    placeholder={`Enter habit ${
                      i + 1
                    } (e.g., Morning Exercise)`}
                    value={h.title}
                    onChange={(e) => updateHabit(i, "title", e.target.value)}
                  />
                </div>

                <div className={styles.timeControls}>
                  <div className={styles.timeGroup}>
                    <Clock className={styles.timeIcon} />
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
                    <Clock className={styles.timeIcon} />
                    <label className={styles.timeLabel}>End</label>
                    <input
                      className={styles.timeInput}
                      placeholder="08:00"
                      value={h.endTime}
                      onChange={(e) =>
                        updateHabit(i, "endTime", e.target.value)
                      }
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
              </div>
            ))}
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.submitBtn}
              onClick={existing ? updateChallenge : startChallenge}
            >
              {existing ? (
                <>
                  <Save className={styles.btnIcon} />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Target className={styles.btnIcon} />
                  <span>Start 21-Day Challenge</span>
                </>
              )}
            </button>

            {editMode && (
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setEditMode(false);
                  loadChallenge();
                }}
              >
                <CloseIcon className={styles.btnIcon} />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {message && (
            <div className={styles.messageBox}>
              <Sparkles className={styles.messageIcon} />
              <p className={styles.msg}>{message}</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE */}
      {existing && !editMode && !challengeCompleted && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <CheckCircle className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Your Challenge</h3>
          </div>

          <div className={styles.reviewBox}>
            {existing.habits.map((h, i) => {
              const s = convert24to12(h.startTime);
              const e = convert24to12(h.endTime);
              return (
                <div key={i} className={styles.reviewRow}>
                  <div className={styles.reviewHabitNum}>{i + 1}</div>
                  <strong className={styles.reviewHabitTitle}>{h.title}</strong>
                  <div className={styles.reviewHabitTime}>
                    <Clock className={styles.reviewTimeIcon} />
                    <span>
                      {s.time} {s.period} — {e.time} {e.period}
                    </span>
                  </div>
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
            <Calendar className={styles.sectionIcon} />
            <div className={styles.progressHeaderText}>
              <h3 className={styles.progressTitle}>Your Progress Journey</h3>
              <p className={styles.progressSubtitle}>
                Track your daily completion across all 21 days
              </p>
            </div>
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
                        <CheckCircle className={styles.done} />
                      )}
                      {status === "expired" && (
                        <XCircle className={styles.expired} />
                      )}
                      {status === "future" && (
                        <Circle className={styles.future} />
                      )}
                      {status === "pending" && (
                        <Timer className={styles.pending} />
                      )}
                      {status === "ongoing" && (
                        <button
                          className={styles.markBtn}
                          onClick={() => markDone(dayIndex, habitIndex)}
                        >
                          <CheckCircle className={styles.markIcon} />
                          <span>Mark Done</span>
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

      {/* HEATMAP & TREND */}
      {(existing || challengeCompleted) && <ChallengeHeatmap />}
      {(existing || challengeCompleted) && <ChallengeTrend />}
    </div>
  );
}
