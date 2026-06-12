import { generateProfile } from "../ai/profileGenerator.js";

export const getCoachProfile = async (req, res) => {
  try {
    const profile = await generateProfile(req.user._id);

    res.json(profile);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
