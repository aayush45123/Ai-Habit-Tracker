// client/src/components/AIImprovements/AIImprovements.jsx
import React from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import styles from "./AIImprovements.module.css";

export default function AIImprovements({ suggestions, assessment }) {
  const getPriorityIcon = (priority) => {
    if (priority === "high") return <AlertCircle />;
    if (priority === "medium") return <Info />;
    return <CheckCircle />;
  };

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>AI Improvement Suggestions</h3>

      {/* Assessment */}
      {assessment && (
        <div className={styles.assessment}>
          <div className={styles.assessmentSection}>
            <h4>Strengths</h4>
            <ul>
              {assessment.strengths?.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className={styles.assessmentSection}>
            <h4>Areas to Improve</h4>
            <ul>
              {assessment.weaknesses?.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className={styles.suggestions}>
        {suggestions.map((sug, i) => (
          <div
            key={i}
            className={`${styles.suggestion} ${styles[sug.priority]}`}
          >
            <div className={styles.sugHeader}>
              {getPriorityIcon(sug.priority)}
              <span className={styles.sugDay}>{sug.day}</span>
              <span className={styles.sugCategory}>{sug.category}</span>
            </div>
            <p className={styles.sugText}>{sug.suggestion}</p>
            {sug.reason && <p className={styles.sugReason}>💡 {sug.reason}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
