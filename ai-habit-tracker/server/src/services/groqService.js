// server/src/services/groqService.js - FIXED VERSION
import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

/**
 * Generate AI improvement suggestions for existing timetable
 */
export async function generateImprovementSuggestions({
  category,
  goal,
  level,
  sportsMode,
  weeklySchedule,
}) {
  if (!groq) {
    return {
      success: false,
      error: "GROQ_API_KEY not set. Add it to enable AI improvements.",
      fallback: generateFallbackSuggestions(category, goal, level),
    };
  }

  const sportInfo = sportsMode.enabled
    ? `The user also plays ${sportsMode.sport.replace("_", " ")} competitively.`
    : "";

  // Format current schedule for AI
  const scheduleText = weeklySchedule
    .map((day) => {
      const exercisesList = day.exercises
        .map(
          (ex, idx) =>
            `${idx + 1}. ${ex.name} - ${ex.sets || "?"} sets × ${ex.reps || ex.duration || "?"} ${ex.restBetweenSets ? `(rest: ${ex.restBetweenSets})` : ""}`,
        )
        .join("\n   ");

      return `${day.day} (${day.focusArea})${day.isRestDay ? " - REST DAY" : ""}:
   Time: ${day.startTime || "Not set"} - ${day.endTime || "Not set"}
   ${exercisesList || "No exercises"}
   Time Blocks:
   - Morning: ${day.timeBlock?.morning || "None"}
   - Afternoon: ${day.timeBlock?.afternoon || "None"}
   - Evening: ${day.timeBlock?.evening || "None"}
   - Night: ${day.timeBlock?.night || "None"}`;
    })
    .join("\n\n");

  const prompt = `You are an expert fitness coach analyzing a workout timetable. Review this user's training plan and provide SPECIFIC, ACTIONABLE improvement suggestions.

USER PROFILE:
- Training Category: ${category.replace("_", " ").toUpperCase()}
- Fitness Goal: ${goal.replace("_", " ").toUpperCase()}
- Experience Level: ${level.toUpperCase()}
${sportInfo}

CURRENT WEEKLY SCHEDULE:
${scheduleText}

CRITICAL: You MUST use ONLY these category values (exact spelling):
- "exercise_order" (for exercise sequencing)
- "rest_periods" (for rest between sets)
- "volume" (for total sets/reps)
- "intensity" (for load/effort)
- "exercise_selection" (for choosing exercises)
- "recovery" (for rest days)
- "timing" (for workout timing)
- "general" (for overall advice)

DO NOT use categories like: "cardio", "power_training", "sports_conditioning", "conditioning", "rest_and_recovery", "nutrition_and_hydration" - these are INVALID.

ANALYSIS REQUIREMENTS:
1. Evaluate exercise selection, order, and programming
2. Check rest periods, volume, and intensity
3. Assess recovery and rest day placement
4. Review timing and time block allocations
5. Identify muscle group imbalances
6. Check for overtraining or undertraining risks
7. Ensure alignment with stated goals

RESPONSE FORMAT (JSON ONLY, NO MARKDOWN):
{
  "suggestions": [
    {
      "day": "Monday",
      "category": "exercise_order",
      "suggestion": "Move compound exercises (Squats) before isolation exercises (Leg Extensions) for better energy utilization",
      "reason": "Compound movements require more energy and neural demand, performing them first maximizes performance",
      "priority": "high"
    },
    {
      "day": "General",
      "category": "recovery",
      "suggestion": "Add a dedicated rest day after intense leg workouts",
      "reason": "Lower body needs 48-72 hours recovery",
      "priority": "medium"
    }
  ],
  "overallAssessment": {
    "strengths": ["Good exercise variety", "Consistent training frequency"],
    "weaknesses": ["Insufficient rest", "Volume too high for beginners"],
    "riskFactors": ["Potential overtraining", "Imbalanced muscle development"]
  }
}

IMPORTANT: 
- Provide 5-10 specific, actionable suggestions
- Use ONLY the allowed category values
- Be direct and practical
- Focus on day-specific suggestions when possible

Generate now:`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert strength and conditioning coach. You MUST use only these category values: exercise_order, rest_periods, volume, intensity, exercise_selection, recovery, timing, general. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6, // Lowered for more consistent outputs
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    // Remove markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let aiResponse = JSON.parse(cleanedResponse);

    // VALIDATION: Filter out any suggestions with invalid categories
    const validCategories = [
      "exercise_order",
      "rest_periods",
      "volume",
      "intensity",
      "exercise_selection",
      "recovery",
      "timing",
      "general",
    ];

    if (aiResponse.suggestions) {
      aiResponse.suggestions = aiResponse.suggestions.filter((sug) =>
        validCategories.includes(sug.category),
      );
    }

    // If no valid suggestions after filtering, use fallback
    if (!aiResponse.suggestions || aiResponse.suggestions.length === 0) {
      console.warn("AI returned no valid suggestions, using fallback");
      return {
        success: false,
        error: "AI returned invalid categories",
        fallback: generateFallbackSuggestions(category, goal, level),
      };
    }

    return {
      success: true,
      data: aiResponse,
    };
  } catch (error) {
    console.error("Groq AI Error:", error);
    return {
      success: false,
      error: error.message,
      fallback: generateFallbackSuggestions(category, goal, level),
    };
  }
}

/**
 * Fallback suggestions if AI fails
 */
function generateFallbackSuggestions(category, goal, level) {
  const suggestions = [];

  // General suggestions based on goal
  if (goal === "muscle_gain") {
    suggestions.push({
      day: "General",
      category: "volume",
      suggestion:
        "Ensure you're progressively increasing weight or reps each week",
      reason:
        "Progressive overload is essential for muscle hypertrophy and continued gains",
      priority: "high",
    });
  }

  if (goal === "fat_loss" || goal === "weight_loss") {
    suggestions.push({
      day: "General",
      category: "intensity",
      suggestion:
        "Consider adding 15-20 minutes of moderate cardio after strength training 3x per week",
      reason:
        "Post-workout cardio enhances fat burning without compromising muscle",
      priority: "high",
    });
  }

  if (level === "beginner") {
    suggestions.push({
      day: "General",
      category: "recovery",
      suggestion: "Ensure at least 2 full rest days per week",
      reason:
        "Beginners need more recovery time to adapt to training stimulus and prevent injury",
      priority: "high",
    });
  }

  // Exercise order
  suggestions.push({
    day: "General",
    category: "exercise_order",
    suggestion: "Perform compound exercises before isolation exercises",
    reason:
      "Compound movements require more energy and should be done when fresh",
    priority: "medium",
  });

  // Rest periods
  suggestions.push({
    day: "General",
    category: "rest_periods",
    suggestion: "Rest 2-3 minutes between heavy compound sets",
    reason: "Adequate rest ensures full recovery for maximum strength output",
    priority: "medium",
  });

  // Warm-up
  suggestions.push({
    day: "General",
    category: "timing",
    suggestion: "Include 10-15 minute dynamic warm-up before each session",
    reason: "Proper warm-up reduces injury risk and improves performance",
    priority: "high",
  });

  return {
    suggestions,
    overallAssessment: {
      strengths: ["Consistent training schedule"],
      weaknesses: ["Could benefit from AI analysis for personalized insights"],
      riskFactors: ["General recommendations - detailed analysis recommended"],
    },
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
        afternoon: "Rest",
        evening: "Light activity",
        night: "Recovery",
      },
    }
  );
}
