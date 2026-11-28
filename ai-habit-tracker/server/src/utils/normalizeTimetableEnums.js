const VALID_CATEGORIES = [
  "bodybuilding",
  "powerlifting",
  "crossfit",
  "calisthenics",
  "sports_specific",
  "general_fitness",
  "weight_loss",
  "endurance",
];

const VALID_GOALS = [
  "fat_loss",
  "muscle_gain",
  "strength",
  "sports_stamina",
  "general_fitness",
  "endurance",
  "flexibility",
];

const VALID_LEVELS = ["beginner", "intermediate", "advanced"];

export function normalizeCategory(raw) {
  const val = String(raw || "").trim().toLowerCase();
  if (VALID_CATEGORIES.includes(val)) return val;
  if (val.includes("fat") || val.includes("weight_loss") || val.includes("lose")) return "weight_loss";
  if (val.includes("hypertrophy") || val.includes("muscle") || val.includes("bodybuild")) return "bodybuilding";
  if (val.includes("power") || val.includes("strength")) return "powerlifting";
  if (val.includes("crossfit") || val.includes("hiit")) return "crossfit";
  if (val.includes("calisthenic") || val.includes("bodyweight")) return "calisthenics";
  if (val.includes("sport") || val.includes("cricket") || val.includes("athlet")) return "sports_specific";
  if (val.includes("endurance") || val.includes("cardio") || val.includes("run")) return "endurance";
  return "general_fitness";
}

export function normalizeGoal(raw) {
  const val = String(raw || "").trim().toLowerCase();
  if (VALID_GOALS.includes(val)) return val;
  if (val.includes("fat") || val.includes("lose") || val.includes("weight") || val.includes("cut")) return "fat_loss";
  if (val.includes("muscle") || val.includes("hypertrophy") || val.includes("bulk") || val.includes("gain")) return "muscle_gain";
  if (val.includes("strength") || val.includes("power")) return "strength";
  if (val.includes("stamina") || val.includes("sport") || val.includes("cricket")) return "sports_stamina";
  if (val.includes("endurance") || val.includes("cardio")) return "endurance";
  if (val.includes("flex") || val.includes("mobil")) return "flexibility";
  return "general_fitness";
}

export function normalizeLevel(raw) {
  const val = String(raw || "").trim().toLowerCase();
  if (VALID_LEVELS.includes(val)) return val;
  if (val.includes("beginner") || val.includes("new")) return "beginner";
  if (val.includes("advanced") || val.includes("expert") || val.includes("pro")) return "advanced";
  return "intermediate";
}

export function normalizeTimetableEnums({ category, goal, level } = {}) {
  return {
    category: normalizeCategory(category),
    goal: normalizeGoal(goal),
    level: normalizeLevel(level),
  };
}
