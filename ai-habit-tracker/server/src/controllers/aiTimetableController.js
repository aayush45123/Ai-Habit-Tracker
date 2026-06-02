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
Generate a detailed 7 day workout timetable.

User Profile:
Goal: ${fitnessGoal}
Level: ${fitnessLevel}
Days Per Week: ${daysPerWeek}
Workout Duration: ${workoutDuration}
Equipment: ${equipment}
Injuries: ${injuries}
Focus Areas: ${focusAreas}
Notes: ${additionalNotes}

Return ONLY valid JSON:

{
  "name":"string",
  "category":"bodybuilding|powerlifting|crossfit|calisthenics|sports_specific|general_fitness|weight_loss|endurance",
  "goal":"fat_loss|muscle_gain|strength|sports_stamina|general_fitness|endurance|flexibility",
  "level":"beginner|intermediate|advanced",
  "weeklySchedule":[]
}

Rules:
- Exactly 7 days
- Rest days => exercises:[]
- Workout days => 3-6 exercises
- No markdown
- No explanation
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
