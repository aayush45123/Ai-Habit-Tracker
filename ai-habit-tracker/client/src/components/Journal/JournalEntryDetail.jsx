import React from "react";
import styles from "./Journal.module.css";
import {
  FiZap,
  FiBook,
  FiMoon,
  FiDroplet,
  FiActivity,
  FiBatteryCharging,
  FiHeart,
  FiFlame,
  FiTarget,
  FiCheckSquare,
  FiAward,
  FiBookOpen,
  FiAlertTriangle,
  FiSmile,
  FiArrowRightCircle,
  FiFileText,
  FiGrid,
  FiTag,
  FiCheck,
} from "react-icons/fi";

const KNOWN_LABELS = {
  topPriorities: "Top Priorities",
  todayGoal: "Today's Goal",
  learningLog: "Learning Log",
  biggestAchievement: "Biggest Achievement",
  mistakesMade: "Mistakes Made",
  challengesFaced: "Challenges Faced",
  lessonsLearned: "Lessons Learned",
  workoutSummary: "Workout Summary",
  gratitude: "Gratitude",
  tomorrowsFocus: "Tomorrow's Focus",
  subjectsStudied: "Subjects Studied",
  studyHours: "Study Hours",
  revisionTopics: "Revision Topics",
  mockTestScore: "Mock Test Score",
  conceptsLearned: "Concepts Learned",
  tomorrowsStudyPlan: "Tomorrow's Study Plan",
  focusRating: "Focus Rating",
  projectWorkedOn: "Project Worked On",
  featuresImplemented: "Features Implemented",
  bugsFixed: "Bugs Fixed",
  pullRequests: "Pull Requests",
  gitCommits: "Git Commits",
  technologiesLearned: "Technologies Learned",
  nextDevGoal: "Next Development Goal",
  productivityRating: "Productivity Rating",
  workoutType: "Workout Type",
  exerciseDuration: "Exercise Duration (mins)",
  caloriesConsumed: "Calories Consumed",
  proteinIntake: "Protein Intake (g)",
  waterIntakeLiters: "Water Intake (L)",
  energyLevelRating: "Energy Level Rating",
  meetingsAttended: "Meetings Attended",
  revenueGenerated: "Revenue Generated",
  expenses: "Expenses",
  leadsGenerated: "Leads Generated",
  followupsCompleted: "Follow-ups Completed",
  biggestWin: "Biggest Win",
  biggestChallenge: "Biggest Challenge",
  tomorrowsPriorities: "Tomorrow's Priorities",
  moodSummary: "Mood Summary",
  todaysReflection: "Today's Reflection",
  gratitudeNotes: "Gratitude Notes",
  memorableMoment: "Memorable Moment",
  thoughtsAndFeelings: "Thoughts & Feelings",
  personalGoal: "Personal Goal",
  freeWriting: "Free Writing",
  dsaSolved: "DSA Problems Solved",
  aptitudeTopic: "Aptitude Topic Studied",
  interviewQuestions: "Interview Questions Practiced",
  resumeUpdates: "Resume / Portfolio Updates",
  projectsWorked: "Projects Worked On",
  codingHours: "Coding Hours",
  applicationsSent: "Applications Sent",
  subjectsCovered: "Subjects Covered",
  questionsSolved: "Questions Solved",
  accuracyRate: "Accuracy Rate (%)",
  weakTopics: "Weak Topics",
  revisionDone: "Revision Done",
  tomorrowsPlan: "Tomorrow's Plan",
  videosPosted: "Videos / Posts Published",
  ideasGenerated: "Ideas Generated",
  editingHours: "Editing & Scripting Hours",
  followersGained: "Followers Gained",
  reachImpressions: "Reach & Impressions",
  engagementRate: "Engagement Rate (%)",
  nextContentPlan: "Next Content Plan",
  income: "Income Received",
  savings: "Savings Added",
  investments: "Investments Made",
  financialGoal: "Financial Goal",
  purchases: "Major Purchases",
  financialNotes: "Financial Notes & Budgets",
};

export function getFieldLabel(key, templates) {
  if (KNOWN_LABELS[key]) return KNOWN_LABELS[key];
  if (templates) {
    const all = [...(templates.systemTemplates || []), ...(templates.customTemplates || [])];
    for (const t of all) {
      const match = t.fields?.find((f) => f.key === key);
      if (match && match.label) return match.label;
    }
  }
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function getTemplateDisplayName(entry, templates) {
  if (!entry) return "Default";
  if (templates) {
    const all = [...(templates.systemTemplates || []), ...(templates.customTemplates || [])];
    if (entry.templateId) {
      const found = all.find((t) => t._id === entry.templateId);
      if (found) return found.name;
    }
    if (entry.templateType) {
      const found = all.find(
        (t) =>
          t._id === `sys_${entry.templateType}` ||
          t.category?.toLowerCase() === entry.templateType?.toLowerCase()
      );
      if (found) return found.name;
    }
  }
  if (!entry.templateType || entry.templateType === "default") return "Daily Reflection";
  return entry.templateType.charAt(0).toUpperCase() + entry.templateType.slice(1);
}

export default function JournalEntryDetail({ entry, templates }) {
  if (!entry) return null;

  // Extract priorities list
  const priorities = Array.isArray(entry.topPriorities)
    ? entry.topPriorities.filter(Boolean)
    : typeof entry.topPriorities === "string" && entry.topPriorities.trim()
    ? entry.topPriorities.split("\n").map((p) => p.trim()).filter(Boolean)
    : [];

  // Extract gratitude list
  const gratitudeList = Array.isArray(entry.gratitude)
    ? entry.gratitude.filter(Boolean)
    : typeof entry.gratitude === "string" && entry.gratitude.trim()
    ? entry.gratitude.split("\n").map((g) => g.trim()).filter(Boolean)
    : [];

  // Extract custom fields
  const customEntries = entry.customFieldsData && typeof entry.customFieldsData === "object"
    ? Object.entries(entry.customFieldsData).filter(
        ([_, v]) => v !== undefined && v !== null && v !== ""
      )
    : [];

  // Check if any reflection highlights exist
  const hasHighlights =
    entry.biggestAchievement ||
    entry.learningLog ||
    entry.lessonsLearned ||
    entry.mistakesMade ||
    entry.challengesFaced ||
    entry.workoutSummary ||
    entry.tomorrowsFocus ||
    gratitudeList.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* ── METRICS & VITALS STRIP ── */}
      <div className={styles.metricsStrip}>
        {entry.productivityHours !== undefined && Number(entry.productivityHours) > 0 && (
          <span className={styles.metricPill} title="Productivity Hours">
            <FiZap size={14} color="#10b981" /> Productivity: {entry.productivityHours}h
          </span>
        )}
        {entry.learningHours !== undefined && Number(entry.learningHours) > 0 && (
          <span className={styles.metricPill} title="Study / Learning Hours">
            <FiBook size={14} color="#3b82f6" /> Study: {entry.learningHours}h
          </span>
        )}
        {entry.sleepHours !== undefined && Number(entry.sleepHours) > 0 && (
          <span className={styles.metricPill} title="Sleep Hours">
            <FiMoon size={14} color="#8b5cf6" /> Sleep: {entry.sleepHours}h
          </span>
        )}
        {entry.energyLevel !== undefined && Number(entry.energyLevel) > 0 && (
          <span className={styles.metricPill} title="Energy Level (1-5)">
            <FiBatteryCharging size={14} color="#eab308" /> Energy: {entry.energyLevel}/5
          </span>
        )}
        {entry.stressLevel !== undefined && Number(entry.stressLevel) > 0 && (
          <span className={styles.metricPill} title="Stress Level (1-5)">
            <FiHeart size={14} color="#ef4444" /> Stress: {entry.stressLevel}/5
          </span>
        )}
        {entry.waterIntake !== undefined && Number(entry.waterIntake) > 0 && (
          <span className={styles.metricPill} title="Water Intake">
            <FiDroplet size={14} color="#06b6d4" /> Water: {entry.waterIntake}L
          </span>
        )}
        {entry.weight !== undefined && Number(entry.weight) > 0 && (
          <span className={styles.metricPill} title="Current Weight">
            <FiActivity size={14} color="#64748b" /> Weight: {entry.weight}kg
          </span>
        )}
        {entry.steps !== undefined && Number(entry.steps) > 0 && (
          <span className={styles.metricPill} title="Steps Walked">
            <FiActivity size={14} color="#10b981" /> Steps: {entry.steps.toLocaleString()}
          </span>
        )}
        {entry.caloriesBurned !== undefined && Number(entry.caloriesBurned) > 0 && (
          <span className={styles.metricPill} title="Calories Burned">
            <FiFlame size={14} color="#f97316" /> Burned: {entry.caloriesBurned} kcal
          </span>
        )}
      </div>

      {/* ── GOAL & PRIORITIES ── */}
      {(entry.todayGoal || priorities.length > 0) && (
        <div className={styles.sectionCard} style={{ borderLeft: "5px solid var(--color-accent-primary, #10b981)" }}>
          {entry.todayGoal && (
            <div>
              <div className={styles.sectionHeader}>
                <FiTarget size={14} color="#10b981" /> Today's Core Goal
              </div>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem", fontWeight: 700 }}>
                {entry.todayGoal}
              </p>
            </div>
          )}

          {priorities.length > 0 && (
            <div style={{ marginTop: entry.todayGoal ? "0.6rem" : 0 }}>
              <div className={styles.sectionHeader}>
                <FiCheckSquare size={14} /> Top Priorities
              </div>
              <ul className={styles.priorityList} style={{ marginTop: "0.4rem" }}>
                {priorities.map((item, idx) => (
                  <li key={idx} className={styles.priorityItem}>
                    <FiCheck size={14} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── FREEFORM WRITING & NOTES ── */}
      {entry.content && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <FiFileText size={14} /> Daily Notes & Reflections
          </div>
          <p className={styles.notesContent}>{entry.content}</p>
        </div>
      )}

      {/* ── STRUCTURED HIGHLIGHTS ── */}
      {hasHighlights && (
        <div className={styles.reflectionsGrid}>
          {entry.biggestAchievement && (
            <div className={styles.reflectionCard}>
              <span className={styles.reflectionLabel}>
                <FiAward size={14} color="#eab308" /> Biggest Achievement
              </span>
              <p className={styles.reflectionText}>{entry.biggestAchievement}</p>
            </div>
          )}

          {entry.learningLog && (
            <div className={styles.reflectionCard}>
              <span className={styles.reflectionLabel}>
                <FiBook size={14} color="#3b82f6" /> Learning Log
              </span>
              <p className={styles.reflectionText}>{entry.learningLog}</p>
            </div>
          )}

          {entry.lessonsLearned && (
            <div className={styles.reflectionCard}>
              <span className={styles.reflectionLabel}>
                <FiBookOpen size={14} color="#10b981" /> Lessons Learned
              </span>
              <p className={styles.reflectionText}>{entry.lessonsLearned}</p>
            </div>
          )}

          {entry.mistakesMade && (
            <div className={styles.reflectionCard}>
              <span className={styles.reflectionLabel}>
                <FiAlertTriangle size={14} color="#ef4444" /> Mistakes Made
              </span>
              <p className={styles.reflectionText}>{entry.mistakesMade}</p>
            </div>
          )}

          {entry.challengesFaced && (
            <div className={styles.reflectionCard}>
              <span className={styles.reflectionLabel}>
                <FiAlertTriangle size={14} color="#f97316" /> Challenges Faced
              </span>
              <p className={styles.reflectionText}>{entry.challengesFaced}</p>
            </div>
          )}

          {entry.workoutSummary && (
            <div className={styles.reflectionCard}>
              <span className={styles.reflectionLabel}>
                <FiActivity size={14} color="#06b6d4" /> Workout Summary
              </span>
              <p className={styles.reflectionText}>{entry.workoutSummary}</p>
            </div>
          )}

          {gratitudeList.length > 0 && (
            <div className={styles.reflectionCard}>
              <span className={styles.reflectionLabel}>
                <FiSmile size={14} color="#ec4899" /> Gratitude
              </span>
              <ul className={styles.priorityList} style={{ marginTop: "0.25rem" }}>
                {gratitudeList.map((g, i) => (
                  <li key={i} className={styles.priorityItem}>
                    <span>• {g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.tomorrowsFocus && (
            <div className={styles.reflectionCard}>
              <span className={styles.reflectionLabel}>
                <FiArrowRightCircle size={14} color="#8b5cf6" /> Tomorrow's Focus
              </span>
              <p className={styles.reflectionText}>{entry.tomorrowsFocus}</p>
            </div>
          )}
        </div>
      )}

      {/* ── TEMPLATE-SPECIFIC & CUSTOM FIELDS ── */}
      {customEntries.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <FiGrid size={14} /> Template Details & Custom Notes
          </div>
          <div className={styles.customFieldsGrid} style={{ marginTop: "0.4rem" }}>
            {customEntries.map(([key, value]) => {
              const label = getFieldLabel(key, templates);
              const displayVal =
                typeof value === "boolean"
                  ? value
                    ? "Yes"
                    : "No"
                  : Array.isArray(value)
                  ? value.join(", ")
                  : String(value);

              return (
                <div key={key} className={styles.customFieldCard}>
                  <span className={styles.customFieldLabel}>{label}</span>
                  <span className={styles.customFieldValue}>{displayVal}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAGS ── */}
      {entry.tags && entry.tags.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
          <FiTag size={13} color="var(--color-text-secondary)" />
          <div className={styles.tagList}>
            {entry.tags.map((t, idx) => (
              <span key={idx} className={styles.tagItem}>
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
