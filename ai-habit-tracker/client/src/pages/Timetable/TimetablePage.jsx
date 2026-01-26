// client/src/pages/TimetablePage/TimetablePage.jsx
import React, { useEffect, useState } from "react";
import {
  Calendar,
  Dumbbell,
  Target,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Award,
  TrendingUp,
  Zap,
  Activity,
} from "lucide-react";
import api from "../../utils/api";
import styles from "./TimetablePage.module.css";
import TodaysWorkout from "../../components/TodaysWorkout/TodaysWorkout";
import WeeklySchedule from "../../components/WeeklySchedule/WeeklySchedule";

export default function TimetablePage() {
  const [activeTimetable, setActiveTimetable] = useState(null);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [goal, setGoal] = useState("muscle_gain");
  const [level, setLevel] = useState("intermediate");
  const [timeAvailable, setTimeAvailable] = useState(60);
  const [sportsEnabled, setSportsEnabled] = useState(false);
  const [sport, setSport] = useState("none");

  useEffect(() => {
    loadActiveTimetable();
  }, []);

  async function loadActiveTimetable() {
    try {
      setLoading(true);
      const res = await api.get("/timetable/active");

      if (res.data.active) {
        setActiveTimetable(res.data.timetable);
        setTodaysWorkout(res.data.todaysWorkout);
        setShowGenerator(false);
      } else {
        setShowGenerator(true);
      }
    } catch (err) {
      console.error(err);
      setShowGenerator(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setMessage("");

    try {
      const res = await api.post("/timetable/generate", {
        goal,
        level,
        timeAvailable,
        sportsMode: {
          enabled: sportsEnabled,
          sport: sportsEnabled ? sport : "none",
        },
      });

      setActiveTimetable(res.data.timetable);
      setMessage(res.data.message);
      setShowGenerator(false);
      loadActiveTimetable();

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error generating timetable");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (!activeTimetable) return;

    setGenerating(true);
    setMessage("");

    try {
      const res = await api.post(
        `/timetable/${activeTimetable._id}/regenerate`,
      );

      setActiveTimetable(res.data.timetable);
      setMessage("Timetable regenerated with fresh AI suggestions!");
      loadActiveTimetable();

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error regenerating timetable");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete() {
    if (
      !activeTimetable ||
      !confirm("Are you sure you want to delete this timetable?")
    )
      return;

    try {
      await api.delete(`/timetable/${activeTimetable._id}`);
      setActiveTimetable(null);
      setTodaysWorkout(null);
      setShowGenerator(true);
      setMessage("Timetable deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error deleting timetable");
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading your workout schedule...</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Dumbbell className={styles.icon} />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Workout Timetable</h2>
            <p className={styles.subtitle}>
              AI-powered weekly schedule for your fitness goals
            </p>
          </div>
        </div>

        {activeTimetable && (
          <div className={styles.headerActions}>
            <button className={styles.regenBtn} onClick={handleRegenerate}>
              <RefreshCw className={styles.btnIcon} />
              <span>Regenerate</span>
            </button>
            <button className={styles.deleteBtn} onClick={handleDelete}>
              <Trash2 className={styles.btnIcon} />
            </button>
          </div>
        )}
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={styles.messageBox}>
          <Sparkles className={styles.messageIcon} />
          <p>{message}</p>
        </div>
      )}

      {/* GENERATOR FORM */}
      {showGenerator && (
        <div className={styles.generatorCard}>
          <div className={styles.cardHeader}>
            <Target className={styles.cardIcon} />
            <h3 className={styles.cardTitle}>Generate Your Timetable</h3>
          </div>

          <div className={styles.formGrid}>
            {/* GOAL */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Award className={styles.labelIcon} />
                Fitness Goal
              </label>
              <select
                className={styles.select}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="fat_loss">Fat Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="strength">Strength Building</option>
                <option value="sports_stamina">Sports Stamina</option>
                <option value="general_fitness">General Fitness</option>
              </select>
            </div>

            {/* LEVEL */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <TrendingUp className={styles.labelIcon} />
                Experience Level
              </label>
              <select
                className={styles.select}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* TIME AVAILABLE */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Clock className={styles.labelIcon} />
                Time Available (minutes)
              </label>
              <input
                type="number"
                className={styles.input}
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(Number(e.target.value))}
                min="30"
                max="180"
                step="15"
              />
            </div>

            {/* SPORTS MODE */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={sportsEnabled}
                  onChange={(e) => setSportsEnabled(e.target.checked)}
                />
                <Activity className={styles.labelIcon} />
                <span>Enable Sports Mode</span>
              </label>

              {sportsEnabled && (
                <select
                  className={styles.select}
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  <option value="cricket_bowler">Cricket - Bowler</option>
                  <option value="cricket_batter">Cricket - Batter</option>
                  <option value="football">Football</option>
                  <option value="runner">Runner</option>
                </select>
              )}
            </div>
          </div>

          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className={styles.spinner}></div>
                <span>Generating with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className={styles.btnIcon} />
                <span>Generate AI Timetable</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* TODAY'S WORKOUT */}
      {activeTimetable && todaysWorkout && (
        <TodaysWorkout workout={todaysWorkout} />
      )}

      {/* WEEKLY SCHEDULE */}
      {activeTimetable && (
        <WeeklySchedule
          schedule={activeTimetable.weeklySchedule}
          goal={activeTimetable.goal}
          level={activeTimetable.level}
          timeAvailable={activeTimetable.timeAvailable}
        />
      )}

      {/* INFO BANNER */}
      {!showGenerator && activeTimetable && (
        <div className={styles.infoBanner}>
          <div className={styles.bannerIcon}>
            <Zap />
          </div>
          <div className={styles.bannerContent}>
            <h4 className={styles.bannerTitle}>Pro Tips</h4>
            <ul className={styles.tipsList}>
              <li>Follow the timetable consistently for best results</li>
              <li>Rest days are crucial for muscle recovery</li>
              <li>Stay hydrated and maintain proper nutrition</li>
              <li>Click "Regenerate" anytime for fresh AI suggestions</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
