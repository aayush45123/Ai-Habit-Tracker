import OpenAI from "openai";

function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return null;
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

    if (!groq) {
      return res.status(500).json({
        message:
          "GROQ_API_KEY not set. Add it to enable AI timetable generation.",
      });
    }

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

WORKOUT GENERATION RULES

- Generate exactly 7 days (Monday to Sunday)
- Include at least 1 recovery/rest day
- Every training day must contain 5-8 exercises
- Every exercise must have sets, reps, restBetweenSets and notes
- Use realistic gym exercises
- Use proper focus areas
- Include start and end times
- Include morning, afternoon, evening and night time blocks
- Focus on balanced programming
- Do not repeat the same workout every day
- If goal is Sports Stamina, prioritize athletic performance, conditioning and mobility
- If goal is Fat Loss, include conditioning and calorie-burning work
- If goal is Muscle Gain, include progressive strength training
- If goal is Strength, prioritize compound lifts

WORKOUT SPLIT EXAMPLE

Monday:
Lower Body Strength

Tuesday:
Upper Body Strength

Wednesday:
Conditioning + Core

Thursday:
Lower Body Power

Friday:
Upper Body + Mobility

Saturday:
Sports Conditioning

Sunday:
Recovery

RETURN ONLY VALID JSON

{
  "name": "string",
  "category": "sports_specific",
  "goal": "sports_stamina",
  "level": "intermediate",
  "weeklySchedule": [
    {
      "day": "Monday",
      "focusArea": "Lower Body Strength",
      "isRestDay": false,
      "startTime": "18:00",
      "endTime": "19:30",
      "exercises": [
        {
          "name": "Barbell Squat",
          "sets": "4",
          "reps": "6-8",
          "duration": "",
          "restBetweenSets": "90s",
          "notes": "Control the movement"
        }
      ],
      "timeBlock": {
        "morning": "Mobility",
        "afternoon": "Work/Study",
        "evening": "Main Workout",
        "night": "Stretching"
      }
    }
  ]
}

STRICT VALIDATION

1. weeklySchedule must contain EXACTLY 7 objects.
2. Each object must contain:
   day
   focusArea
   isRestDay
   startTime
   endTime
   exercises
   timeBlock
3. Training days must contain 5-8 exercises.
4. Exercise names cannot be empty.
5. Rest days must have:
   isRestDay=true
   exercises=[]
6. Output ONLY JSON.
7. No markdown.
8. No explanation.
9. No code block.
10. No text before or after JSON.
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
    console.log(JSON.stringify(parsed, null, 2));

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
