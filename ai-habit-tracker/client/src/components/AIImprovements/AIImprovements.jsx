// client/src/components/AIImprovements/AIImprovements.jsx
import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Info,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import styles from "./AIImprovements.module.css";

export default function AIImprovements({
  suggestions,
  assessment,
  currentSchedule,
  timetableId, // ✅ NEW: Need timetable ID to save decisions
  onApplySuggestion,
  onRejectSuggestion,
}) {
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);
  const [removedSuggestions, setRemovedSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: Load saved decisions from localStorage on mount
  useEffect(() => {
    if (timetableId) {
      const savedData = localStorage.getItem(
        `timetable_decisions_${timetableId}`,
      );
      if (savedData) {
        try {
          const { applied, removed } = JSON.parse(savedData);
          setAppliedSuggestions(applied || []);
          setRemovedSuggestions(removed || []);
        } catch (err) {
          console.error("Error loading saved decisions:", err);
        }
      }
    }
    setLoading(false);
  }, [timetableId]);

  // ✅ NEW: Save decisions to localStorage whenever they change
  useEffect(() => {
    if (timetableId && !loading) {
      const dataToSave = {
        applied: appliedSuggestions,
        removed: removedSuggestions,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        `timetable_decisions_${timetableId}`,
        JSON.stringify(dataToSave),
      );
    }
  }, [appliedSuggestions, removedSuggestions, timetableId, loading]);

  const getPriorityIcon = (priority) => {
    if (priority === "high") return <AlertCircle />;
    if (priority === "medium") return <Info />;
    return <CheckCircle />;
  };

  const handleApply = (suggestionIndex) => {
    if (!appliedSuggestions.includes(suggestionIndex)) {
      setAppliedSuggestions([...appliedSuggestions, suggestionIndex]);
      // Remove from removed if it was there
      setRemovedSuggestions(
        removedSuggestions.filter((i) => i !== suggestionIndex),
      );
      if (onApplySuggestion) {
        onApplySuggestion(suggestions[suggestionIndex]);
      }
    }
  };

  const handleKeepMine = (suggestionIndex) => {
    if (!removedSuggestions.includes(suggestionIndex)) {
      setRemovedSuggestions([...removedSuggestions, suggestionIndex]);
      // Remove from applied if it was there
      setAppliedSuggestions(
        appliedSuggestions.filter((i) => i !== suggestionIndex),
      );
      if (onRejectSuggestion) {
        onRejectSuggestion(suggestions[suggestionIndex]);
      }
    }
  };

  // ✅ NEW: Reset all decisions
  const handleResetAll = () => {
    if (
      confirm(
        "Are you sure you want to reset all your decisions? This will show all suggestions again.",
      )
    ) {
      setAppliedSuggestions([]);
      setRemovedSuggestions([]);
      if (timetableId) {
        localStorage.removeItem(`timetable_decisions_${timetableId}`);
      }
    }
  };

  const isApplied = (index) => appliedSuggestions.includes(index);
  const isRemoved = (index) => removedSuggestions.includes(index);

  const visibleSuggestions = suggestions.filter(
    (_, index) => !isRemoved(index),
  );
  const totalRemaining = visibleSuggestions.length;

  // Get current implementation for a day
  const getCurrentImplementation = (day, category) => {
    if (!currentSchedule) return null;

    const daySchedule = currentSchedule.find((d) => d.day === day);
    if (!daySchedule) return null;

    switch (category) {
      case "exercise_order":
        return daySchedule.exercises
          .map((ex, i) => `${i + 1}. ${ex.name}`)
          .join(", ");
      case "rest_periods":
        return (
          daySchedule.exercises
            .map((ex) =>
              ex.restBetweenSets ? `${ex.name}: ${ex.restBetweenSets}` : null,
            )
            .filter(Boolean)
            .join(", ") || "Not specified"
        );
      case "volume":
        return daySchedule.exercises
          .map((ex) => `${ex.name}: ${ex.sets} sets`)
          .join(", ");
      case "recovery":
        return daySchedule.isRestDay ? "Rest Day" : "Training Day";
      case "timing":
        return `${daySchedule.startTime || "Not set"} - ${daySchedule.endTime || "Not set"}`;
      default:
        return daySchedule.focusArea || "General";
    }
  };

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your AI recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Lightbulb />
        </div>
        <div className={styles.headerText}>
          <h3 className={styles.title}>AI Improvement Analysis</h3>
          <p className={styles.subtitle}>
            Review {totalRemaining} recommendation
            {totalRemaining !== 1 ? "s" : ""} and choose what works best for you
          </p>
        </div>
        {/* ✅ NEW: Reset button */}
        {(appliedSuggestions.length > 0 || removedSuggestions.length > 0) && (
          <button className={styles.resetBtn} onClick={handleResetAll}>
            <X className={styles.resetIcon} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* OVERALL ASSESSMENT */}
      {assessment && (
        <div className={styles.assessment}>
          <div className={styles.assessmentSection}>
            <div className={styles.assessmentHeader}>
              <ThumbsUp className={styles.assessmentIcon} />
              <h4 className={styles.assessmentTitle}>Strengths</h4>
            </div>
            <ul className={styles.assessmentList}>
              {assessment.strengths?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className={styles.assessmentSection}>
            <div className={styles.assessmentHeader}>
              <AlertCircle className={styles.assessmentIcon} />
              <h4 className={styles.assessmentTitle}>Areas to Improve</h4>
            </div>
            <ul className={styles.assessmentList}>
              {assessment.weaknesses?.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* SUGGESTIONS WITH COMPARISON */}
      <div className={styles.suggestionsSection}>
        <h4 className={styles.sectionTitle}>
          Detailed Recommendations ({totalRemaining})
        </h4>

        {totalRemaining === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle className={styles.emptyIcon} />
            <h5 className={styles.emptyTitle}>All Recommendations Reviewed!</h5>
            <p className={styles.emptyText}>
              You've reviewed all AI suggestions. You applied{" "}
              {appliedSuggestions.length} and kept your original plan for{" "}
              {removedSuggestions.length}.
            </p>
            <button className={styles.emptyResetBtn} onClick={handleResetAll}>
              <X className={styles.btnIcon} />
              <span>Reset & Review Again</span>
            </button>
          </div>
        ) : (
          <div className={styles.suggestions}>
            {suggestions.map((sug, originalIndex) => {
              if (isRemoved(originalIndex)) return null;

              return (
                <div
                  key={originalIndex}
                  className={`${styles.suggestion} ${styles[sug.priority]} ${
                    isApplied(originalIndex) ? styles.applied : ""
                  }`}
                >
                  {/* SUGGESTION HEADER */}
                  <div className={styles.sugHeader}>
                    <div className={styles.sugMeta}>
                      {getPriorityIcon(sug.priority)}
                      <span className={styles.sugDay}>{sug.day}</span>
                      <span className={styles.sugCategory}>
                        {sug.category.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.sugStatus}>
                      {isApplied(originalIndex) && (
                        <span className={styles.statusApplied}>
                          <Check size={16} /> Applied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI RECOMMENDATION */}
                  <div className={styles.sugContent}>
                    <div className={styles.sugRecommendation}>
                      <div className={styles.recommendationLabel}>
                        <AlertCircle size={16} />
                        <span>AI Recommendation</span>
                      </div>
                      <p className={styles.sugText}>{sug.suggestion}</p>
                    </div>

                    {sug.reason && (
                      <div className={styles.sugReason}>
                        <Lightbulb size={16} />
                        <span>{sug.reason}</span>
                      </div>
                    )}
                  </div>

                  {/* COMPARISON: YOUR CURRENT vs AI SUGGESTION */}
                  {sug.day !== "General" && (
                    <div className={styles.comparison}>
                      <div className={styles.comparisonItem}>
                        <div className={styles.comparisonLabel}>
                          <span className={styles.labelDot}></span>
                          Your Current Plan
                        </div>
                        <div className={styles.comparisonContent}>
                          {getCurrentImplementation(sug.day, sug.category) ||
                            "Not set"}
                        </div>
                      </div>

                      <div className={styles.comparisonArrow}>
                        <ArrowRight />
                      </div>

                      <div className={styles.comparisonItem}>
                        <div className={styles.comparisonLabel}>
                          <span
                            className={styles.labelDot + " " + styles.aiDot}
                          ></span>
                          AI Suggests
                        </div>
                        <div
                          className={
                            styles.comparisonContent + " " + styles.aiContent
                          }
                        >
                          {sug.suggestion}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  {!isApplied(originalIndex) && (
                    <div className={styles.sugActions}>
                      <button
                        className={styles.btnReject}
                        onClick={() => handleKeepMine(originalIndex)}
                      >
                        <X className={styles.btnIcon} />
                        <span>Keep Mine & Remove</span>
                      </button>
                      <button
                        className={styles.btnApply}
                        onClick={() => handleApply(originalIndex)}
                      >
                        <Check className={styles.btnIcon} />
                        <span>Apply AI Suggestion</span>
                      </button>
                    </div>
                  )}

                  {/* APPLIED MESSAGE */}
                  {isApplied(originalIndex) && (
                    <div className={styles.appliedMessage}>
                      <Check />
                      <span>
                        This suggestion has been noted. Click{" "}
                        <strong>EDIT</strong> above to manually update your
                        schedule.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon + " " + styles.summaryApplied}>
            <ThumbsUp />
          </div>
          <div className={styles.summaryText}>
            <span className={styles.summaryNumber}>
              {appliedSuggestions.length}
            </span>
            <span className={styles.summaryLabel}>AI Suggestions Applied</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon + " " + styles.summaryRejected}>
            <ThumbsDown />
          </div>
          <div className={styles.summaryText}>
            <span className={styles.summaryNumber}>
              {removedSuggestions.length}
            </span>
            <span className={styles.summaryLabel}>Kept Original & Removed</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon + " " + styles.summaryPending}>
            <AlertCircle />
          </div>
          <div className={styles.summaryText}>
            <span className={styles.summaryNumber}>
              {totalRemaining -
                appliedSuggestions.filter((i) => !isRemoved(i)).length}
            </span>
            <span className={styles.summaryLabel}>Pending Review</span>
          </div>
        </div>
      </div>

      {/* NOTE */}
      {totalRemaining > 0 && (
        <div className={styles.note}>
          <Info className={styles.noteIcon} />
          <p className={styles.noteText}>
            <strong>How it works:</strong> Your decisions are automatically
            saved. Click "Keep Mine & Remove" to dismiss suggestions you don't
            want. Click "Apply AI Suggestion" to mark recommendations you plan
            to implement. Then use the <strong>EDIT</strong> button to manually
            update your schedule.
          </p>
        </div>
      )}
    </div>
  );
}
