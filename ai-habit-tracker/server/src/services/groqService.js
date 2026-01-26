// server/src/services/groqService.js
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generate weekly workout timetable using Groq AI
 */
export async function generateWorkoutTimetable({
  goal,
  level,
  timeAvailable,
  sportsMode,
}) {
  const sportInfo = sportsMode.enabled
    ? `The user also plays ${sportsMode.sport.replace("_", " ")} and needs sport-specific training.`
    : "";

  const prompt = `You are a professional fitness coach and sports trainer. Create a detailed 7-day workout timetable.

USER PROFILE:
- Fitness Goal: ${goal.replace("_", " ").toUpperCase()}
- Experience Level: ${level.toUpperCase()}
- Time Available per Session: ${timeAvailable} minutes
${sportInfo}

REQUIREMENTS:
1. Create a balanced weekly schedule with proper rest days
2. Include specific exercises with sets/reps/duration
3. Add time blocks (Morning/Evening/Night activities)
4. For sports mode, include sport-specific drills and conditioning
5. Ensure progressive overload and recovery

RESPONSE FORMAT (JSON ONLY, NO MARKDOWN):
{
  "weeklySchedule": [
    {
      "day": "Monday",
      "focusArea": "Legs + Core",
      "isRestDay": false,
      "exercises": [
        {
          "name": "Squats",
          "sets": "4",
          "reps": "8-10",
          "duration": "",
          "notes": "Focus on form, go deep"
        }
      ],
      "timeBlock": {
        "morning": "Light stretch + 10 min walk",
        "evening": "Main workout session",
        "night": "Protein shake + 8hr sleep"
      }
    }
  ],
  "tips": ["Tip 1", "Tip 2"],
  "warnings": ["Safety warning 1"]
}

Generate now:`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a professional fitness coach. Always respond with valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    // Remove markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const aiResponse = JSON.parse(cleanedResponse);

    return {
      success: true,
      data: aiResponse,
    };
  } catch (error) {
    console.error("Groq AI Error:", error);
    return {
      success: false,
      error: error.message,
      fallback: generateFallbackTimetable(goal, level, timeAvailable),
    };
  }
}

/**
 * Fallback timetable if AI fails
 */
function generateFallbackTimetable(goal, level, timeAvailable) {
  return {
    weeklySchedule: [
      {
        day: "Monday",
        focusArea: "Upper Body",
        isRestDay: false,
        exercises: [
          {
            name: "Push-ups",
            sets: "3",
            reps: "10-15",
            duration: "",
            notes: "Keep core tight",
          },
          {
            name: "Dumbbell Rows",
            sets: "3",
            reps: "12",
            duration: "",
            notes: "Squeeze shoulder blades",
          },
        ],
        timeBlock: {
          morning: "Light stretch",
          evening: "Main workout",
          night: "Rest + protein",
        },
      },
      {
        day: "Tuesday",
        focusArea: "Lower Body",
        isRestDay: false,
        exercises: [
          {
            name: "Squats",
            sets: "4",
            reps: "10",
            duration: "",
            notes: "Go to parallel",
          },
          {
            name: "Lunges",
            sets: "3",
            reps: "12 each leg",
            duration: "",
            notes: "Control the movement",
          },
        ],
        timeBlock: {
          morning: "Light cardio",
          evening: "Main workout",
          night: "Stretch + sleep",
        },
      },
      {
        day: "Wednesday",
        focusArea: "Cardio + Core",
        isRestDay: false,
        exercises: [
          {
            name: "Running",
            sets: "",
            reps: "",
            duration: "20 min",
            notes: "Moderate pace",
          },
          {
            name: "Planks",
            sets: "3",
            reps: "",
            duration: "45 sec",
            notes: "Keep body straight",
          },
        ],
        timeBlock: {
          morning: "Hydrate well",
          evening: "Cardio session",
          night: "Recovery meal",
        },
      },
      {
        day: "Thursday",
        focusArea: "Active Recovery",
        isRestDay: true,
        exercises: [
          {
            name: "Yoga/Stretching",
            sets: "",
            reps: "",
            duration: "30 min",
            notes: "Focus on flexibility",
          },
        ],
        timeBlock: {
          morning: "Light walk",
          evening: "Yoga/stretch",
          night: "Early sleep",
        },
      },
      {
        day: "Friday",
        focusArea: "Full Body",
        isRestDay: false,
        exercises: [
          {
            name: "Burpees",
            sets: "3",
            reps: "10",
            duration: "",
            notes: "High intensity",
          },
          {
            name: "Mountain Climbers",
            sets: "3",
            reps: "20",
            duration: "",
            notes: "Keep pace steady",
          },
        ],
        timeBlock: {
          morning: "Light jog",
          evening: "HIIT session",
          night: "Protein + rest",
        },
      },
      {
        day: "Saturday",
        focusArea: "Sports/Skills",
        isRestDay: false,
        exercises: [
          {
            name: "Sport Practice",
            sets: "",
            reps: "",
            duration: "60 min",
            notes: "Focus on technique",
          },
        ],
        timeBlock: {
          morning: "Warm-up drills",
          evening: "Practice session",
          night: "Recovery",
        },
      },
      {
        day: "Sunday",
        focusArea: "Rest Day",
        isRestDay: true,
        exercises: [
          {
            name: "Light Walk",
            sets: "",
            reps: "",
            duration: "20 min",
            notes: "Active recovery",
          },
        ],
        timeBlock: {
          morning: "Sleep in",
          evening: "Light activity",
          night: "Meal prep for week",
        },
      },
    ],
    tips: [
      "Stay hydrated throughout the day",
      "Get 7-8 hours of sleep",
      "Listen to your body",
    ],
    warnings: [
      "Stop if you feel pain",
      "Warm up before every session",
      "Consult doctor if unsure",
    ],
  };
}

/**
 * Get today's workout based on current day
 */
export function getTodaysWorkout(weeklySchedule) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const today = days[new Date().getDay()];

  return (
    weeklySchedule.find((day) => day.day === today) || {
      day: today,
      focusArea: "Rest Day",
      isRestDay: true,
      exercises: [],
      timeBlock: {
        morning: "Rest",
        evening: "Light activity",
        night: "Recovery",
      },
    }
  );
}
