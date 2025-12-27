import mongoose from "mongoose";

const foodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    foodName: { type: String, required: true },
    calories: { type: Number, required: true },
    imageUrl: String,
    date: { type: String, required: true }, // IST yyyy-mm-dd
  },
  { timestamps: true }
);

export default mongoose.model("FoodLog", foodLogSchema);
