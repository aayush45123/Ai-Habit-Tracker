// client/src/components/AITimetableGenerator/AITimetableGenerator.jsx
import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Loader, Wand2 } from "lucide-react";
import api from "../../utils/api";
import styles from "./AITimetableGenerator.module.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AITimetableGenerator({ onGenerated }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("5");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [equipment, setEquipment] = useState("");
  const [injuries, setInjuries] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const buildPrompt = () => {
    return `You are a professional fitness trainer. Generate a detailed 7-day workout timetable as a valid JSON object.

User profile:
- Fitness goal: ${fitnessGoal}
- Fitness level: ${fitnessLevel}
- Preferred workout days per week: ${daysPerWeek}
- Workout duration per session: ${workoutDuration} minutes
- Available equipment: ${equipment || "standard gym equipment"}
- Injuries or limitations: ${injuries || "none"}
- Focus areas: ${focusAreas || "full body"}
- Additional notes: ${additionalNotes || "none"}

Return ONLY a valid JSON object in this exact format, no extra text, no markdown:
{
  "name": "string — descriptive timetable name",
  "category": "one of: bodybuilding | powerlifting | crossfit | calisthenics | sports_specific | general_fitness | weight_loss | endurance",
  "goal": "one of: fat_loss | muscle_gain | strength | sports_stamina | general_fitness | endurance | flexibility",
  "level": "one of: beginner | intermediate | advanced",
  "weeklySchedule": [
    {
      "day": "Monday",
      "focusArea": "string e.g. Chest + Triceps",
      "isRestDay": false,
      "startTime": "06:00",
      "endTime": "07:30",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": "4",
          "reps": "8-10",
          "duration": "",
          "restBetweenSets": "90s",
          "notes": "any form tips"
        }
      ],
      "timeBlock": {
        "morning": "",
        "afternoon": "",
        "evening": "Main workout",
        "night": ""
      }
    }
  ]
}

Rules:
- weeklySchedule must have exactly 7 entries, one per day (Monday through Sunday)
- Rest days must have isRestDay: true and exercises: []
- Active days must have at least 3-6 exercises with real names
- Exercises on rest days must be an empty array []
- Do not return markdown, backticks, or any explanation — pure JSON only`;
  };

  const handleGenerate = async () => {
    if (!fitnessGoal || !fitnessLevel || !workoutDuration) {
      setError("Please fill in Fitness Goal, Level, and Workout Duration.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/ai-timetable/generate", {
        fitnessGoal,
        fitnessLevel,
        daysPerWeek,
        workoutDuration,
        equipment,
        injuries,
        focusAreas,
        additionalNotes,
      });

      const parsed = data;

      if (!parsed.weeklySchedule || parsed.weeklySchedule.length !== 7) {
        throw new Error(
          "AI returned an invalid schedule structure. Please try again.",
        );
      }

      const fixedSchedule = DAYS.map((dayName, i) => {
        const day = parsed.weeklySchedule[i] || {};

        return {
          day: dayName,
          focusArea: day.focusArea || "",
          isRestDay: day.isRestDay || false,
          startTime: day.startTime || "",
          endTime: day.endTime || "",
          exercises: day.isRestDay
            ? []
            : (day.exercises || []).filter(
                (ex) => ex.name && ex.name.trim() !== "",
              ),
          timeBlock: {
            morning: day.timeBlock?.morning || "",
            afternoon: day.timeBlock?.afternoon || "",
            evening: day.timeBlock?.evening || "",
            night: day.timeBlock?.night || "",
          },
        };
      });

      onGenerated({
        name: parsed.name || \"My Fitness Schedule\",
        category: parsed.category || "general_fitness",
        goal: parsed.goal || "general_fitness",
        level: parsed.level || "intermediate",
        weeklySchedule: fixedSchedule,
      });
    } catch (err) {
      console.error("AI generation error:", err);
    }
    setLoading(false);
  };

  return (
    <div className={styles.root}>
      {/* COLLAPSED HEADER — always visible */}
      <button
        className={styles.toggleBtn}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className={styles.toggleLeft}>
          <div className={styles.iconWrap}>
            <Sparkles className={styles.sparkleIcon} />
          </div>
          <div className={styles.toggleText}>
            <span className={styles.toggleTitle}>Generate with AI</span>
            <span className={styles.toggleSub}>
              Describe your goals — AI builds the full 7-day plan
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className={styles.chevron} />
        ) : (
          <ChevronDown className={styles.chevron} />
        )}
      </button>

      {/* EXPANDED FORM */}
      {expanded && (
        <div className={styles.form}>
          <div className={styles.divider} />

          {/* ROW 1 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Fitness Goal *</label>
              <select
                className={styles.select}
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
              >
                <option value="">Select goal</option>
                <option value="Build muscle mass and increase strength">
                  Muscle Gain
                </option>
                <option value="Lose fat and improve body composition">
                  Fat Loss
                </option>
                <option value="Increase maximal strength and power">
                  Strength
                </option>
                <option value="Improve cardiovascular endurance">
                  Endurance
                </option>
                <option value="General fitness and healthy lifestyle">
                  General Fitness
                </option>
                <option value="Improve flexibility and mobility">
                  Flexibility
                </option>
                <option value="Improve sports-specific performance and stamina">
                  Sports Stamina
                </option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Fitness Level *</label>
              <select
                className={styles.select}
                value={fitnessLevel}
                onChange={(e) => setFitnessLevel(e.target.value)}
              >
                <option value="">Select level</option>
                <option value="beginner — less than 6 months training experience">
                  Beginner
                </option>
                <option value="intermediate — 6 months to 2 years training experience">
                  Intermediate
                </option>
                <option value="advanced — 2+ years consistent training">
                  Advanced
                </option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Days Per Week</label>
              <select
                className={styles.select}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
              >
                {[3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={String(d)}>
                    {d} days
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ROW 2 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Session Duration (mins) *</label>
              <select
                className={styles.select}
                value={workoutDuration}
                onChange={(e) => setWorkoutDuration(e.target.value)}
              >
                <option value="">Select duration</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="75">75 min</option>
                <option value="90">90 min</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Available Equipment</label>
              <select
                className={styles.select}
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
              >
                <option value="">Full gym</option>
                <option value="full gym with all equipment">Full Gym</option>
                <option value="dumbbells and barbells only">
                  Dumbbells + Barbells
                </option>
                <option value="dumbbells only">Dumbbells Only</option>
                <option value="resistance bands and bodyweight only">
                  Bands + Bodyweight
                </option>
                <option value="bodyweight only, no equipment">
                  Bodyweight Only
                </option>
                <option value="home gym with basic equipment">Home Gym</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Focus Areas</label>
              <input
                type="text"
                className={styles.input}
                value={focusAreas}
                onChange={(e) => setFocusAreas(e.target.value)}
                placeholder="e.g., Upper body, legs, core"
              />
            </div>
          </div>

          {/* ROW 3 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Injuries / Limitations</label>
              <input
                type="text"
                className={styles.input}
                value={injuries}
                onChange={(e) => setInjuries(e.target.value)}
                placeholder="e.g., Bad knees, lower back pain"
              />
            </div>

            <div className={`${styles.field} ${styles.fieldWide}`}>
              <label className={styles.label}>Additional Notes</label>
              <input
                type="text"
                className={styles.input}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g., Prefer morning workouts, no cardio on Mondays"
              />
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className={styles.errorBox}>
              <span>{error}</span>
            </div>
          )}

          {/* HINT */}
          <p className={styles.hint}>
            AI will generate a full 7-day schedule. You can edit every exercise,
            set, rep, and time after it's created.
          </p>

          {/* GENERATE BUTTON */}
          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className={styles.spinIcon} />
                <span>Generating your plan...</span>
              </>
            ) : (
              <>
                <Wand2 className={styles.btnIcon} />
                <span>Generate Timetable</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
