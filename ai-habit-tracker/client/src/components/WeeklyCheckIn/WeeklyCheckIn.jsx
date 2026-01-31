// client/src/components/WeeklyCheckIn/WeeklyCheckIn.jsx - FIXED VERSION
import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Smile,
  Meh,
  Frown,
  Zap,
  Sparkles,
  Battery,
  X,
} from "lucide-react";
import api from "../../utils/api";
import styles from "./WeeklyCheckIn.module.css";

export default function WeeklyCheckIn({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({
    weightChange: "",
    feelingBetter: "",
    energyLevel: "",
    updateProfile: false,
    newWeight: "",
  });

  async function handleSubmit() {
    try {
      setLoading(true);
      setError("");

      // Validate required fields
      if (
        !answers.weightChange ||
        !answers.feelingBetter ||
        !answers.energyLevel
      ) {
        setError("Please answer all questions");
        setLoading(false);
        return;
      }

      // If updateProfile is true, validate newWeight
      if (
        answers.updateProfile &&
        (!answers.newWeight || isNaN(answers.newWeight))
      ) {
        setError("Please provide a valid weight");
        setLoading(false);
        return;
      }

      console.log("Submitting check-in:", answers);

      // ✅ FIXED: Correct API endpoint
      await api.post("/calories/weekly-checkin", {
        weightChange: answers.weightChange,
        feelingBetter: answers.feelingBetter,
        energyLevel: answers.energyLevel,
        updateProfile: answers.updateProfile,
        newWeight: answers.newWeight ? Number(answers.newWeight) : null,
      });

      console.log("Check-in submitted successfully");
      onComplete();
    } catch (err) {
      console.error("Error submitting check-in:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save check-in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    if (confirm("Are you sure you want to skip this week's check-in?")) {
      onComplete();
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* CLOSE BUTTON */}
        <button className={styles.closeBtn} onClick={handleSkip}>
          <X size={24} />
        </button>

        <div className={styles.header}>
          <h3 className={styles.title}>Weekly Check-In</h3>
          <p className={styles.subtitle}>
            It's been a week! Let's track your progress
          </p>
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>Step {step} of 4</span>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className={styles.error}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* STEP 1: WEIGHT CHANGE */}
        {step === 1 && (
          <div className={styles.step}>
            <p className={styles.question}>
              Have you noticed any changes in your body weight?
            </p>
            <div className={styles.options}>
              <button
                className={`${styles.option} ${
                  answers.weightChange === "increased" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, weightChange: "increased" });
                  setError("");
                }}
              >
                <TrendingUp size={20} />
                <span>Increased</span>
              </button>
              <button
                className={`${styles.option} ${
                  answers.weightChange === "decreased" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, weightChange: "decreased" });
                  setError("");
                }}
              >
                <TrendingDown size={20} />
                <span>Decreased</span>
              </button>
              <button
                className={`${styles.option} ${
                  answers.weightChange === "same" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, weightChange: "same" });
                  setError("");
                }}
              >
                <Minus size={20} />
                <span>No Change</span>
              </button>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={() => setStep(2)}
              disabled={!answers.weightChange}
            >
              Next
            </button>
          </div>
        )}

        {/* STEP 2: FEELING */}
        {step === 2 && (
          <div className={styles.step}>
            <p className={styles.question}>How are you feeling overall?</p>
            <div className={styles.options}>
              <button
                className={`${styles.option} ${
                  answers.feelingBetter === "much_better" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, feelingBetter: "much_better" });
                  setError("");
                }}
              >
                <Star size={20} />
                <span>Much Better</span>
              </button>
              <button
                className={`${styles.option} ${
                  answers.feelingBetter === "better" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, feelingBetter: "better" });
                  setError("");
                }}
              >
                <Smile size={20} />
                <span>Better</span>
              </button>
              <button
                className={`${styles.option} ${
                  answers.feelingBetter === "same" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, feelingBetter: "same" });
                  setError("");
                }}
              >
                <Meh size={20} />
                <span>Same</span>
              </button>
              <button
                className={`${styles.option} ${
                  answers.feelingBetter === "worse" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, feelingBetter: "worse" });
                  setError("");
                }}
              >
                <Frown size={20} />
                <span>Worse</span>
              </button>
            </div>
            <div className={styles.buttonGroup}>
              <button
                className={styles.btnSecondary}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => setStep(3)}
                disabled={!answers.feelingBetter}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ENERGY LEVEL */}
        {step === 3 && (
          <div className={styles.step}>
            <p className={styles.question}>How's your energy level?</p>
            <div className={styles.options}>
              <button
                className={`${styles.option} ${
                  answers.energyLevel === "high" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, energyLevel: "high" });
                  setError("");
                }}
              >
                <Zap size={20} />
                <span>High Energy</span>
              </button>
              <button
                className={`${styles.option} ${
                  answers.energyLevel === "moderate" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, energyLevel: "moderate" });
                  setError("");
                }}
              >
                <Sparkles size={20} />
                <span>Moderate</span>
              </button>
              <button
                className={`${styles.option} ${
                  answers.energyLevel === "low" ? styles.selected : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, energyLevel: "low" });
                  setError("");
                }}
              >
                <Battery size={20} />
                <span>Low Energy</span>
              </button>
            </div>
            <div className={styles.buttonGroup}>
              <button
                className={styles.btnSecondary}
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => setStep(4)}
                disabled={!answers.energyLevel}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: UPDATE WEIGHT */}
        {step === 4 && (
          <div className={styles.step}>
            <p className={styles.question}>
              Would you like to update your profile weight?
            </p>
            <p className={styles.hint}>
              Updating your weight will recalculate your daily recommendations
            </p>

            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggle} ${
                  !answers.updateProfile ? styles.toggleActive : ""
                }`}
                onClick={() => {
                  setAnswers({
                    ...answers,
                    updateProfile: false,
                    newWeight: "",
                  });
                  setError("");
                }}
              >
                No, Keep Same
              </button>
              <button
                className={`${styles.toggle} ${
                  answers.updateProfile ? styles.toggleActive : ""
                }`}
                onClick={() => {
                  setAnswers({ ...answers, updateProfile: true });
                  setError("");
                }}
              >
                Yes, Update
              </button>
            </div>

            {answers.updateProfile && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>New Weight (kg)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={answers.newWeight}
                  onChange={(e) => {
                    setAnswers({ ...answers, newWeight: e.target.value });
                    setError("");
                  }}
                  placeholder="70"
                  min="20"
                  max="500"
                  step="0.1"
                />
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button
                className={styles.btnSecondary}
                onClick={() => setStep(3)}
                disabled={loading}
              >
                Back
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSubmit}
                disabled={
                  loading || (answers.updateProfile && !answers.newWeight)
                }
              >
                {loading ? "Saving..." : "Complete Check-In"}
              </button>
            </div>
          </div>
        )}

        {/* SKIP BUTTON */}
        <button
          className={styles.skipButton}
          onClick={handleSkip}
          disabled={loading}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
