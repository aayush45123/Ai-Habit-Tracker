// client/src/pages/ChallengePage/ChallengePage.jsx (FIXED - Proper state reset on restart)
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
  RefreshCw,
  AlertCircle,
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

function blankHabits() {
  return Array.from({ length: 6 }, () => ({
    title: "",
    startTime: "",
    startPeriod: "AM",
    endTime: "",
    endPeriod: "AM",
  }));
}

export default function ChallengePage() {
  const [habits, setHabits] = useState(blankHabits());

  const [existing, setExisting] = useState(null);
  const [days, setDays] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [newChallengeMode, setNewChallengeMode] = useState(false); // ✅ NEW
  const [message, setMessage] = useState("");
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [completionStats, setCompletionStats] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [challengeHistory, setChallengeHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // ✅ NEW: Force re-render key

  /* Load challenge */
  useEffect(() => {
    loadChallenge();
    loadHistory();
  }, [refreshKey]); // ✅ FIXED: Re-run when refreshKey changes

  async function loadChallenge() {
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

      const res = await api.get(
        `/challenge/current?hour=${hour}&minute=${minute}&today=${today}`,
      );

      if (res.data.completed) {
        setChallengeCompleted(true);
        setCompletionStats(res.data.stats);
        setExisting(null);
        setDays([]); // ✅ FIXED: Clear days array
        setMessage("");
        return;
      }

      if (res.data.active) {
        const challenge = res.data.challenge;
        setExisting(challenge);
        setDays(res.data.days); // ✅ This will now have fresh data
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
          }),
        );
      } else {
        setExisting(null);
        setDays([]); // ✅ FIXED: Clear days array
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

  function addHabit() {
    setHabits([
      ...habits,
      {
        title: "",
        startTime: "",
        startPeriod: "AM",
        endTime: "",
        endPeriod: "AM",
      },
    ]);
  }

  function removeHabit(index) {
    if (habits.length <= 6) {
      setMessage("Minimum 6 habits required!");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setHabits(habits.filter((_, i) => i !== index));
  }

  async function startChallenge() {
    setMessage("");

    const filledHabits = habits.filter(
      (h) => h.title && h.startTime && h.endTime,
    );

    if (filledHabits.length < 6) {
      setMessage("Please enter at least 6 complete habits.");
      return;
    }

    const formatted = filledHabits.map((h) => ({
      title: h.title,
      startTime: `${h.startTime} ${h.startPeriod}`,
      endTime: `${h.endTime} ${h.endPeriod}`,
    }));

    try {
      const res = await api.post("/challenge/start", { habits: formatted });
      setExisting(res.data.challenge);
      setChallengeCompleted(false);
      setCompletionStats(null);
      setDays([]); // ✅ FIXED: Clear old days
      setRefreshKey((prev) => prev + 1); // ✅ FIXED: Force refresh
      loadHistory();
      setMessage("Challenge started successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error starting challenge.");
    }
  }

  async function restartChallenge() {
    setMessage("");

    const filledHabits = habits.filter(
      (h) => h.title && h.startTime && h.endTime,
    );

    if (filledHabits.length < 6) {
      setMessage("Please enter at least 6 complete habits.");
      return;
    }

    const formatted = filledHabits.map((h) => ({
      title: h.title,
      startTime: `${h.startTime} ${h.startPeriod}`,
      endTime: `${h.endTime} ${h.endPeriod}`,
    }));

    try {
      const res = await api.post("/challenge/restart", { habits: formatted });

      // ✅ FIXED: Clear all old state BEFORE setting new challenge
      setDays([]);
      setExisting(null);
      setChallengeCompleted(false);
      setCompletionStats(null);

      // ✅ FIXED: Set new challenge data
      setExisting(res.data.challenge);
      setShowRestartModal(false);

      // ✅ FIXED: Force complete refresh of challenge data
      setRefreshKey((prev) => prev + 1);

      await loadHistory();

      setMessage("Challenge restarted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error restarting challenge.");
    }
  }

  /* -----------------------------------------------------
     ✅ NEW: Start a brand-new challenge with a fresh set
     of habits. The current challenge is archived to
     history (backend /challenge/restart already does
     this) but here the form starts blank instead of
     pre-filled, so the user picks new habits.
  ----------------------------------------------------- */
  function openNewChallengeForm() {
    setHabits(blankHabits());
    setNewChallengeMode(true);
    setEditMode(false);
    setMessage("");
  }

  function cancelNewChallenge() {
    setNewChallengeMode(false);
    setMessage("");
    loadChallenge(); // restore current challenge's habits back into form state
  }

  async function submitNewChallenge() {
    setMessage("");

    const filledHabits = habits.filter(
      (h) => h.title && h.startTime && h.endTime,
    );

    if (filledHabits.length < 6) {
      setMessage("Please enter at least 6 complete habits.");
      return;
    }

    const formatted = filledHabits.map((h) => ({
      title: h.title,
      startTime: `${h.startTime} ${h.startPeriod}`,
      endTime: `${h.endTime} ${h.endPeriod}`,
    }));

    try {
      // Reuses the restart endpoint: archives current challenge to
      // history and creates a fresh 21-day challenge with these habits.
      const res = await api.post("/challenge/restart", { habits: formatted });

      setDays([]);
      setExisting(null);
      setChallengeCompleted(false);
      setCompletionStats(null);

      setExisting(res.data.challenge);
      setNewChallengeMode(false);
      setRefreshKey((prev) => prev + 1);

      await loadHistory();

      setMessage(
        "New challenge started! Your previous challenge was moved to history.",
      );
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "Error starting new challenge.",
      );
    }
  }

  async function updateChallenge() {
    const filledHabits = habits.filter(
      (h) => h.title && h.startTime && h.endTime,
    );

    if (filledHabits.length < 6) {
      setMessage("Please maintain at least 6 habits in your challenge.");
      return;
    }

    const formatted = filledHabits.map((h) => ({
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
      setRefreshKey((prev) => prev + 1); // ✅ FIXED: Force refresh after update
      setMessage("Challenge updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error updating challenge.");
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
        `/challenge/done/${existing._id}/${habitIndex}?hour=${hour}&minute=${minute}&today=${today}`,
      );
      setRefreshKey((prev) => prev + 1); // ✅ FIXED: Force refresh after marking done
    } catch (err) {
      console.error(err);
      if (err.response?.data?.challengeEnded) {
        setMessage("Challenge completed! Start a new one.");
        setChallengeCompleted(true);
      } else {
        setMessage(err.response?.data?.message || "Error marking habit done.");
        setTimeout(() => setMessage(""), 3000);
      }
    }
  }

  function resetForm() {
    setHabits(blankHabits());
    setMessage("");
    setChallengeCompleted(false);
    setCompletionStats(null);
    setExisting(null);
    setDays([]); // ✅ FIXED: Clear days
    setRefreshKey((prev) => prev + 1); // ✅ FIXED: Force refresh
  }

  async function deleteOldChallenge(challengeId) {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      await api.delete(`/challenge/${challengeId}`);
      loadHistory();
      alert("Challenge deleted successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete challenge");
    }
  }

  function openRestartModal() {
    // Pre-fill with current habits
    if (existing) {
      setHabits(
        existing.habits.map((h) => {
          const s = convert24to12(h.startTime);
          const e = convert24to12(h.endTime);
          return {
            title: h.title,
            startTime: s.time,
            startPeriod: s.period,
            endTime: e.time,
            endPeriod: e.period,
          };
        }),
      );
    }
    setShowRestartModal(true);
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

      {/* RESTART MODAL */}
      {showRestartModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowRestartModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <AlertCircle className={styles.modalIcon} />
                <h3 className={styles.modalTitle}>Restart Challenge?</h3>
              </div>
              <button
                className={styles.modalClose}
                onClick={() => setShowRestartModal(false)}
              >
                <CloseIcon />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                Your current challenge will be moved to history, and a fresh
                21-day challenge will begin today. You can modify your habits or
                keep them the same.
              </p>

              <div className={styles.modalHabits}>
                <h4 className={styles.modalSubtitle}>Review Your Habits:</h4>
                {habits.map((h, i) => (
                  <div key={i} className={styles.modalHabitRow}>
                    <span className={styles.modalHabitNumber}>{i + 1}</span>
                    <span className={styles.modalHabitTitle}>
                      {h.title || "(Empty)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setShowRestartModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.modalConfirmBtn}
                onClick={restartChallenge}
              >
                <RefreshCw className={styles.btnIcon} />
                <span>Restart Challenge</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

                  <div className={styles.historyProgress}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${challenge.completionRate}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      Day {challenge.daysElapsed}/21
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
              <span className={styles.statNumber}>6+</span>
              <span className={styles.statLabel}>Daily Habits</span>
            </div>
            <div className={styles.stat}>
              <Calendar className={styles.statIcon} />
              <span className={styles.statNumber}>21</span>
              <span className={styles.statLabel}>Days to Success</span>
            </div>
            <div className={styles.stat}>
              <CheckCircle className={styles.statIcon} />
              <span className={styles.statNumber}>126+</span>
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

      {/* ACTION BUTTONS FOR ACTIVE CHALLENGE */}
      {existing && !editMode && !challengeCompleted && !newChallengeMode && (
        <div className={styles.actionButtons}>
          <button className={styles.editBtn} onClick={() => setEditMode(true)}>
            <Edit className={styles.btnIcon} />
            <span>Edit Challenge</span>
          </button>
          <button className={styles.restartBtn} onClick={openRestartModal}>
            <RefreshCw className={styles.btnIcon} />
            <span>Restart Challenge</span>
          </button>
          <button
            className={styles.newChallengeBtn}
            onClick={openNewChallengeForm}
          >
            <Plus className={styles.btnIcon} />
            <span>Start New Challenge</span>
          </button>
        </div>
      )}

      {/* FORM - Create/Edit/New-Challenge Mode */}
      {(!existing || editMode || newChallengeMode) && !challengeCompleted && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Plus className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>
              {newChallengeMode
                ? "Start New Challenge — Choose New Habits"
                : existing && editMode
                  ? "Edit Your Challenge"
                  : "Set Up Your Challenge"}
            </h3>
          </div>

          {newChallengeMode && (
            <div className={styles.newChallengeNotice}>
              <AlertCircle className={styles.noticeIcon} />
              <p className={styles.noticeText}>
                Your current challenge will be moved to history once you start
                this one. Pick a fresh set of habits below.
              </p>
            </div>
          )}

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

                {i >= 6 && (
                  <button
                    className={styles.removeHabitBtn}
                    onClick={() => removeHabit(i)}
                    title="Remove habit"
                  >
                    <Trash2 className={styles.removeIcon} />
                  </button>
                )}
              </div>
            ))}

            <button className={styles.addHabitBtn} onClick={addHabit}>
              <Plus className={styles.addIcon} />
              <span>Add Another Habit</span>
            </button>
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.submitBtn}
              onClick={
                newChallengeMode
                  ? submitNewChallenge
                  : existing
                    ? updateChallenge
                    : startChallenge
              }
            >
              {newChallengeMode ? (
                <>
                  <Target className={styles.btnIcon} />
                  <span>Start New Challenge</span>
                </>
              ) : existing ? (
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

            {(editMode || newChallengeMode) && (
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  if (newChallengeMode) {
                    cancelNewChallenge();
                  } else {
                    setEditMode(false);
                    loadChallenge();
                  }
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
      {existing && !editMode && !challengeCompleted && !newChallengeMode && (
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
      {existing && !challengeCompleted && !newChallengeMode && (
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

      {/* HEATMAP & TREND - ✅ FIXED: Pass refreshKey to force re-render */}
      {(existing || challengeCompleted) && !newChallengeMode && (
        <ChallengeHeatmap key={`heatmap-${refreshKey}`} />
      )}
      {(existing || challengeCompleted) && !newChallengeMode && (
        <ChallengeTrend key={`trend-${refreshKey}`} />
      )}
    </div>
  );
}
