import React, { useState } from "react";
import api from "../../utils/api";
import styles from "./WeeklyCheckIn.module.css";

export default function WeeklyCheckIn({ onComplete }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    weightChange: "",
    feelingBetter: "",
    energyLevel: "",
    updateProfile: false,
    newWeight: "",
  });

  async function handleSubmit() {
    try {
      await api.post("/calories/weekly-checkin", answers);
      onComplete();
    } catch (err) {
      console.error("Error submitting check-in:", err);
      alert("Failed to save check-in");
    }
  }

  function handleSkip() {
    onComplete();
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Weekly Check-In</h3>
          <p className={styles.subtitle}>
            It's been a week! Let's track your progress
          </p>
        </div>

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
                onClick={() =>
                  setAnswers({ ...answers, weightChange: "increased" })
                }
              >
                ⬆️ Increased
              </button>
              <button
                className={`${styles.option} ${
                  answers.weightChange === "decreased" ? styles.selected : ""
                }`}
                onClick={() =>
                  setAnswers({ ...answers, weightChange: "decreased" })
                }
              >
                ⬇️ Decreased
              </button>
              <button
                className={`${styles.option} ${
                  answers.weightChange === "same" ? styles.selected : ""
                }`}
                onClick={() => setAnswers({ ...answers, weightChange: "same" })}
              >
                ➡️ No Change
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

        {step === 2 && (
          <div className={styles.step}>
            <p className={styles.question}>How are you feeling overall?</p>
            <div className={styles.options}>
              <button
                className={`${styles.option} ${
                  answers.feelingBetter === "much_better" ? styles.selected : ""
                }`}
                onClick={() =>
                  setAnswers({ ...answers, feelingBetter: "much_better" })
                }
              >
                🌟 Much Better
              </button>
              <button
                className={`${styles.option} ${
                  answers.feelingBetter === "better" ? styles.selected : ""
                }`}
                onClick={() =>
                  setAnswers({ ...answers, feelingBetter: "better" })
                }
              >
                😊 Better
              </button>
              <button
                className={`${styles.option} ${
                  answers.feelingBetter === "same" ? styles.selected : ""
                }`}
                onClick={() =>
                  setAnswers({ ...answers, feelingBetter: "same" })
                }
              >
                😐 Same
              </button>
              <button
                className={`${styles.option} ${
                  answers.feelingBetter === "worse" ? styles.selected : ""
                }`}
                onClick={() =>
                  setAnswers({ ...answers, feelingBetter: "worse" })
                }
              >
                😔 Worse
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

        {step === 3 && (
          <div className={styles.step}>
            <p className={styles.question}>How's your energy level?</p>
            <div className={styles.options}>
              <button
                className={`${styles.option} ${
                  answers.energyLevel === "high" ? styles.selected : ""
                }`}
                onClick={() => setAnswers({ ...answers, energyLevel: "high" })}
              >
                ⚡ High Energy
              </button>
              <button
                className={`${styles.option} ${
                  answers.energyLevel === "moderate" ? styles.selected : ""
                }`}
                onClick={() =>
                  setAnswers({ ...answers, energyLevel: "moderate" })
                }
              >
                💫 Moderate
              </button>
              <button
                className={`${styles.option} ${
                  answers.energyLevel === "low" ? styles.selected : ""
                }`}
                onClick={() => setAnswers({ ...answers, energyLevel: "low" })}
              >
                🔋 Low Energy
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
                  answers.updateProfile ? styles.toggleActive : ""
                }`}
                onClick={() =>
                  setAnswers({
                    ...answers,
                    updateProfile: !answers.updateProfile,
                  })
                }
              >
                {answers.updateProfile ? "Yes, Update" : "No, Keep Same"}
              </button>
            </div>

            {answers.updateProfile && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>New Weight (kg)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={answers.newWeight}
                  onChange={(e) =>
                    setAnswers({ ...answers, newWeight: e.target.value })
                  }
                  placeholder="70"
                  min="20"
                  max="500"
                />
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button
                className={styles.btnSecondary}
                onClick={() => setStep(3)}
              >
                Back
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSubmit}
                disabled={answers.updateProfile && !answers.newWeight}
              >
                Complete Check-In
              </button>
            </div>
          </div>
        )}

        <button className={styles.skipButton} onClick={handleSkip}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
