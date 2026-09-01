// client/src/pages/ChallengePage/ChallengePage.jsx (ENHANCED - Dropdown timer & flexible challenge durations)
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
    startTime: "06",
    startMinute: "00",
    startPeriod: "AM",
    endTime: "08",
    endMinute: "00",
    endPeriod: "AM",
  }));
}

export const DURATION_PRESETS = [
  { days: 7, label: "7 Days", sublabel: "1 Week" },
  { days: 10, label: "10 Days", sublabel: "Sprint" },
  { days: 15, label: "15 Days", sublabel: "Mid-Sprint" },
  { days: 21, label: "21 Days", sublabel: "Habit Build", recommended: true },
  { days: 30, label: "30 Days", sublabel: "1 Month" },
];

const HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTE_PRESETS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/* ── Clean Dropdown Time Picker Component ── */
function TimeDropdownPicker({ hour, minute, period, onHourChange, onMinuteChange, onPeriodChange }) {
  const formattedHour = String(hour || "06").padStart(2, "0");
  const formattedMinute = String(minute || "00").padStart(2, "0");
  const minutesList = MINUTE_PRESETS.includes(formattedMinute)
    ? MINUTE_PRESETS
    : [...MINUTE_PRESETS, formattedMinute].sort((a, b) => Number(a) - Number(b));

  return (
    <div className={styles.timeDropdownContainer}>
      <select
        className={styles.timeSelect}
        value={formattedHour}
        onChange={(e) => onHourChange(e.target.value)}
        aria-label="Hour"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className={styles.timeSeparator}>:</span>

      <select
        className={styles.timeSelect}
        value={formattedMinute}
        onChange={(e) => onMinuteChange(e.target.value)}
        aria-label="Minute"
      >
        {minutesList.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        className={`${styles.timeSelect} ${styles.periodSelect}`}
        value={period || "AM"}
        onChange={(e) => onPeriodChange(e.target.value)}
        aria-label="AM or PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export default function ChallengePage() {
  const [habits, setHabits] = useState(blankHabits());
  const [durationDays, setDurationDays] = useState(21);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState("");

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
  const [refreshKey, setRefreshKey] = useState(0); // ✅ Force re-render key

  const activeDuration = isCustomDuration
    ? Math.max(1, parseInt(customDaysInput, 10) || 21)
    : durationDays;

  /* Load challenge */
  useEffect(() => {
    loadChallenge();
    loadHistory();
  }, [refreshKey]);

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
        setDays([]);
        setMessage("");
        return;
      }

      if (res.data.active) {
        const challenge = res.data.challenge;
        setExisting(challenge);
        setDays(res.data.days);
        setChallengeCompleted(false);
        setCompletionStats(null);

        if (challenge.durationDays) {
          setDurationDays(challenge.durationDays);
          const isPreset = DURATION_PRESETS.some(
            (p) => p.days === challenge.durationDays,
          );
          setIsCustomDuration(!isPreset);
          if (!isPreset) setCustomDaysInput(String(challenge.durationDays));
        }

        setHabits(
          challenge.habits.map((h) => {
            const s = convert24to12(h.startTime);
            const e = convert24to12(h.endTime);
            const [sHH, sMM] = (s.time || "06:00").split(":");
            const [eHH, eMM] = (e.time || "08:00").split(":");

            return {
              title: h.title,
              startTime: sHH || "06",
              startMinute: sMM || "00",
              startPeriod: s.period || "AM",
              endTime: eHH || "08",
              endMinute: eMM || "00",
              endPeriod: e.period || "AM",
            };
          }),
        );
      } else {
        setExisting(null);
        setDays([]);
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
        startTime: "06",
        startMinute: "00",
        startPeriod: "AM",
        endTime: "08",
        endMinute: "00",
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
      startTime: `${h.startTime}:${h.startMinute || "00"} ${h.startPeriod || "AM"}`,
      endTime: `${h.endTime}:${h.endMinute || "00"} ${h.endPeriod || "AM"}`,
    }));

    try {
      const res = await api.post("/challenge/start", {
        habits: formatted,
        durationDays: activeDuration,
      });
      setExisting(res.data.challenge);
      setChallengeCompleted(false);
      setCompletionStats(null);
      setDays([]);
      setRefreshKey((prev) => prev + 1);
      loadHistory();
      setMessage(
        `${activeDuration}-Day Challenge started successfully! Let's build strong habits.`,
      );
      setTimeout(() => setMessage(""), 3500);
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
      startTime: `${h.startTime}:${h.startMinute || "00"} ${h.startPeriod || "AM"}`,
      endTime: `${h.endTime}:${h.endMinute || "00"} ${h.endPeriod || "AM"}`,
    }));

    try {
      const res = await api.post("/challenge/restart", {
        habits: formatted,
        durationDays: activeDuration,
      });

      setDays([]);
      setExisting(null);
      setChallengeCompleted(false);
      setCompletionStats(null);

      setExisting(res.data.challenge);
      setShowRestartModal(false);
      setRefreshKey((prev) => prev + 1);

      await loadHistory();

      setMessage(
        `${activeDuration}-Day Challenge restarted successfully!`,
      );
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error restarting challenge.");
    }
  }

  function openNewChallengeForm() {
    setHabits(blankHabits());
    setDurationDays(21);
    setIsCustomDuration(false);
    setCustomDaysInput("");
    setNewChallengeMode(true);
    setEditMode(false);
    setMessage("");
  }

  function cancelNewChallenge() {
    setNewChallengeMode(false);
    setMessage("");
    loadChallenge();
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
      startTime: `${h.startTime}:${h.startMinute || "00"} ${h.startPeriod || "AM"}`,
      endTime: `${h.endTime}:${h.endMinute || "00"} ${h.endPeriod || "AM"}`,
    }));

    try {
      const res = await api.post("/challenge/restart", {
        habits: formatted,
        durationDays: activeDuration,
      });

      setDays([]);
      setExisting(null);
      setChallengeCompleted(false);
      setCompletionStats(null);

      setExisting(res.data.challenge);
      setNewChallengeMode(false);
      setRefreshKey((prev) => prev + 1);

      await loadHistory();

      setMessage(
        `New ${activeDuration}-day challenge started! Your previous challenge was moved to history.`,
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
      startTime: `${h.startTime}:${h.startMinute || "00"} ${h.startPeriod || "AM"}`,
      endTime: `${h.endTime}:${h.endMinute || "00"} ${h.endPeriod || "AM"}`,
    }));

    try {
      const res = await api.put(`/challenge/update/${existing._id}`, {
        habits: formatted,
      });

      setExisting(res.data.challenge);
      setEditMode(false);
      setRefreshKey((prev) => prev + 1);
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
      setRefreshKey((prev) => prev + 1);
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
    setDurationDays(21);
    setIsCustomDuration(false);
    setCustomDaysInput("");
    setMessage("");
    setChallengeCompleted(false);
    setCompletionStats(null);
    setExisting(null);
    setDays([]);
    setRefreshKey((prev) => prev + 1);
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
    if (existing) {
      setHabits(
        existing.habits.map((h) => {
          const s = convert24to12(h.startTime);
          const e = convert24to12(h.endTime);
          const [sHH, sMM] = (s.time || "06:00").split(":");
          const [eHH, eMM] = (e.time || "08:00").split(":");
          return {
            title: h.title,
            startTime: sHH || "06",
            startMinute: sMM || "00",
            startPeriod: s.period || "AM",
            endTime: eHH || "08",
            endMinute: eMM || "00",
            endPeriod: e.period || "AM",
          };
        }),
      );
      const dur = existing.durationDays || 21;
      setDurationDays(dur);
      const isPreset = DURATION_PRESETS.some((p) => p.days === dur);
      setIsCustomDuration(!isPreset);
      if (!isPreset) setCustomDaysInput(String(dur));
    }
    setShowRestartModal(true);
  }

  const currentDisplayDuration = existing
    ? existing.durationDays || 21
    : activeDuration;

  /* ── Duration Selector UI Component ── */
  function renderDurationSelector() {
    return (
      <div className={styles.durationSelectorGroup}>
        <div className={styles.durationLabelRow}>
          <label className={styles.durationLabel}>
            <Calendar className={styles.durationIcon} />
            <span>Select Challenge Duration</span>
          </label>
          <span className={styles.durationHint}>
            {activeDuration} {activeDuration === 1 ? "Day" : "Days"} Target
          </span>
        </div>

        <div className={styles.durationPills}>
          {DURATION_PRESETS.map((preset) => {
            const isSelected =
              !isCustomDuration && durationDays === preset.days;
            return (
              <button
                key={preset.days}
                type="button"
                className={`${styles.durationPill} ${
                  isSelected ? styles.durationPillActive : ""
                }`}
                onClick={() => {
                  setDurationDays(preset.days);
                  setIsCustomDuration(false);
                }}
              >
                <span className={styles.durationPillDays}>{preset.label}</span>
                <span className={styles.durationPillSub}>
                  {preset.sublabel}
                </span>
                {preset.recommended && (
                  <span className={styles.recommendedBadge}>Recommended</span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            className={`${styles.durationPill} ${
              isCustomDuration ? styles.durationPillActive : ""
            }`}
            onClick={() => {
              setIsCustomDuration(true);
              if (!customDaysInput) {
                setCustomDaysInput(String(durationDays || 21));
              }
            }}
          >
            <span className={styles.durationPillDays}>Custom</span>
            <span className={styles.durationPillSub}>Any Days</span>
          </button>
        </div>

        {isCustomDuration && (
          <div className={styles.customDurationInputRow}>
            <input
              type="number"
              min="1"
              max="365"
              className={styles.customDaysInput}
              placeholder="e.g. 5, 14, 45, 60"
              value={customDaysInput}
              onChange={(e) => {
                const val = e.target.value;
                setCustomDaysInput(val);
                const parsed = parseInt(val, 10);
                if (parsed > 0) {
                  setDurationDays(parsed);
                }
              }}
            />
            <span className={styles.customDaysUnit}>days challenge</span>
          </div>
        )}
      </div>
    );
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
            <h2 className={styles.title}>
              {existing
                ? `${existing.durationDays || 21}-Day Challenge`
                : "Habit Challenge"}
            </h2>
            <p className={styles.subtitle}>
              {existing
                ? `Commit to ${existing.durationDays || 21} days of powerful habit building`
                : "Commit to 21 days of powerful habit building (or pick your custom sprint)"}
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
                challenge will begin today. Choose your target duration and review
                your habits below.
              </p>

              {renderDurationSelector()}

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
                <span>Restart ({activeDuration} Days)</span>
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
              {challengeHistory.map((challenge, index) => {
                const dur = challenge.durationDays || 21;
                return (
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
                        #{challengeHistory.length - index} ({dur} Days)
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
                        Day {challenge.daysElapsed}/{dur}
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
                );
              })}
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
          <h3 className={styles.bannerTitle}>Why 21 Days? (Recommended)</h3>
          <p className={styles.bannerText}>
            Research shows it takes approximately 21 days to form a permanent
            habit. You can also pick 1 week, 10 days, 15 days, 30 days, or any
            custom duration that matches your personal consistency goals.
          </p>
          <div className={styles.bannerStats}>
            <div className={styles.stat}>
              <Target className={styles.statIcon} />
              <span className={styles.statNumber}>6+</span>
              <span className={styles.statLabel}>Daily Habits</span>
            </div>
            <div className={styles.stat}>
              <Calendar className={styles.statIcon} />
              <span className={styles.statNumber}>{currentDisplayDuration}</span>
              <span className={styles.statLabel}>Days Target</span>
            </div>
            <div className={styles.stat}>
              <CheckCircle className={styles.statIcon} />
              <span className={styles.statNumber}>
                {6 * currentDisplayDuration}+
              </span>
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
              Congratulations on completing your{" "}
              {completionStats.durationDays || 21}-day journey!
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
            <span>Edit Habits</span>
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
                ? "Start New Challenge — Choose Duration & Habits"
                : existing && editMode
                  ? "Edit Your Challenge Habits"
                  : "Set Up Your Challenge"}
            </h3>
          </div>

          {newChallengeMode && (
            <div className={styles.newChallengeNotice}>
              <AlertCircle className={styles.noticeIcon} />
              <p className={styles.noticeText}>
                Your current challenge will be moved to history once you start
                this one. Pick a fresh duration and set of habits below.
              </p>
            </div>
          )}

          <div className={styles.formContent}>
            {/* Show Duration Selector for new challenge or initial setup */}
            {(!existing || newChallengeMode) && renderDurationSelector()}

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
                    <TimeDropdownPicker
                      hour={h.startTime || "06"}
                      minute={h.startMinute || "00"}
                      period={h.startPeriod || "AM"}
                      onHourChange={(v) => updateHabit(i, "startTime", v)}
                      onMinuteChange={(v) => updateHabit(i, "startMinute", v)}
                      onPeriodChange={(v) => updateHabit(i, "startPeriod", v)}
                    />
                  </div>

                  <div className={styles.timeGroup}>
                    <Clock className={styles.timeIcon} />
                    <label className={styles.timeLabel}>End</label>
                    <TimeDropdownPicker
                      hour={h.endTime || "08"}
                      minute={h.endMinute || "00"}
                      period={h.endPeriod || "AM"}
                      onHourChange={(v) => updateHabit(i, "endTime", v)}
                      onMinuteChange={(v) => updateHabit(i, "endMinute", v)}
                      onPeriodChange={(v) => updateHabit(i, "endPeriod", v)}
                    />
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
                  <span>Start {activeDuration}-Day Challenge</span>
                </>
              ) : existing ? (
                <>
                  <Save className={styles.btnIcon} />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Target className={styles.btnIcon} />
                  <span>Start {activeDuration}-Day Challenge</span>
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
            <h3 className={styles.cardTitle}>Your Active Challenge</h3>
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
                Track your daily completion across all{" "}
                {existing.durationDays || days.length || 21} days
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

      {/* HEATMAP & TREND - Pass refreshKey to force re-render */}
      {(existing || challengeCompleted) && !newChallengeMode && (
        <ChallengeHeatmap key={`heatmap-${refreshKey}`} />
      )}
      {(existing || challengeCompleted) && !newChallengeMode && (
        <ChallengeTrend key={`trend-${refreshKey}`} />
      )}
    </div>
  );
}

