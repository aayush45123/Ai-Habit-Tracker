import mongoose from "mongoose";

const habitTemplateSchema = new mongoose.Schema({
  category: { type: String, required: true }, // "Fitness", "Study", etc.
  title: { type: String, required: true },
  description: { type: String, default: "" },
  recommendedTime: { type: String, default: "" }, // optional, e.g. "06:00 AM"
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Easy",
  },
});

export default mongoose.model("HabitTemplate", habitTemplateSchema);
