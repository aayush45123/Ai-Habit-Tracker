// client/src/components/AIImprovements/AIImprovements.jsx
import React, { useState } from "react";
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Check, 
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Zap
} from "lucide-react";
import styles from "./AIImprovements.module.css";

export default function AIImprovements({ 
  suggestions, 
  assessment, 
  currentSchedule,
  onApplySuggestion 
}) {
  const [expandedSuggestions, setExpandedSuggestions] = useState([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);

  const getPriorityIcon = (priority) => {
    if (priority === "high") return <AlertCircle />;
    if (priority === "medium") return <Info />;
    return <CheckCircle />;
  };

  const toggleExpand = (index) => {
    if (expandedSuggestions.includes(index)) {
      setExpandedSuggestions(expandedSuggestions.filter(i => i !== index));
    } else {
      setExpandedSuggestions([...expandedSuggestions, index]);
    }
  };

  const handleKeepMine = (index) => {
    // Remove from applied if it was applied
    setAppliedSuggestions(appliedSuggestions.filter(i => i !== index));
  };

  const handleKeepAI = (index, suggestion) => {
    // Mark as applied
    if (!appliedSuggestions.includes(index)) {
      setAppliedSuggestions([...appliedSuggestions, index]);
    }
    // Callback to parent to apply the change
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  // Get current plan for a specific day
  const getCurrentDayPlan = (dayName) => {
    if (!currentSchedule) return null;
    return currentSchedule.find(d => d.day === dayName);
  };

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.titleSection}>
        <Zap className={styles.titleIcon} />
        <div>
          <h3 className={styles.title}>AI Analysis & Recommendations</h3>
          <p className={styles.titleSubtext}>
            Compare your plan with AI suggestions and choose what works best
          </p>
        </div>
      </div>

      {/* OVERALL ASSESSMENT */}
      {assessment && (
        <div className={styles.assessment}>
          <div className={styles.assessmentGrid}>
            <div className={styles.assessmentCard}>
              <div className={styles.assessmentHeader}>
                <TrendingUp className={styles.assessmentIcon} />
                <h4 className={styles.assessmentTitle}>Strengths</h4>
              </div>
              <ul className={styles.assessmentList}>
                {assessment.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            
            <div className={styles.assessmentCard}>
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
        </div>
      )}

      {/* SUGGESTIONS WITH COMPARISON */}
      <div className={styles.suggestionsSection}>
        <h4 className={styles.sectionTitle}>
          Specific Recommendations ({suggestions.length})
        </h4>

        <div className={styles.suggestionsList}>
          {suggestions.map((sug, index) => {
            const isExpanded = expandedSuggestions.includes(index);
            const isApplied = appliedSuggestions.includes(index);
            const currentDayPlan = getCurrentDayPlan(sug.day);

            return (
              <div
                key={index}
                className={`${styles.suggestionCard} ${styles[sug.priority]} ${
                  isApplied ? styles.applied : ""
                }`}
              >
                {/* SUGGESTION HEADER */}
                <div className={styles.suggestionHeader}>
                  <div className={styles.suggestionHeaderLeft}>
                    <div className={styles.priorityBadge}>
                      {getPriorityIcon(sug.priority)}
                      <span>{sug.priority.toUpperCase()}</span>
                    </div>
                    <div className={styles.suggestionMeta}>
                      <span className={styles.dayBadge}>{sug.day}</span>
                      <span className={styles.categoryBadge}>
                        {sug.category?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    className={styles.expandBtn}
                    onClick={() => toggleExpand(index)}
                  >
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>

                {/* SUGGESTION TEXT */}
                <p className={styles.suggestionText}>{sug.suggestion}</p>

                {isApplied && (
                  <div className={styles.appliedBadge}>
                    <Check className={styles.appliedIcon} />
                    <span>AI Recommendation Applied</span>
                  </div>
                )}

                {/* EXPANDED COMPARISON VIEW */}
                {isExpanded && (
                  <div className={styles.comparisonSection}>
                    {/* REASON */}
                    {sug.reason && (
                      <div className={styles.reasonBox}>
                        <strong>Why this matters:</strong>
                        <p>{sug.reason}</p>
                      </div>
                    )}

                    {/* COMPARISON */}
                    {currentDayPlan && sug.day !== "General" && (
                      <div className={styles.comparison}>
                        <h5 className={styles.comparisonTitle}>
                          Compare Your Plan vs AI Recommendation
                        </h5>

                        <div className={styles.comparisonGrid}>
                          {/* YOUR PLAN */}
                          <div className={styles.comparisonCard}>
                            <div className={styles.comparisonCardHeader}>
                              <span className={styles.comparisonLabel}>
                                Your Current Plan
                              </span>
                            </div>
                            <div className={styles.comparisonContent}>
                              <p><strong>Focus:</strong> {currentDayPlan.focusArea || "Not set"}</p>
                              <p><strong>Exercises:</strong> {currentDayPlan.exercises?.length || 0}</p>
                              {currentDayPlan.exercises?.slice(0, 3).map((ex, i) => (
                                <p key={i} className={styles.exerciseItem}>
                                  • {ex.name} {ex.sets && `(${ex.sets} sets)`}
                                </p>
                              ))}
                              {currentDayPlan.exercises?.length > 3 && (
                                <p className={styles.moreText}>
                                  +{currentDayPlan.exercises.length - 3} more...
                                </p>
                              )}
                            </div>
                          </div>

                          {/* AI RECOMMENDATION */}
                          <div className={styles.comparisonCard + " " + styles.aiCard}>
                            <div className={styles.comparisonCardHeader}>
                              <span className={styles.comparisonLabel}>
                                AI Recommendation
                              </span>
                            </div>
                            <div className={styles.comparisonContent}>
                              <p className={styles.aiSuggestionDetail}>
                                {sug.suggestion}
                              </p>
                              <div className={styles.benefitsBox}>
                                <strong>Expected Benefits:</strong>
                                <ul>
                                  <li>Better energy distribution</li>
                                  <li>Reduced injury risk</li>
                                  <li>Improved results</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className={styles.actionButtons}>
                      {isApplied ? (
                        <button
                          className={styles.btnKeepMine}
                          onClick={() => handleKeepMine(index)}
                        >
                          <X className={styles.btnIcon} />
                          <span>Undo & Keep My Plan</span>
                        </button>
                      ) : (
                        <>
                          <button
                            className={styles.btnKeepMine}
                            onClick={() => handleKeepMine(index)}
                          >
                            <X className={styles.btnIcon} />
                            <span>Keep My Plan</span>
                          </button>
                          <button
                            className={styles.btnKeepAI}
                            onClick={() => handleKeepAI(index, sug)}
                          >
                            <Check className={styles.btnIcon} />
                            <span>Apply AI Recommendation</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SUMMARY */}
      {appliedSuggestions.length > 0 && (
        <div className={styles.summary}>
          <CheckCircle className={styles.summaryIcon} />
          <p>
            You've applied <strong>{appliedSuggestions.length}</strong> out of{" "}
            <strong>{suggestions.length}</strong> AI recommendations
          </p>
        </div>
      )}
    </div>
  );
}