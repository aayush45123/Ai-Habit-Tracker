import OpenAI from "openai";

function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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

    const groq = createGroqClient();

    const prompt = `
You are an elite strength and conditioning coach.

Generate a COMPLETE 7-day workout timetable.

User Profile:
Goal: ${fitnessGoal}
Level: ${fitnessLevel}
Days Per Week: ${daysPerWeek}
Workout Duration: ${workoutDuration} minutes
Equipment: ${equipment}
Injuries: ${injuries}
Focus Areas: ${focusAreas}
Notes: ${additionalNotes}

Return ONLY VALID JSON.

{
  "name": "Workout Name",
  "category": "sports_specific",
  "goal": "sports_stamina",
  "level": "intermediate",
  "weeklySchedule": [
    {
      "day": "Monday",
      "focusArea": "Lower Body Power",
      "isRestDay": false,
      "startTime": "06:00",
      "endTime": "07:00",
      "exercises": [
        {
          "name": "Barbell Squat",
          "sets": "4",
          "reps": "6",
          "duration": "",
          "restBetweenSets": "90s",
          "notes": "Explosive movement"
        }
      ],
      "timeBlock": {
        "morning": "Mobility",
        "afternoon": "Recovery",
        "evening": "Strength Session",
        "night": "Stretching"
      }
    }
  ]
}

STRICT RULES:

1. weeklySchedule MUST contain exactly 7 days.
2. Every workout day MUST contain 4-8 exercises.
3. Every exercise MUST have a non-empty name.
4. Rest days ONLY when required.
5. Do NOT make all days rest days.
6. For training days:
   - isRestDay = false
   - exercises must contain real exercises.
7. For rest days:
   - isRestDay = true
   - exercises = []
8. Include realistic focus areas.
9. Include realistic morning/evening activities.
10. Output ONLY JSON.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: "Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let raw = completion.choices[0].message.content.trim();

    raw = raw
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(raw);

    parsed.weeklySchedule = DAYS.map((day, index) => {
      const current = parsed.weeklySchedule[index] || {};

      return {
        day,
        focusArea: current.focusArea || "",
        isRestDay: current.isRestDay || false,
        startTime: current.startTime || "",
        endTime: current.endTime || "",
        exercises: current.isRestDay
          ? []
          : (current.exercises || []).filter((e) => e.name?.trim()),
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

    res.status(500).json({
      message: err.message,
    });
  }
};
