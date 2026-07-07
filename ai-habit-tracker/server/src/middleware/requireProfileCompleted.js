import CalorieProfile from "../models/CalorieProfile.js";

const requireProfileCompleted = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const profile = await CalorieProfile.findOne({ userId });

    if (
      !profile ||
      !profile.age ||
      !profile.height ||
      !profile.weight ||
      !profile.gender ||
      !profile.activityLevel ||
      !profile.goal
    ) {
      return res.status(403).json({
        message: "Profile incomplete. Please complete your profile in the Profile section to access this feature.",
        code: "PROFILE_INCOMPLETE",
      });
    }

    req.userProfile = profile;
    next();
  } catch (err) {
    console.error("Profile middleware error:", err);
    res.status(500).json({ message: "Failed to verify profile status" });
  }
};

export default requireProfileCompleted;
