// server/src/controllers/aiTimetableController.js
import { completeWithGroq, extractAndParseJSON } from "../utils/aiClient.js";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function generateFallbackTimetable(body) {
  const { fitnessGoal = "general_fitness", fitnessLevel = "beginner" } = body;
  const splitMap = {
    fat_loss: [
      { day: "Monday", focus: "Full Body HIIT & Cardio", isRest: false, exercises: [{ name: "Jumping Jacks", sets: "3", reps: "30s", restBetweenSets: "45s", notes: "Warmup" }, { name: "Bodyweight Squats", sets: "4", reps: "15", restBetweenSets: "60s", notes: "Control form" }, { name: "Push-ups", sets: "3", reps: "10-12", restBetweenSets: "60s", notes: "Knee pushups if needed" }] },
      { day: "Tuesday", focus: "Core & Interval Running", isRest: false, exercises: [{ name: "Plank", sets: "3", reps: "45s", restBetweenSets: "45s", notes: "Keep core tight" }, { name: "Mountain Climbers", sets: "3", reps: "30s", restBetweenSets: "45s", notes: "High pace" }] },
      { day: "Wednesday", focus: "Active Recovery", isRest: true, exercises: [] },
      { day: "Thursday", focus: "Lower Body Conditioning", isRest: false, exercises: [{ name: "Lunges", sets: "3", reps: "12 each", restBetweenSets: "60s", notes: "Step controlled" }, { name: "Glute Bridges", sets: "3", reps: "15", restBetweenSets: "45s", notes: "Squeeze at top" }] },
      { day: "Friday", focus: "Upper Body & Core", isRest: false, exercises: [{ name: "Dumbbell Press / Push-ups", sets: "4", reps: "10", restBetweenSets: "60s", notes: "Steady tempo" }, { name: "Bicycle Crunches", sets: "3", reps: "20", restBetweenSets: "45s", notes: "Slow twists" }] },
      { day: "Saturday", focus: "Endurance Cardio", isRest: false, exercises: [{ name: "Brisk Walk / Jog", sets: "1", reps: "30 mins", restBetweenSets: "None", notes: "Zone 2 cardio" }] },
      { day: "Sunday", focus: "Rest & Recovery", isRest: true, exercises: [] },
    ],
  };

  const defaultDays = splitMap.fat_loss;
  return {
    name: `${fitnessGoal.replace("_", " ")} Plan`,
    category: "general_fitness",
    goal: fitnessGoal,
    level: fitnessLevel,
    weeklySchedule: DAYS.map((day, idx) => {
      const d = defaultDays[idx] || { day, focus: "General Workout", isRest: false, exercises: [] };
      return {
        day,
        focusArea: d.focus,
        isRestDay: d.isRest,
        startTime: d.isRest ? "" : "07:00",
        endTime: d.isRest ? "" : "08:00",
        exercises: d.exercises,
        timeBlock: {
          morning: d.isRest ? "Rest" : "Main Workout",
          afternoon: "Hydration & Walk",
          evening: "Mobility",
          night: "Sleep & Recovery",
        },
      };
    }),
  };
}

export const generateAITimetable = async (req, res) => {
  try {
    const {
      fitnessGoal,
      fitnessLevel,
      daysPerWeek,
      workoutDuration,
      equipment,
      injuries,
      focusAreas,
      additionalNotes,
    } = req.body;

    const prompt = `
You are an elite Strength & Conditioning Coach.
Create a COMPLETE 7-day workout timetable.

USER DETAILS
Fitness Goal: ${fitnessGoal}
Fitness Level: ${fitnessLevel}
Days Per Week: ${daysPerWeek}
Workout Duration: ${workoutDuration}
Available Equipment: ${equipment}
Injuries / Limitations: ${injuries}
Focus Areas: ${focusAreas}
Additional Notes: ${additionalNotes}

WORKOUT GENERATION RULES:
- Generate exactly 7 days (Monday to Sunday)
- Include at least 1 recovery/rest day
- Every training day must contain 4-6 exercises with name, sets, reps, restBetweenSets, notes
- Rest days must have isRestDay: true, exercises: []
- Return ONLY valid JSON matching this schema:
{
  "name": "string",
  "category": "sports_specific | hypertrophy | fat_loss | strength",
  "goal": "${fitnessGoal}",
  "level": "${fitnessLevel}",
  "weeklySchedule": [
    {
      "day": "Monday",
      "focusArea": "string",
      "isRestDay": false,
      "startTime": "18:00",
      "endTime": "19:00",
      "exercises": [
        {
          "name": "string",
          "sets": "string",
          "reps": "string",
          "duration": "string",
          "restBetweenSets": "string",
          "notes": "string"
        }
      ],
      "timeBlock": {
        "morning": "string",
        "afternoon": "string",
        "evening": "string",
        "night": "string"
      }
    }
  ]
}`;

    let parsed = null;
    try {
      const { content } = await completeWithGroq({
        messages: [
          { role: "system", content: "You are a professional fitness planner. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2500,
        jsonMode: true,
      });

      parsed = extractAndParseJSON(content);
    } catch (groqErr) {
      console.warn("Groq timetable error, using fallback timetable:", groqErr.message);
    }

    if (!parsed || !Array.isArray(parsed.weeklySchedule)) {
      parsed = generateFallbackTimetable(req.body);
    }

    parsed.weeklySchedule = DAYS.map((day, index) => {
      const current = parsed.weeklySchedule[index] || {};
      return {
        day,
        focusArea: current.focusArea || "Training",
        isRestDay: Boolean(current.isRestDay),
        startTime: current.startTime || "07:00",
        endTime: current.endTime || "08:00",
        exercises: current.isRestDay
          ? []
          : (current.exercises || []).filter((e) => e && e.name?.trim()),
        timeBlock: {
          morning: current.timeBlock?.morning || "",
          afternoon: current.timeBlock?.afternoon || "",
          evening: current.timeBlock?.evening || "",
          night: current.timeBlock?.night || "",
        },
      };
    });

    res.json(parsed);
  } catch (err) {
    console.error("AI Timetable Error:", err);
    res.json(generateFallbackTimetable(req.body));
  }
};
