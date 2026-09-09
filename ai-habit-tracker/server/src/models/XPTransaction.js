// server/src/models/XPTransaction.js
import mongoose from "mongoose";

const xpTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    coinAmount: { type: Number, default: 0 },
    source: {
      type: String,
      required: true,
      enum: [
        "habit_complete",
        "perfect_day",
        "streak_milestone",
        "challenge_complete",
        "achievement_unlock",
        "first_habit",
        "perfect_week",
        "perfect_month",
        "level_up_bonus",
        "streak_freeze_earned",
      ],
    },
    refId: { type: String, default: null },
    // Idempotency key prevents duplicate grants. Unique sparse index allows nulls.
    idempotencyKey: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Sparse unique index so null keys are allowed but non-null keys must be unique
xpTransactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
xpTransactionSchema.index({ userId: 1, createdAt: -1 });

const XPTransaction = mongoose.model("XPTransaction", xpTransactionSchema);
export default XPTransaction;
