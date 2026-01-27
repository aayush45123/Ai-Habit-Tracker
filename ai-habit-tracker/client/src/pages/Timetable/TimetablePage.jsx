// client/src/pages/TimetablePage/TimetablePage.jsx
import React, { useEffect, useState } from "react";
import {
  Dumbbell,
  Sparkles,
  Trash2,
  Plus,
  Target,
  Edit,
  Lightbulb,
} from "lucide-react";
import api from "../../utils/api";
import styles from "./TimetablePage.module.css";
import TodaysWorkout from "../../components/TodaysWorkout/TodaysWorkout";
import WeeklySchedule from "../../components/WeeklySchedule/WeeklySchedule";
import TimetableCreator from "../../components/TimetableCreator/TimetableCreator";
import AIImprovements from "../../components/AIImprovements/AIImprovements";

export default function TimetablePage() {
  const [activeTimetable, setActiveTimetable] = useState(null);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

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
        setShowCreator(false);

        // Load AI improvements if already requested
        if (res.data.timetable.hasRequestedAI) {
          setAiSuggestions(res.data.timetable.aiImprovements || []);
        }
      } else {
        setShowCreator(true);
      }
    } catch (err) {
      console.error(err);
      setShowCreator(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTimetable(timetableData) {
    try {
      setLoading(true);
      const res = await api.post("/timetables/create", timetableData);

      setActiveTimetable(res.data.timetable);
      setShowCreator(false);
      setMessage("Timetable created successfully!");
      loadActiveTimetable();

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error creating timetable");
    } finally {
      setLoading(false);
    }
  }

  async function handleGetAIImprovements() {
    if (!activeTimetable) return;

    setLoadingAI(true);
    setMessage("");

    try {
      const res = await api.post(
        `/timetables/${activeTimetable._id}/ai-improve`,
      );

      setAiSuggestions(res.data.suggestions || []);
      setAiAssessment(res.data.overallAssessment || {});
      setMessage(
        res.data.aiSuccess
          ? "AI analysis complete!"
          : "Analysis complete (using fallback suggestions)",
      );

      // Refresh to get updated timetable with hasRequestedAI flag
      loadActiveTimetable();

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "Error getting AI improvements",
      );
    } finally {
      setLoadingAI(false);
    }
  }

  async function handleDelete() {
    if (
      !activeTimetable ||
      !confirm("Are you sure you want to delete this timetable?")
    )
      return;

    try {
      await api.delete(`/timetables/${activeTimetable._id}`);
      setActiveTimetable(null);
      setTodaysWorkout(null);
      setAiSuggestions(null);
      setAiAssessment(null);
      setShowCreator(true);
      setMessage("Timetable deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error deleting timetable");
    }
  }

  function handleEditTimetable() {
    setShowCreator(true);
  }

  if (loading && !activeTimetable) {
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
              {showCreator
                ? "Create your personalized workout schedule"
                : "Your weekly workout plan"}
            </p>
          </div>
        </div>

        {activeTimetable && !showCreator && (
          <div className={styles.headerActions}>
            {!activeTimetable.hasRequestedAI && (
              <button
                className={styles.aiBtn}
                onClick={handleGetAIImprovements}
                disabled={loadingAI}
              >
                {loadingAI ? (
                  <>
                    <div className={styles.btnSpinner}></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className={styles.btnIcon} />
                    <span>AI Improve</span>
                  </>
                )}
              </button>
            )}
            <button className={styles.editBtn} onClick={handleEditTimetable}>
              <Edit className={styles.btnIcon} />
              <span>Edit</span>
            </button>
            <button className={styles.deleteBtn} onClick={handleDelete}>
              <Trash2 className={styles.btnIcon} />
            </button>
          </div>
        )}

        {!activeTimetable && (
          <button
            className={styles.createBtn}
            onClick={() => setShowCreator(true)}
          >
            <Plus className={styles.btnIcon} />
            <span>Create Timetable</span>
          </button>
        )}
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={styles.messageBox}>
          <Sparkles className={styles.messageIcon} />
          <p>{message}</p>
        </div>
      )}

      {/* CREATOR MODE */}
      {showCreator && (
        <TimetableCreator
          onSave={handleSaveTimetable}
          onCancel={() => {
            setShowCreator(false);
            if (!activeTimetable) {
              loadActiveTimetable();
            }
          }}
          initialData={activeTimetable}
        />
      )}

      {/* VIEW MODE */}
      {!showCreator && activeTimetable && (
        <>
          {/* TIMETABLE INFO */}
          <div className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <Target className={styles.infoIcon} />
              <h3 className={styles.infoTitle}>{activeTimetable.name}</h3>
            </div>
            <div className={styles.infoDetails}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Category:</span>
                <span className={styles.infoValue}>
                  {activeTimetable.category.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Goal:</span>
                <span className={styles.infoValue}>
                  {activeTimetable.goal.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Level:</span>
                <span className={styles.infoValue}>
                  {activeTimetable.level.toUpperCase()}
                </span>
              </div>
              {activeTimetable.sportsMode?.enabled && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Sport:</span>
                  <span className={styles.infoValue}>
                    {activeTimetable.sportsMode.sport
                      .replace("_", " ")
                      .toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI IMPROVEMENTS */}
          {activeTimetable.hasRequestedAI &&
            aiSuggestions &&
            aiSuggestions.length > 0 && (
              <AIImprovements
                suggestions={aiSuggestions}
                assessment={aiAssessment}
              />
            )}

          {/* TODAY'S WORKOUT */}
          {todaysWorkout && <TodaysWorkout workout={todaysWorkout} />}

          {/* WEEKLY SCHEDULE */}
          <WeeklySchedule
            schedule={activeTimetable.weeklySchedule}
            goal={activeTimetable.goal}
            level={activeTimetable.level}
            timeAvailable={activeTimetable.timeAvailable || 60}
          />

          {/* CTA FOR AI IMPROVEMENT */}
          {!activeTimetable.hasRequestedAI && (
            <div className={styles.aiCTA}>
              <div className={styles.ctaIcon}>
                <Lightbulb />
              </div>
              <div className={styles.ctaContent}>
                <h4 className={styles.ctaTitle}>
                  Get AI-Powered Improvement Suggestions
                </h4>
                <p className={styles.ctaText}>
                  Let our AI analyze your workout plan and provide personalized
                  recommendations to optimize your training for better results.
                </p>
                <button
                  className={styles.ctaButton}
                  onClick={handleGetAIImprovements}
                  disabled={loadingAI}
                >
                  {loadingAI ? (
                    <>
                      <div className={styles.btnSpinner}></div>
                      <span>Analyzing Your Program...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className={styles.btnIcon} />
                      <span>Analyze & Improve</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* EMPTY STATE */}
      {!showCreator && !activeTimetable && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Dumbbell />
          </div>
          <h3 className={styles.emptyTitle}>No Active Timetable</h3>
          <p className={styles.emptyText}>
            Create your first workout timetable to start tracking your fitness
            journey.
          </p>
          <button
            className={styles.emptyButton}
            onClick={() => setShowCreator(true)}
          >
            <Plus className={styles.btnIcon} />
            <span>Create Your First Timetable</span>
          </button>
        </div>
      )}
    </div>
  );
}
