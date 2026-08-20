// server/src/services/groqService.js - FINAL FIXED VERSION
import dotenv from "dotenv";
import { completeWithGroq, extractAndParseJSON } from "../utils/aiClient.js";
dotenv.config();

/**
 * Generate AI improvement suggestions for existing timetable
 */
export async function generateImprovementSuggestions({
  category = "general",
  goal = "fitness",
  level = "beginner",
  sportsMode = { enabled: false },
  weeklySchedule = [],
}) {
  const sportInfo = sportsMode?.enabled
    ? `The user also plays ${sportsMode.sport?.replace("_", " ")} competitively.`
    : "";

  // Format current schedule for AI
  const scheduleText = weeklySchedule
    .map((day) => {
      const exercisesList = (day.exercises || [])
        .map(
          (ex, idx) =>
            `${idx + 1}. ${ex.name} - ${ex.sets || "?"} sets × ${ex.reps || ex.duration || "?"} ${ex.restBetweenSets ? `(rest: ${ex.restBetweenSets})` : ""}`,
        )
        .join("\n   ");

      return `${day.day} (${day.focusArea})${day.isRestDay ? " - REST DAY" : ""}:
   Time: ${day.startTime || "Not set"} - ${day.endTime || "Not set"}
   ${exercisesList || "No exercises"}`;
    })
    .join("\n\n");

  const prompt = `You are an expert fitness coach analyzing a workout timetable. Review this user's training plan and provide SPECIFIC, ACTIONABLE improvement suggestions.

USER PROFILE:
- Training Category: ${category?.replace("_", " ")?.toUpperCase() || "GENERAL"}
- Fitness Goal: ${goal?.replace("_", " ")?.toUpperCase() || "FITNESS"}
- Experience Level: ${level?.toUpperCase() || "BEGINNER"}
${sportInfo}

CURRENT WEEKLY SCHEDULE:
${scheduleText}

CRITICAL RULES:
1. You MUST provide EXACTLY ONE suggestion per day (7 suggestions total for Monday-Sunday)
2. NEVER use "General" as the day - only use specific day names: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
3. Each suggestion must be specific to exercises/training for that particular day
4. Use ONLY these category values: exercise_order, rest_periods, volume, intensity, exercise_selection, recovery, timing

RESPONSE FORMAT (JSON ONLY, NO MARKDOWN):
{
  "suggestions": [
    {
      "day": "Monday",
      "category": "exercise_order",
      "suggestion": "Move Barbell Squats before Leg Extensions for better energy utilization",
      "reason": "Compound movements require more energy and should be done first",
      "priority": "high"
    }
  ],
  "overallAssessment": {
    "strengths": ["Good exercise variety", "Consistent training frequency"],
    "weaknesses": ["Some exercises could be reordered", "Rest periods could be optimized"],
    "riskFactors": ["Watch for overtraining signs"]
  }
}`;

  try {
    const { content } = await completeWithGroq({
      messages: [
        {
          role: "system",
          content:
            "You are an expert strength and conditioning coach. You MUST provide exactly 7 suggestions, one for each day (Monday-Sunday). NEVER use 'General' as a day name. Use only these categories: exercise_order, rest_periods, volume, intensity, exercise_selection, recovery, timing. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2500,
      jsonMode: true,
    });

    let aiResponse = extractAndParseJSON(content, {});

    const validCategories = [
      "exercise_order",
      "rest_periods",
      "volume",
      "intensity",
      "exercise_selection",
      "recovery",
      "timing",
    ];

    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    if (Array.isArray(aiResponse?.suggestions)) {
      aiResponse.suggestions = aiResponse.suggestions.filter(
        (sug) =>
          validCategories.includes(sug.category) &&
          validDays.includes(sug.day) &&
          sug.day !== "General",
      );

      if (aiResponse.suggestions.length > 7) {
        aiResponse.suggestions = aiResponse.suggestions.slice(0, 7);
      }
    }

    if (!aiResponse?.suggestions || aiResponse.suggestions.length === 0) {
      console.warn("AI returned no valid suggestions, using fallback");
      return {
        success: false,
        fallback: generateFallbackSuggestions(weeklySchedule),
      };
    }

    return {
      success: true,
      data: aiResponse,
    };
  } catch (error) {
    console.error("Groq AI Error:", error.message);
    return {
      success: false,
      error: error.message,
      fallback: generateFallbackSuggestions(weeklySchedule),
    };
  }
}

/**
 * Fallback suggestions if AI fails - ONE PER DAY
 */
function generateFallbackSuggestions(weeklySchedule = []) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const suggestions = days.map((day, index) => {
    const daySchedule = weeklySchedule[index] || {};

    if (daySchedule.isRestDay) {
      return {
        day,
        category: "recovery",
        suggestion:
          "Consider light stretching or mobility work for active recovery",
        reason:
          "Active recovery helps maintain flexibility and reduces soreness",
        priority: "low",
      };
    }

    const categories = [
      {
        category: "exercise_order",
        suggestion: "Perform compound exercises before isolation movements",
        reason: "Compound exercises require more energy and neural drive",
      },
      {
        category: "rest_periods",
        suggestion: "Rest 2-3 minutes between heavy compound sets",
        reason: "Adequate rest allows for full strength recovery",
      },
      {
        category: "volume",
        suggestion: "Aim for 10-20 sets per muscle group per week",
        reason: "This volume range optimizes muscle growth for most people",
      },
      {
        category: "intensity",
        suggestion: "Train to 1-2 reps shy of failure on compound lifts",
        reason: "This intensity maximizes gains while minimizing injury risk",
      },
      {
        category: "exercise_selection",
        suggestion: "Include both compound and isolation exercises",
        reason: "Compounds build strength, isolations target specific muscles",
      },
      {
        category: "timing",
        suggestion: "Schedule workouts when energy levels are highest",
        reason: "Better energy leads to better performance and results",
      },
      {
        category: "recovery",
        suggestion: "Ensure 48 hours between training the same muscle group",
        reason: "Muscles need adequate time to recover and grow",
      },
    ];

    const categoryIndex = index % categories.length;
    return {
      day,
      category: categories[categoryIndex].category,
      suggestion: categories[categoryIndex].suggestion,
      reason: categories[categoryIndex].reason,
      priority: "medium",
    };
  });

  return {
    suggestions,
    overallAssessment: {
      strengths: ["Consistent training schedule"],
      weaknesses: ["Could benefit from personalized AI analysis"],
      riskFactors: ["General recommendations - get personalized insights"],
    },
  };
}

/**
 * Get today's workout based on current day
 */
export function getTodaysWorkout(weeklySchedule = []) {
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
        afternoon: "Rest",
        evening: "Light activity",
        night: "Recovery",
      },
    }
  );
}
