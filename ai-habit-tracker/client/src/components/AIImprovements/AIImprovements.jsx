// client/src/components/AIImprovements/AIImprovements.jsx
import React, { useState } from "react";
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
  onApplySuggestion,
  onRejectSuggestion,
}) {
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);
  const [rejectedSuggestions, setRejectedSuggestions] = useState([]);

  const getPriorityIcon = (priority) => {
    if (priority === "high") return <AlertCircle />;
    if (priority === "medium") return <Info />;
    return <CheckCircle />;
  };

  const handleApply = (suggestionIndex) => {
    if (!appliedSuggestions.includes(suggestionIndex)) {
      setAppliedSuggestions([...appliedSuggestions, suggestionIndex]);
      setRejectedSuggestions(
        rejectedSuggestions.filter((i) => i !== suggestionIndex),
      );
      if (onApplySuggestion) {
        onApplySuggestion(suggestions[suggestionIndex]);
      }
    }
  };

  const handleReject = (suggestionIndex) => {
    if (!rejectedSuggestions.includes(suggestionIndex)) {
      setRejectedSuggestions([...rejectedSuggestions, suggestionIndex]);
      setAppliedSuggestions(
        appliedSuggestions.filter((i) => i !== suggestionIndex),
      );
      if (onRejectSuggestion) {
        onRejectSuggestion(suggestions[suggestionIndex]);
      }
    }
  };

  const isApplied = (index) => appliedSuggestions.includes(index);
  const isRejected = (index) => rejectedSuggestions.includes(index);

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
            Review recommendations and choose what works best for you
          </p>
        </div>
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
          Detailed Recommendations ({suggestions.length})
        </h4>

        <div className={styles.suggestions}>
          {suggestions.map((sug, i) => (
            <div
              key={i}
              className={`${styles.suggestion} ${styles[sug.priority]} ${
                isApplied(i) ? styles.applied : ""
              } ${isRejected(i) ? styles.rejected : ""}`}
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
                  {isApplied(i) && (
                    <span className={styles.statusApplied}>
                      <Check size={16} /> Applied
                    </span>
                  )}
                  {isRejected(i) && (
                    <span className={styles.statusRejected}>
                      <X size={16} /> Kept Original
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
              {!isApplied(i) && !isRejected(i) && (
                <div className={styles.sugActions}>
                  <button
                    className={styles.btnReject}
                    onClick={() => handleReject(i)}
                  >
                    <ThumbsDown className={styles.btnIcon} />
                    <span>Keep Mine</span>
                  </button>
                  <button
                    className={styles.btnApply}
                    onClick={() => handleApply(i)}
                  >
                    <ThumbsUp className={styles.btnIcon} />
                    <span>Apply AI Suggestion</span>
                  </button>
                </div>
              )}

              {/* APPLIED/REJECTED MESSAGE */}
              {isApplied(i) && (
                <div className={styles.appliedMessage}>
                  <Check />
                  <span>
                    This suggestion has been noted. Remember to manually update
                    your schedule accordingly.
                  </span>
                </div>
              )}
              {isRejected(i) && (
                <div className={styles.rejectedMessage}>
                  <Info />
                  <span>Your original plan will be kept for this aspect.</span>
                </div>
              )}
            </div>
          ))}
        </div>
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
              {rejectedSuggestions.length}
            </span>
            <span className={styles.summaryLabel}>Kept Original</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon + " " + styles.summaryPending}>
            <AlertCircle />
          </div>
          <div className={styles.summaryText}>
            <span className={styles.summaryNumber}>
              {suggestions.length -
                appliedSuggestions.length -
                rejectedSuggestions.length}
            </span>
            <span className={styles.summaryLabel}>Pending Review</span>
          </div>
        </div>
      </div>

      {/* NOTE */}
      <div className={styles.note}>
        <Info className={styles.noteIcon} />
        <p className={styles.noteText}>
          <strong>Note:</strong> Clicking "Apply AI Suggestion" marks your
          preference. To actually implement changes, click the{" "}
          <strong>EDIT</strong> button above and modify your schedule manually
          based on the recommendations you've accepted.
        </p>
      </div>
    </div>
  );
}
