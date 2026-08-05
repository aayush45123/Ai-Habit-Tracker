import JournalEntry from "../models/JournalEntry.js";
import JournalTemplate from "../models/JournalTemplate.js";
import {
  generateJournalAnalytics,
  generateWeeklyReport,
  generateMonthlyReport,
} from "../services/journalAnalytics.service.js";
import { getTodayIST } from "../utils/getTodayIST.js";

// System Pre-built Templates (10 Professional Templates)
const SYSTEM_TEMPLATES = [
  {
    _id: "sys_default",
    name: "Default Daily Reflection",
    description: "Comprehensive daily tracking of productivity, learning, health, and personal reflections.",
    category: "System",
    icon: "FiBookOpen",
    isSystem: true,
    fields: [
      { key: "topPriorities", label: "Top 3 Priorities", type: "textarea" },
      { key: "todayGoal", label: "Today's Goal", type: "text" },
      { key: "learningLog", label: "Learning Log", type: "textarea" },
      { key: "biggestAchievement", label: "Biggest Achievement", type: "text" },
      { key: "mistakesMade", label: "Mistakes Made", type: "text" },
      { key: "challengesFaced", label: "Challenges Faced", type: "textarea" },
      { key: "lessonsLearned", label: "Lessons Learned", type: "textarea" },
      { key: "workoutSummary", label: "Workout Summary", type: "text" },
      { key: "gratitude", label: "Gratitude", type: "textarea" },
      { key: "tomorrowsFocus", label: "Tomorrow's Focus", type: "text" },
    ],
  },
  {
    _id: "sys_student",
    name: "Student Template",
    description: "Designed for students preparing for school, college, competitive exams, or certifications.",
    category: "Student",
    icon: "FiBook",
    isSystem: true,
    fields: [
      { key: "subjectsStudied", label: "Subjects Studied", type: "text" },
      { key: "studyHours", label: "Study Hours", type: "number" },
      { key: "revisionTopics", label: "Revision Topics", type: "textarea" },
      { key: "mockTestScore", label: "Mock Test Score", type: "text" },
      { key: "mistakesMade", label: "Mistakes Made", type: "textarea" },
      { key: "conceptsLearned", label: "Concepts Learned", type: "textarea" },
      { key: "tomorrowsStudyPlan", label: "Tomorrow's Study Plan", type: "text" },
      { key: "focusRating", label: "Focus Rating (1–5)", type: "rating" },
    ],
  },
  {
    _id: "sys_developer",
    name: "Developer Template",
    description: "Track coding progress, projects, debugging sessions, GitHub activity, and technical learning.",
    category: "Developer",
    icon: "FiCode",
    isSystem: true,
    fields: [
      { key: "projectWorkedOn", label: "Project Worked On", type: "text" },
      { key: "featuresImplemented", label: "Features Implemented", type: "textarea" },
      { key: "bugsFixed", label: "Bugs Fixed", type: "textarea" },
      { key: "pullRequests", label: "Pull Requests", type: "text" },
      { key: "gitCommits", label: "Git Commits", type: "number" },
      { key: "technologiesLearned", label: "Technologies Learned", type: "text" },
      { key: "challengesFaced", label: "Challenges Faced", type: "textarea" },
      { key: "nextDevGoal", label: "Next Development Goal", type: "text" },
      { key: "productivityRating", label: "Productivity Rating (1–5)", type: "rating" },
    ],
  },
  {
    _id: "sys_fitness",
    name: "Fitness & Wellness",
    description: "Record workouts, nutrition, recovery, hydration, and body progress for long-term fitness tracking.",
    category: "Fitness",
    icon: "FiActivity",
    isSystem: true,
    fields: [
      { key: "workoutType", label: "Workout Type", type: "text" },
      { key: "exerciseDuration", label: "Exercise Duration (mins)", type: "number" },
      { key: "caloriesBurned", label: "Calories Burned", type: "number" },
      { key: "caloriesConsumed", label: "Calories Consumed", type: "number" },
      { key: "proteinIntake", label: "Protein Intake (g)", type: "number" },
      { key: "currentWeight", label: "Current Weight (kg)", type: "number" },
      { key: "waterIntakeLiters", label: "Water Intake (L)", type: "number" },
      { key: "sleepHours", label: "Sleep Hours", type: "number" },
      { key: "dailySteps", label: "Daily Steps", type: "number" },
      { key: "energyLevelRating", label: "Energy Level (1–5)", type: "rating" },
    ],
  },
  {
    _id: "sys_business",
    name: "Business & Career",
    description: "Track work performance, meetings, sales, networking, revenue, and career development.",
    category: "Business",
    icon: "FiBriefcase",
    isSystem: true,
    fields: [
      { key: "meetingsAttended", label: "Meetings Attended", type: "number" },
      { key: "revenueGenerated", label: "Revenue Generated", type: "number" },
      { key: "expenses", label: "Expenses", type: "number" },
      { key: "leadsGenerated", label: "Leads Generated", type: "text" },
      { key: "followupsCompleted", label: "Follow-ups Completed", type: "number" },
      { key: "biggestWin", label: "Biggest Win", type: "text" },
      { key: "biggestChallenge", label: "Biggest Challenge", type: "textarea" },
      { key: "lessonsLearned", label: "Lessons Learned", type: "textarea" },
      { key: "tomorrowsPriorities", label: "Tomorrow's Priorities", type: "text" },
    ],
  },
  {
    _id: "sys_personal",
    name: "Personal Journal",
    description: "A flexible journaling template focused on emotions, gratitude, personal reflection, and memorable life events.",
    category: "Personal",
    icon: "FiHeart",
    isSystem: true,
    fields: [
      { key: "moodSummary", label: "Mood", type: "text" },
      { key: "todaysReflection", label: "Today's Reflection", type: "textarea" },
      { key: "gratitudeNotes", label: "Gratitude", type: "textarea" },
      { key: "memorableMoment", label: "Memorable Moment", type: "text" },
      { key: "thoughtsAndFeelings", label: "Thoughts & Feelings", type: "textarea" },
      { key: "personalGoal", label: "Personal Goal", type: "text" },
      { key: "freeWriting", label: "Free Writing", type: "textarea" },
    ],
  },
  {
    _id: "sys_placement",
    name: "Placement Preparation",
    description: "Tailored for campus placements, technical interview prep, DSA practice, resume building, and job applications.",
    category: "Placement",
    icon: "FiTarget",
    isSystem: true,
    fields: [
      { key: "dsaSolved", label: "DSA Problems Solved", type: "number" },
      { key: "aptitudeTopic", label: "Aptitude Topic Studied", type: "text" },
      { key: "interviewQuestions", label: "Interview Questions Practiced", type: "textarea" },
      { key: "resumeUpdates", label: "Resume / Portfolio Updates", type: "text" },
      { key: "projectsWorked", label: "Projects Worked On", type: "text" },
      { key: "codingHours", label: "Coding Hours", type: "number" },
      { key: "learningHours", label: "Learning Hours", type: "number" },
      { key: "applicationsSent", label: "Applications Sent", type: "number" },
    ],
  },
  {
    _id: "sys_exam",
    name: "Competitive Exam Preparation",
    description: "Perfect for JEE, GATE, UPSC, CAT, GRE, Placement Prep, and competitive examination tracking.",
    category: "Competitive Exam",
    icon: "FiAward",
    isSystem: true,
    fields: [
      { key: "subjectsCovered", label: "Subjects Covered", type: "text" },
      { key: "questionsSolved", label: "Questions Solved", type: "number" },
      { key: "accuracyRate", label: "Accuracy Rate (%)", type: "number" },
      { key: "weakTopics", label: "Weak Topics Needing Revision", type: "textarea" },
      { key: "mockTestScore", label: "Mock Test Score", type: "text" },
      { key: "revisionDone", label: "Revision Done", type: "textarea" },
      { key: "studyHours", label: "Study Hours", type: "number" },
      { key: "tomorrowsPlan", label: "Tomorrow's Plan", type: "text" },
    ],
  },
  {
    _id: "sys_creator",
    name: "Content Creator",
    description: "Track videos posted, editing hours, content ideas, followers gained, engagement rate, and channel planning.",
    category: "Content Creator",
    icon: "FiVideo",
    isSystem: true,
    fields: [
      { key: "videosPosted", label: "Videos / Posts Published", type: "number" },
      { key: "ideasGenerated", label: "Ideas Generated", type: "textarea" },
      { key: "editingHours", label: "Editing & Scripting Hours", type: "number" },
      { key: "followersGained", label: "Followers Gained", type: "number" },
      { key: "reachImpressions", label: "Reach & Impressions", type: "text" },
      { key: "engagementRate", label: "Engagement Rate (%)", type: "text" },
      { key: "nextContentPlan", label: "Next Content Plan", type: "text" },
    ],
  },
  {
    _id: "sys_finance",
    name: "Finance & Expense Tracker",
    description: "Manage daily income, expenses, savings, investments, financial goals, and major purchases.",
    category: "Finance",
    icon: "FiDollarSign",
    isSystem: true,
    fields: [
      { key: "income", label: "Income Received", type: "number" },
      { key: "expenses", label: "Daily Expenses", type: "number" },
      { key: "savings", label: "Savings Added", type: "number" },
      { key: "investments", label: "Investments Made", type: "number" },
      { key: "financialGoal", label: "Financial Goal", type: "text" },
      { key: "purchases", label: "Major Purchases", type: "textarea" },
      { key: "financialNotes", label: "Financial Notes & Budgets", type: "textarea" },
    ],
  },
];

/**
 * Get or create daily entry for date
 */
export async function getEntryByDate(req, res) {
  try {
    const userId = req.user._id || req.user;
    const date = req.params.date || getTodayIST();

    let entry = await JournalEntry.findOne({ userId, date });
    if (!entry) {
      return res.json({ entry: null, exists: false, date });
    }

    res.json({ entry, exists: true, date });
  } catch (err) {
    console.error("Error fetching journal entry by date:", err);
    res.status(500).json({ message: "Failed to fetch journal entry" });
  }
}

/**
 * Create or Update Journal Entry
 */
export async function createOrUpdateEntry(req, res) {
  try {
    const userId = req.user._id || req.user;
    const {
      date = getTodayIST(),
      templateId,
      templateType = "default",
      title = "",
      content = "",
      mood = "good",
      moodScore = 4,
      energyLevel = 3,
      stressLevel = 2,
      productivityHours = 0,
      learningHours = 0,
      sleepHours = 0,
      waterIntake = 0,
      weight = 0,
      steps = 0,
      caloriesBurned = 0,
      workoutSummary = "",
      topPriorities = [],
      todayGoal = "",
      learningLog = "",
      biggestAchievement = "",
      mistakesMade = "",
      challengesFaced = "",
      lessonsLearned = "",
      gratitude = [],
      tomorrowsFocus = "",
      tags = [],
      customFieldsData = {},
    } = req.body;

    const payload = {
      userId,
      date,
      templateId,
      templateType,
      title,
      content,
      mood,
      moodScore,
      energyLevel,
      stressLevel,
      productivityHours,
      learningHours,
      sleepHours,
      waterIntake,
      weight,
      steps,
      caloriesBurned,
      workoutSummary,
      topPriorities: Array.isArray(topPriorities) ? topPriorities : [topPriorities].filter(Boolean),
      todayGoal,
      learningLog,
      biggestAchievement,
      mistakesMade,
      challengesFaced,
      lessonsLearned,
      gratitude: Array.isArray(gratitude) ? gratitude : [gratitude].filter(Boolean),
      tomorrowsFocus,
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
      customFieldsData,
    };

    const entry = await JournalEntry.findOneAndUpdate(
      { userId, date },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ message: "Journal entry saved successfully", entry });
  } catch (err) {
    console.error("Error saving journal entry:", err);
    res.status(500).json({ message: "Failed to save journal entry", error: err.message });
  }
}

/**
 * Query Journal Entries (Feed/Timeline with Filters)
 */
export async function getEntries(req, res) {
  try {
    const userId = req.user._id || req.user;
    const { search, mood, tag, templateType, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = { userId };

    if (mood) filter.mood = mood;
    if (templateType) filter.templateType = templateType;
    if (tag) filter.tags = tag;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { learningLog: { $regex: search, $options: "i" } },
        { biggestAchievement: { $regex: search, $options: "i" } },
        { lessonsLearned: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const entries = await JournalEntry.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await JournalEntry.countDocuments(filter);

    res.json({
      entries,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (err) {
    console.error("Error listing journal entries:", err);
    res.status(500).json({ message: "Failed to load journal feed" });
  }
}

/**
 * Delete Journal Entry
 */
export async function deleteEntry(req, res) {
  try {
    const userId = req.user._id || req.user;
    const { id } = req.params;

    const deleted = await JournalEntry.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    res.json({ message: "Journal entry deleted successfully", id });
  } catch (err) {
    console.error("Error deleting journal entry:", err);
    res.status(500).json({ message: "Failed to delete entry" });
  }
}

/**
 * Get Journal Templates (System + User Custom)
 */
export async function getTemplates(req, res) {
  try {
    const userId = req.user._id || req.user;
    const customTemplates = await JournalTemplate.find({ userId }).sort({ createdAt: -1 });

    res.json({
      systemTemplates: SYSTEM_TEMPLATES,
      customTemplates,
    });
  } catch (err) {
    console.error("Error fetching templates:", err);
    res.status(500).json({ message: "Failed to load templates" });
  }
}

/**
 * Create Custom Template
 */
export async function createCustomTemplate(req, res) {
  try {
    const userId = req.user._id || req.user;
    const { name, description, category = "Custom", icon = "FiBookOpen", fields = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Template name is required" });
    }

    const template = await JournalTemplate.create({
      userId,
      name,
      description,
      category,
      icon,
      isSystem: false,
      fields,
    });

    res.json({ message: "Custom template created", template });
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ message: "Failed to create custom template" });
  }
}

/**
 * Update Custom Template
 */
export async function updateCustomTemplate(req, res) {
  try {
    const userId = req.user._id || req.user;
    const { id } = req.params;

    const updated = await JournalTemplate.findOneAndUpdate(
      { _id: id, userId },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Custom template not found" });
    }

    res.json({ message: "Template updated", template: updated });
  } catch (err) {
    console.error("Error updating template:", err);
    res.status(500).json({ message: "Failed to update template" });
  }
}

/**
 * Delete Custom Template
 */
export async function deleteCustomTemplate(req, res) {
  try {
    const userId = req.user._id || req.user;
    const { id } = req.params;

    const deleted = await JournalTemplate.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ message: "Custom template not found" });
    }

    res.json({ message: "Custom template deleted", id });
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ message: "Failed to delete template" });
  }
}

/**
 * Get Analytics & Correlations
 */
export async function getAnalytics(req, res) {
  try {
    const userId = req.user._id || req.user;
    const analytics = await generateJournalAnalytics(userId);
    res.json(analytics);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ message: "Failed to generate journal analytics" });
  }
}

/**
 * Get Weekly Report
 */
export async function getWeeklyReport(req, res) {
  try {
    const userId = req.user._id || req.user;
    const report = await generateWeeklyReport(userId);
    res.json(report);
  } catch (err) {
    console.error("Error generating weekly report:", err);
    res.status(500).json({ message: "Failed to generate weekly report" });
  }
}

/**
 * Get Monthly Report
 */
export async function getMonthlyReport(req, res) {
  try {
    const userId = req.user._id || req.user;
    const report = await generateMonthlyReport(userId);
    res.json(report);
  } catch (err) {
    console.error("Error generating monthly report:", err);
    res.status(500).json({ message: "Failed to generate monthly report" });
  }
}
