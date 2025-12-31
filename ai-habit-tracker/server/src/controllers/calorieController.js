import FoodLog from "../models/FoodLog.js";
import CalorieProfile from "../models/CalorieProfile.js";
import WeeklyCheckIn from "../models/WeeklyCheckIn.js";
import { normalizeDateIST } from "../utils/getTodayIST.js";

/* ============================
   SAVE FOOD LOG
============================ */
export const addFoodLog = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { foodName, calories, protein, imageUrl } = req.body;

    if (!foodName || !calories) {
      return res.status(400).json({
        message: "foodName and calories are required",
      });
    }

    const food = await FoodLog.create({
      userId,
      foodName,
      calories: Number(calories),
      protein: Number(protein || 0),
      imageUrl,
      date: normalizeDateIST(new Date()),
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
  };
}

/* ============================
   SET / UPDATE PROFILE
============================ */
export const saveCalorieProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { age, height, weight, gender, activityLevel, goal } = req.body;

    if (!age || !height || !weight || !gender || !activityLevel || !goal) {
      return res.status(400).json({
        message: "All profile fields are required",
      });
    }

    const recommendations = calculateRecommendations({
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      gender,
      activityLevel,
      goal,
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
        dailyGoal: recommendations.calories,
        proteinGoal: recommendations.protein,
      },
      { upsert: true, new: true }
    );

    res.json(profile);
  } catch (err) {
    console.error("Error saving profile:", err);
    res.status(500).json({ message: "Failed to save profile" });
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
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await FoodLog.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    // Group by date
    const dailyData = {};
    logs.forEach((log) => {
      if (!dailyData[log.date]) {
        dailyData[log.date] = {
          calories: 0,
          protein: 0,
          items: [],
        };
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
        const overBy = isOverGoal ? data.calories - profile.dailyGoal : 0;

        return {
          date,
          dateFormatted: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          dayOfWeek: new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          calories: data.calories,
          protein: data.protein,
          calorieGoal: profile.dailyGoal,
          proteinGoal: profile.proteinGoal,
          caloriesPercent: Math.round(caloriesPercent),
          proteinPercent: Math.round(proteinPercent),
          isOverGoal,
          overBy,
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

    res.json({
      totalDays,
      avgCalories,
      avgProtein,
      daysOverGoal,
      dailyHistory,
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
   SAVE WEEKLY CHECK-IN
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

    await WeeklyCheckIn.create({
      userId,
      weightChange,
      feelingBetter,
      energyLevel,
      updatedProfile: updateProfile,
    });

    // Update profile if requested
    if (updateProfile && newWeight) {
      const profile = await CalorieProfile.findOne({ userId });
      if (profile) {
        profile.weight = Number(newWeight);

        const recommendations = calculateRecommendations(profile);
        profile.dailyGoal = recommendations.calories;
        profile.proteinGoal = recommendations.protein;

        await profile.save();
      }
    }

    res.json({ message: "Check-in saved successfully" });
  } catch (err) {
    console.error("Error saving check-in:", err);
    res.status(500).json({ message: "Failed to save check-in" });
  }
};
