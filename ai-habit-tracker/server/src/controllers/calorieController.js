// server/src/controllers/calorieController.js
import FoodLog from "../models/FoodLog.js";
import CalorieProfile from "../models/CalorieProfile.js";
import WeeklyCheckIn from "../models/WeeklyCheckIn.js";
import User from "../models/User.js";
import { normalizeDateIST } from "../utils/getTodayIST.js";

/* ============================
   SAVE FOOD LOG
============================ */
export const addFoodLog = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { foodName, calories, protein, imageUrl, date } = req.body;

    if (!foodName || !calories) {
      return res.status(400).json({
        message: "foodName and calories are required",
      });
    }

    // Determine the log date — default to today, allow past dates only
    let logDate = normalizeDateIST(new Date());
    if (date) {
      const todayIST = normalizeDateIST(new Date());
      if (date > todayIST) {
        return res.status(400).json({
          message: "Cannot log food for future dates",
        });
      }
      logDate = normalizeDateIST(date);
    }

    const food = await FoodLog.create({
      userId,
      foodName,
      calories: Number(calories),
      protein: Number(protein || 0),
      imageUrl,
      date: logDate,
    });

    res.json(food);
  } catch (err) {
    console.error("Error adding food log:", err);
    res.status(500).json({ message: "Failed to add food log" });
  }
};

/* ============================
   DELETE FOOD LOG
============================ */
export const deleteFoodLog = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const food = await FoodLog.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!food) {
      return res.status(404).json({
        message: "Food log not found",
      });
    }

    res.json({ message: "Food log deleted successfully" });
  } catch (err) {
    console.error("Error deleting food log:", err);
    res.status(500).json({ message: "Failed to delete food log" });
  }
};

/* ============================
   GET PROFILE
============================ */
export const getCalorieProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    const profile = await CalorieProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found. Please create one.",
      });
    }

    res.json(profile);
  } catch (err) {
    console.error("Error getting profile:", err);
    res.status(500).json({ message: "Failed to get profile" });
  }
};

/* ============================
   CALCULATE RECOMMENDATIONS
============================ */
function calculateRecommendations(profile) {
  const { age, height, weight, gender, activityLevel, goal } = profile;

  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  // Calculate TDEE
  const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

  // Adjust for goal
  let calories = tdee;
  if (goal === "lose") {
    calories = tdee - 500; // 500 calorie deficit
  } else if (goal === "gain") {
    calories = tdee + 500; // 500 calorie surplus
  }

  // Calculate protein (2g per kg for active, 1.6g for moderate)
  const proteinPerKg =
    activityLevel === "very_active" || activityLevel === "active" ? 2 : 1.6;
  const protein = Math.round(weight * proteinPerKg);

  // Calculate macros (30% protein, 45% carbs, 25% fats)
  const proteinCals = protein * 4;
  const carbsCals = calories * 0.45;
  const fatsCals = calories * 0.25;

  const carbs = Math.round(carbsCals / 4);
  const fats = Math.round(fatsCals / 9);

  // Water recommendation (30-35ml per kg)
  const water = ((weight * 33) / 1000).toFixed(1);

  // Goal labels and tips
  const goalLabels = {
    lose: "Weight Loss",
    maintain: "Maintenance",
    gain: "Muscle Gain",
  };

  const tips = {
    lose: [
      "Focus on protein-rich foods to preserve muscle mass",
      "Eat plenty of vegetables to stay full on fewer calories",
      "Track your progress weekly, not daily",
    ],
    maintain: [
      "Balance your macronutrients for optimal health",
      "Stay consistent with your eating patterns",
      "Adjust based on activity level changes",
    ],
    gain: [
      "Eat in a slight surplus to build muscle steadily",
      "Prioritize protein around workouts",
      "Include healthy fats for hormone production",
    ],
  };

  // ─── Weight-Based Formula Targets (body-weight proportional) ───────────────
  // 1. Daily steps:  weight × 100
  const stepsTarget = weight * 100;

  // 2. Daily calorie range: weight × 22  →  weight × 24
  const calRangeLow  = Math.round(weight * 22);
  const calRangeHigh = Math.round(weight * 24);

  // 3. Daily protein range: weight × 1.6  →  weight × 2
  const proteinRangeLow  = Math.round(weight * 1.6);
  const proteinRangeHigh = Math.round(weight * 2);

  // 4. Daily water: weight × 40 ml
  const waterMl = weight * 40;
  const waterL  = (waterMl / 1000).toFixed(1);

  // 5. Weekly weight-loss range: weight × 0.5%  →  weight × 1%
  const weightLossLow  = (weight * 0.005).toFixed(2);
  const weightLossHigh = (weight * 0.01).toFixed(2);

  const weightBasedTargets = {
    bodyWeight: weight,
    steps: {
      value: stepsTarget,
      basis: `${weight} kg × 100`,
      formula: `${weight} × 100`,
      label: "Daily Steps",
      unit: "steps/day",
      explanation: "Proportionate baseline activity that increases non-exercise thermogenesis (NEAT) without straining joints.",
    },
    calorieRange: {
      low: calRangeLow,
      high: calRangeHigh,
      basis: `${weight} kg × 22–24 kcal`,
      formula: `${weight} × 22–24`,
      label: "Daily Calorie Target",
      unit: "kcal/day",
      explanation: "Calibrated energy baseline to trigger steady fat reduction while protecting metabolic health and hormonal function.",
    },
    proteinRange: {
      low: proteinRangeLow,
      high: proteinRangeHigh,
      basis: `${weight} kg × 1.6–2.0 g`,
      formula: `${weight} × 1.6–2`,
      label: "Daily Protein Intake",
      unit: "g/day",
      explanation: "Supplies essential amino acids to preserve lean muscle tissue during caloric expenditure and support recovery.",
    },
    water: {
      ml: waterMl,
      liters: waterL,
      basis: `${weight} kg × 40 ml`,
      formula: `${weight} × 40 ml`,
      label: "Daily Hydration",
      unit: "L/day",
      explanation: "Ensures cellular fluid balance, waste clearance, and metabolic turnover scaled directly to total body mass.",
    },
    weeklyWeightLoss: {
      low: weightLossLow,
      high: weightLossHigh,
      basis: `${weight} kg × 0.5%–1.0%`,
      formula: `${weight} × 0.5–1%`,
      label: "Weekly Fat-Loss Pace",
      unit: "kg/week",
      explanation: "Clinical gold standard pace to maximize fat tissue loss while preventing muscle catabolism and metabolic adaptation.",
    },
  };

  return {
    bmr: Math.round(bmr),
    calories: Math.round(calories),
    protein,
    proteinPerKg,
    carbs,
    fats,
    water,
    goalLabel: goalLabels[goal] || "Maintenance",
    tips: tips[goal] || tips.maintain,
    weightBasedTargets,
  };
}

/* ============================
   SET / UPDATE PROFILE
============================ */
export const saveCalorieProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      name,
      age,
      height,
      weight,
      gender,
      activityLevel,
      goal,
      dailyGoal,
      proteinGoal,
    } = req.body;

    // Update user display name if provided
    if (name && typeof name === "string" && name.trim().length >= 2) {
      await User.findByIdAndUpdate(userId, { name: name.trim() });
    }

    // Check if this is just a goal update (no age/height/weight changes, e.g. from Calories quick edit)
    const existingProfile = await CalorieProfile.findOne({ userId });

    // If updating existing profile and ONLY goals are provided
    const isOnlyGoalsUpdate = dailyGoal && proteinGoal && !age && !height && !weight;
    if (existingProfile && isOnlyGoalsUpdate) {
      // Manual goal update - don't recalculate, just save the custom values
      console.log("Updating goals manually:", { dailyGoal, proteinGoal });

      const updatedProfile = await CalorieProfile.findOneAndUpdate(
        { userId },
        {
          dailyGoal: Number(dailyGoal),
          proteinGoal: Number(proteinGoal),
        },
        { new: true },
      );

      return res.json(updatedProfile);
    }

    // New profile creation or full profile update - validate all fields
    if (!age || !height || !weight || !gender || !activityLevel || !goal) {
      return res.status(400).json({
        message: "All profile fields are required",
      });
    }

    // Calculate AI recommendations
    const recommendations = calculateRecommendations({
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      gender,
      activityLevel,
      goal,
    });

    // Use custom goals if provided, otherwise use AI recommendations
    const finalDailyGoal = dailyGoal
      ? Number(dailyGoal)
      : recommendations.calories;
    const finalProteinGoal = proteinGoal
      ? Number(proteinGoal)
      : recommendations.protein;

    console.log("Creating/updating profile with goals:", {
      dailyGoal: finalDailyGoal,
      proteinGoal: finalProteinGoal,
      aiRecommended: {
        calories: recommendations.calories,
        protein: recommendations.protein,
      },
    });

    const profile = await CalorieProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        gender,
        activityLevel,
        goal,
        dailyGoal: finalDailyGoal,
        proteinGoal: finalProteinGoal,
      },
      { upsert: true, new: true },
    );

    res.json(profile);
  } catch (err) {
    console.error("Error saving profile:", err);
    res
      .status(500)
      .json({ message: "Failed to save profile", error: err.message });
  }
};

/* ============================
   GET RECOMMENDATIONS
============================ */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id;
    const profile = await CalorieProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    const recommendations = calculateRecommendations(profile);
    res.json(recommendations);
  } catch (err) {
    console.error("Error getting recommendations:", err);
    res.status(500).json({ message: "Failed to get recommendations" });
  }
};

/* ============================
   GET TODAY STATUS
============================ */
export const getCalorieStatus = async (req, res) => {
  try {
    const userId = req.user?._id;
    const today = normalizeDateIST(new Date());

    const profile = await CalorieProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found. Please create one first.",
      });
    }

    const logs = await FoodLog.find({ userId, date: today });

    const caloriesConsumed = logs.reduce((s, l) => s + (l.calories || 0), 0);
    const proteinConsumed = logs.reduce((s, l) => s + (l.protein || 0), 0);
    const caloriesRemaining = profile.dailyGoal - caloriesConsumed;

    res.json({
      calorieGoal: profile.dailyGoal,
      proteinGoal: profile.proteinGoal,
      caloriesConsumed,
      proteinConsumed,
      caloriesRemaining,
    });
  } catch (err) {
    console.error("Error getting status:", err);
    res.status(500).json({ message: "Failed to get calorie status" });
  }
};

/* ============================
   GET ANALYTICS
============================ */
export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user?._id;
    const profile = await CalorieProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await FoodLog.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ date: 1 });

    // ── Group by date ─────────────────────────────────────────────
    const dailyData = {};
    logs.forEach((log) => {
      if (!dailyData[log.date]) {
        dailyData[log.date] = { calories: 0, protein: 0, items: [] };
      }
      dailyData[log.date].calories += log.calories;
      dailyData[log.date].protein += log.protein;
      dailyData[log.date].items.push(log);
    });

    const dailyHistory = Object.keys(dailyData)
      .map((date) => {
        const data = dailyData[date];
        const caloriesPercent = (data.calories / profile.dailyGoal) * 100;
        const proteinPercent = (data.protein / profile.proteinGoal) * 100;
        const isOverGoal = data.calories > profile.dailyGoal;
        const hitProteinGoal = data.protein >= profile.proteinGoal;

        return {
          date,
          dateFormatted: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          dayOfWeek: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "short",
          }),
          calories: data.calories,
          protein: data.protein,
          calorieGoal: profile.dailyGoal,
          proteinGoal: profile.proteinGoal,
          caloriesPercent: Math.round(caloriesPercent),
          proteinPercent: Math.round(proteinPercent),
          isOverGoal,
          hitProteinGoal,
          overBy: isOverGoal ? data.calories - profile.dailyGoal : 0,
          items: data.items,
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalDays = dailyHistory.length;
    const avgCalories = totalDays
      ? Math.round(dailyHistory.reduce((s, d) => s + d.calories, 0) / totalDays)
      : 0;
    const avgProtein = totalDays
      ? Math.round(dailyHistory.reduce((s, d) => s + d.protein, 0) / totalDays)
      : 0;
    const daysOverGoal = dailyHistory.filter((d) => d.isOverGoal).length;
    const daysHitProtein = dailyHistory.filter((d) => d.hitProteinGoal).length;
    const daysOnGoal = dailyHistory.filter((d) => !d.isOverGoal).length;

    // ── Best & worst days ─────────────────────────────────────────
    const bestDay = totalDays
      ? dailyHistory.reduce((best, d) =>
          Math.abs(d.calories - profile.dailyGoal) < Math.abs(best.calories - profile.dailyGoal)
            ? d
            : best
        )
      : null;
    const worstDay = totalDays
      ? dailyHistory.reduce((worst, d) =>
          d.isOverGoal && d.overBy > (worst.overBy || 0) ? d : worst,
          { overBy: 0 }
        )
      : null;

    // ── Current & best streak (consecutive goal-hit days) ─────────
    const sortedByDate = [...dailyHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    for (const d of sortedByDate) {
      if (!d.isOverGoal) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        if (d.date === todayStr || sortedByDate.indexOf(d) === sortedByDate.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // ── Top foods (most frequently logged) ────────────────────────
    const foodCounts = {};
    logs.forEach((log) => {
      const key = log.foodName.toLowerCase().trim();
      if (!foodCounts[key]) {
        foodCounts[key] = {
          name: log.foodName,
          count: 0,
          totalCalories: 0,
          totalProtein: 0,
        };
      }
      foodCounts[key].count++;
      foodCounts[key].totalCalories += log.calories;
      foodCounts[key].totalProtein += log.protein;
    });
    const topFoods = Object.values(foodCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((f) => ({
        name: f.name,
        count: f.count,
        avgCalories: Math.round(f.totalCalories / f.count),
        avgProtein: Math.round(f.totalProtein / f.count),
        totalCalories: f.totalCalories,
      }));

    // ── Weekly buckets (last 4 weeks) ─────────────────────────────
    const weeklyBuckets = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStartStr = weekStart.toISOString().slice(0, 10);
      const weekEndStr = weekEnd.toISOString().slice(0, 10);

      const weekDays = dailyHistory.filter(
        (d) => d.date >= weekStartStr && d.date < weekEndStr
      );
      const wDays = weekDays.length;
      weeklyBuckets.unshift({
        label: w === 0 ? "This week" : `${(w + 1)} wks ago`,
        days: wDays,
        avgCalories: wDays
          ? Math.round(weekDays.reduce((s, d) => s + d.calories, 0) / wDays)
          : 0,
        avgProtein: wDays
          ? Math.round(weekDays.reduce((s, d) => s + d.protein, 0) / wDays)
          : 0,
        daysOnGoal: weekDays.filter((d) => !d.isOverGoal).length,
      });
    }

    // ── Macro breakdown estimate ───────────────────────────────────
    // Protein cals = protein * 4; Fat ~25% of total; Carbs = rest
    const avgProteinCals = avgProtein * 4;
    const avgFatCals = Math.round(avgCalories * 0.25);
    const avgCarbCals = Math.max(0, avgCalories - avgProteinCals - avgFatCals);
    const macroBreakdown = {
      protein: { cals: avgProteinCals, grams: avgProtein },
      carbs: { cals: avgCarbCals, grams: Math.round(avgCarbCals / 4) },
      fat: { cals: avgFatCals, grams: Math.round(avgFatCals / 9) },
    };

    // ── 14-day chart data (most recent) ───────────────────────────
    const chartData = [...dailyHistory]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14);

    res.json({
      totalDays,
      avgCalories,
      avgProtein,
      daysOverGoal,
      daysOnGoal,
      daysHitProtein,
      currentStreak,
      bestStreak,
      bestDay: bestDay
        ? { date: bestDay.dateFormatted, calories: bestDay.calories }
        : null,
      worstDay:
        worstDay && worstDay.overBy > 0
          ? { date: worstDay.dateFormatted, overBy: worstDay.overBy }
          : null,
      topFoods,
      weeklyBuckets,
      macroBreakdown,
      chartData,
      dailyHistory,
      calorieGoal: profile.dailyGoal,
      proteinGoal: profile.proteinGoal,
    });
  } catch (err) {
    console.error("Error getting analytics:", err);
    res.status(500).json({ message: "Failed to get analytics" });
  }
};

/* ============================
   GET DATE DETAILS
============================ */
export const getDateDetails = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { date } = req.params;

    const logs = await FoodLog.find({ userId, date }).sort({ createdAt: -1 });

    const totalCalories = logs.reduce((s, l) => s + (l.calories || 0), 0);
    const totalProtein = logs.reduce((s, l) => s + (l.protein || 0), 0);

    res.json({
      date,
      dateFormatted: new Date(date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      totalCalories,
      totalProtein,
      items: logs,
    });
  } catch (err) {
    console.error("Error getting date details:", err);
    res.status(500).json({ message: "Failed to get date details" });
  }
};

/* ============================
   CHECK WEEKLY CHECK-IN
============================ */
export const checkWeeklyCheckIn = async (req, res) => {
  try {
    const userId = req.user?._id;
    const lastCheckIn = await WeeklyCheckIn.findOne({ userId }).sort({
      createdAt: -1,
    });

    const shouldShow =
      !lastCheckIn ||
      (new Date() - new Date(lastCheckIn.createdAt)) / (1000 * 60 * 60 * 24) >=
        7;

    res.json({ shouldShow });
  } catch (err) {
    console.error("Error checking weekly:", err);
    res.status(500).json({ message: "Failed to check weekly" });
  }
};

/* ============================
   SAVE WEEKLY CHECK-IN - FIXED VERSION
   ✅ Proper validation and error handling
============================ */
export const saveWeeklyCheckIn = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      weightChange,
      feelingBetter,
      energyLevel,
      updateProfile,
      newWeight,
    } = req.body;

    console.log("Weekly check-in received:", {
      weightChange,
      feelingBetter,
      energyLevel,
      updateProfile,
      newWeight,
      userId,
    });

    // ✅ FIXED: Validate required fields
    if (!weightChange || !feelingBetter || !energyLevel) {
      console.error("Validation failed: Missing required fields");
      return res.status(400).json({
        message: "Please answer all questions",
        missingFields: {
          weightChange: !weightChange,
          feelingBetter: !feelingBetter,
          energyLevel: !energyLevel,
        },
      });
    }

    // ✅ FIXED: Only validate newWeight if updateProfile is explicitly true
    if (updateProfile === true) {
      const weightNum = Number(newWeight);
      if (!newWeight || isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
        console.error("Validation failed: Invalid weight", {
          newWeight,
          parsed: weightNum,
        });
        return res.status(400).json({
          message: "Please provide a valid weight (between 1 and 500 kg)",
        });
      }
    }

    // ✅ Create check-in record
    const checkIn = await WeeklyCheckIn.create({
      userId,
      weightChange,
      feelingBetter,
      energyLevel,
      updatedProfile: updateProfile === true,
    });

    console.log("Check-in saved successfully:", checkIn._id);

    // ✅ Update profile if requested AND newWeight is provided
    if (updateProfile === true && newWeight) {
      const profile = await CalorieProfile.findOne({ userId });

      if (!profile) {
        console.warn("Profile not found for user", userId);
        return res.json({
          message: "Check-in saved, but no profile found to update weight",
          checkIn,
          profileUpdated: false,
        });
      }

      const oldWeight = profile.weight;
      const newWeightNum = Number(newWeight);

      console.log(`Updating weight: ${oldWeight}kg → ${newWeightNum}kg`);

      // Update weight
      profile.weight = newWeightNum;

      // Recalculate recommendations with new weight
      const recommendations = calculateRecommendations(profile);
      profile.dailyGoal = recommendations.calories;
      profile.proteinGoal = recommendations.protein;

      await profile.save();

      console.log("Profile updated:", {
        weight: profile.weight,
        dailyGoal: profile.dailyGoal,
        proteinGoal: profile.proteinGoal,
      });

      return res.json({
        message: "Check-in saved and profile updated successfully!",
        checkIn,
        profileUpdated: true,
        newRecommendations: {
          calories: profile.dailyGoal,
          protein: profile.proteinGoal,
          weight: profile.weight,
        },
      });
    }

    // ✅ Success without profile update
    console.log("Check-in completed without profile update");
    res.json({
      message: "Check-in saved successfully!",
      checkIn,
      profileUpdated: false,
    });
  } catch (err) {
    console.error("Error saving check-in:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({
      message: "Failed to save check-in",
      error: err.message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};
