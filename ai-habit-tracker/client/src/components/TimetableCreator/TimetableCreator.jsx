// client/src/components/TimetableCreator/TimetableCreator.jsx
import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  X,
  Calendar,
  Award,
  TrendingUp,
  Activity,
} from "lucide-react";
import styles from "./TimetableCreator.module.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ✅ FIXED: Function to create fresh empty exercise
const createEmptyExercise = () => ({
  name: "",
  sets: "",
  reps: "",
  duration: "",
  restBetweenSets: "",
  notes: "",
});

// ✅ FIXED: Function to create fresh empty day
const createEmptyDay = (dayName) => ({
  day: dayName,
  focusArea: "",
  startTime: "",
  endTime: "",
  isRestDay: false,
  exercises: [createEmptyExercise()],
  timeBlock: {
    morning: "",
    afternoon: "",
    evening: "",
    night: "",
  },
});

export default function TimetableCreator({ onSave, onCancel, initialData }) {
  const [name, setName] = useState(initialData?.name || "My Workout Schedule");
  const [category, setCategory] = useState(
    initialData?.category || "bodybuilding",
  );
  const [goal, setGoal] = useState(initialData?.goal || "muscle_gain");
  const [level, setLevel] = useState(initialData?.level || "intermediate");
  const [sportsEnabled, setSportsEnabled] = useState(
    initialData?.sportsMode?.enabled || false,
  );
  const [sport, setSport] = useState(initialData?.sportsMode?.sport || "none");

  // ✅ FIXED: Initialize schedule with unique objects for each day
  const [schedule, setSchedule] = useState(() => {
    if (
      initialData?.weeklySchedule &&
      initialData.weeklySchedule.length === 7
    ) {
      // Deep clone to avoid reference issues
      return initialData.weeklySchedule.map((day) => ({
        ...day,
        exercises: day.exercises.map((ex) => ({ ...ex })),
        timeBlock: { ...day.timeBlock },
      }));
    }
    // Create fresh empty day for each day of the week
    return DAYS.map((dayName) => createEmptyDay(dayName));
  });

  const [activeDay, setActiveDay] = useState(0);

  // ✅ FIXED: Update day immutably
  const updateDay = (dayIndex, field, value) => {
    setSchedule((prevSchedule) => {
      const updated = [...prevSchedule];
      updated[dayIndex] = {
        ...updated[dayIndex],
        [field]: value,
      };
      return updated;
    });
  };

  // ✅ FIXED: Update exercise immutably
  const updateExercise = (dayIndex, exIndex, field, value) => {
    setSchedule((prevSchedule) => {
      const updated = [...prevSchedule];
      const updatedExercises = [...updated[dayIndex].exercises];
      updatedExercises[exIndex] = {
        ...updatedExercises[exIndex],
        [field]: value,
      };
      updated[dayIndex] = {
        ...updated[dayIndex],
        exercises: updatedExercises,
      };
      return updated;
    });
  };

  // ✅ FIXED: Add exercise with fresh object
  const addExercise = (dayIndex) => {
    setSchedule((prevSchedule) => {
      const updated = [...prevSchedule];
      updated[dayIndex] = {
        ...updated[dayIndex],
        exercises: [...updated[dayIndex].exercises, createEmptyExercise()],
      };
      return updated;
    });
  };

  // ✅ FIXED: Remove exercise immutably
  const removeExercise = (dayIndex, exIndex) => {
    setSchedule((prevSchedule) => {
      const updated = [...prevSchedule];
      if (updated[dayIndex].exercises.length > 1) {
        const updatedExercises = [...updated[dayIndex].exercises];
        updatedExercises.splice(exIndex, 1);
        updated[dayIndex] = {
          ...updated[dayIndex],
          exercises: updatedExercises,
        };
      }
      return updated;
    });
  };

  // ✅ FIXED: Update time block immutably
  const updateTimeBlock = (dayIndex, block, value) => {
    setSchedule((prevSchedule) => {
      const updated = [...prevSchedule];
      updated[dayIndex] = {
        ...updated[dayIndex],
        timeBlock: {
          ...updated[dayIndex].timeBlock,
          [block]: value,
        },
      };
      return updated;
    });
  };

  const handleSave = () => {
    // Validation
    const hasContent = schedule.some(
      (day) =>
        day.focusArea || day.exercises.some((ex) => ex.name) || day.isRestDay,
    );

    if (!hasContent) {
      alert("Please fill in at least one day's workout details");
      return;
    }

    onSave({
      name,
      category,
      goal,
      level,
      sportsMode: {
        enabled: sportsEnabled,
        sport: sportsEnabled ? sport : "none",
      },
      weeklySchedule: schedule,
    });
  };

  const currentDay = schedule[activeDay];

  return (
    <div className={styles.root}>
      {/* HEADER INFO */}
      <div className={styles.headerCard}>
        <h3 className={styles.headerTitle}>Create Your Workout Timetable</h3>

        <div className={styles.basicInfo}>
          <div className={styles.infoGroup}>
            <label className={styles.label}>Timetable Name</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Bulk Plan"
            />
          </div>

          <div className={styles.infoRow}>
            <div className={styles.infoGroup}>
              <label className={styles.label}>
                <Calendar className={styles.labelIcon} />
                Category
              </label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="bodybuilding">Bodybuilding</option>
                <option value="powerlifting">Powerlifting</option>
                <option value="crossfit">CrossFit</option>
                <option value="calisthenics">Calisthenics</option>
                <option value="sports_specific">Sports Specific</option>
                <option value="general_fitness">General Fitness</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="endurance">Endurance</option>
              </select>
            </div>

            <div className={styles.infoGroup}>
              <label className={styles.label}>
                <Award className={styles.labelIcon} />
                Goal
              </label>
              <select
                className={styles.select}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="fat_loss">Fat Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="strength">Strength</option>
                <option value="sports_stamina">Sports Stamina</option>
                <option value="general_fitness">General Fitness</option>
                <option value="endurance">Endurance</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </div>

            <div className={styles.infoGroup}>
              <label className={styles.label}>
                <TrendingUp className={styles.labelIcon} />
                Level
              </label>
              <select
                className={styles.select}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className={styles.sportsRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={sportsEnabled}
                onChange={(e) => setSportsEnabled(e.target.checked)}
              />
              <Activity className={styles.labelIcon} />
              <span>Enable Sports Mode</span>
            </label>

            {sportsEnabled && (
              <select
                className={styles.select}
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              >
                <option value="cricket_bowler">Cricket - Bowler</option>
                <option value="cricket_batter">Cricket - Batter</option>
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="runner">Runner</option>
                <option value="swimmer">Swimmer</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* DAY TABS */}
      <div className={styles.dayTabs}>
        {DAYS.map((day, index) => (
          <button
            key={day}
            className={`${styles.dayTab} ${
              activeDay === index ? styles.activeTab : ""
            }`}
            onClick={() => setActiveDay(index)}
          >
            <span className={styles.dayNumber}>{index + 1}</span>
            <span className={styles.dayName}>{day.slice(0, 3)}</span>
          </button>
        ))}
      </div>

      {/* CURRENT DAY EDITOR */}
      <div className={styles.dayEditor}>
        <div className={styles.dayHeader}>
          <h4 className={styles.dayTitle}>{currentDay.day}</h4>
          <label className={styles.restDayToggle}>
            <input
              type="checkbox"
              checked={currentDay.isRestDay}
              onChange={(e) =>
                updateDay(activeDay, "isRestDay", e.target.checked)
              }
            />
            <span>Rest Day</span>
          </label>
        </div>

        {/* BASIC DAY INFO */}
        <div className={styles.dayBasicInfo}>
          <div className={styles.infoGroup}>
            <label className={styles.label}>Focus Area</label>
            <input
              type="text"
              className={styles.input}
              value={currentDay.focusArea}
              onChange={(e) =>
                updateDay(activeDay, "focusArea", e.target.value)
              }
              placeholder="e.g., Chest + Triceps"
              disabled={currentDay.isRestDay}
            />
          </div>

          <div className={styles.timeInputs}>
            <div className={styles.infoGroup}>
              <label className={styles.label}>Start Time</label>
              <input
                type="time"
                className={styles.input}
                value={currentDay.startTime}
                onChange={(e) =>
                  updateDay(activeDay, "startTime", e.target.value)
                }
              />
            </div>

            <div className={styles.infoGroup}>
              <label className={styles.label}>End Time</label>
              <input
                type="time"
                className={styles.input}
                value={currentDay.endTime}
                onChange={(e) =>
                  updateDay(activeDay, "endTime", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* EXERCISES TABLE */}
        {!currentDay.isRestDay && (
          <div className={styles.exercisesSection}>
            <div className={styles.sectionHeader}>
              <h5 className={styles.sectionTitle}>Exercises</h5>
              <button
                className={styles.addExerciseBtn}
                onClick={() => addExercise(activeDay)}
              >
                <Plus className={styles.btnIcon} />
                <span>Add Exercise</span>
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.exerciseTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Exercise Name</th>
                    <th>Sets</th>
                    <th>Reps</th>
                    <th>Duration</th>
                    <th>Rest</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {currentDay.exercises.map((exercise, exIndex) => (
                    <tr key={exIndex}>
                      <td className={styles.numberCell}>{exIndex + 1}</td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={exercise.name}
                          onChange={(e) =>
                            updateExercise(
                              activeDay,
                              exIndex,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., Bench Press"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExercise(
                              activeDay,
                              exIndex,
                              "sets",
                              e.target.value,
                            )
                          }
                          placeholder="4"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={exercise.reps}
                          onChange={(e) =>
                            updateExercise(
                              activeDay,
                              exIndex,
                              "reps",
                              e.target.value,
                            )
                          }
                          placeholder="8-10"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={exercise.duration}
                          onChange={(e) =>
                            updateExercise(
                              activeDay,
                              exIndex,
                              "duration",
                              e.target.value,
                            )
                          }
                          placeholder="30s"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={exercise.restBetweenSets}
                          onChange={(e) =>
                            updateExercise(
                              activeDay,
                              exIndex,
                              "restBetweenSets",
                              e.target.value,
                            )
                          }
                          placeholder="90s"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={exercise.notes}
                          onChange={(e) =>
                            updateExercise(
                              activeDay,
                              exIndex,
                              "notes",
                              e.target.value,
                            )
                          }
                          placeholder="Form notes..."
                        />
                      </td>
                      <td>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeExercise(activeDay, exIndex)}
                          disabled={currentDay.exercises.length === 1}
                        >
                          <Trash2 className={styles.removeIcon} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TIME BLOCKS */}
        <div className={styles.timeBlocksSection}>
          <h5 className={styles.sectionTitle}>Time Blocks</h5>
          <div className={styles.timeBlocksGrid}>
            <div className={styles.timeBlockInput}>
              <label className={styles.label}>Morning</label>
              <input
                type="text"
                className={styles.input}
                value={currentDay.timeBlock.morning}
                onChange={(e) =>
                  updateTimeBlock(activeDay, "morning", e.target.value)
                }
                placeholder="e.g., Light stretching"
              />
            </div>
            <div className={styles.timeBlockInput}>
              <label className={styles.label}>Afternoon</label>
              <input
                type="text"
                className={styles.input}
                value={currentDay.timeBlock.afternoon}
                onChange={(e) =>
                  updateTimeBlock(activeDay, "afternoon", e.target.value)
                }
                placeholder="e.g., Rest"
              />
            </div>
            <div className={styles.timeBlockInput}>
              <label className={styles.label}>Evening</label>
              <input
                type="text"
                className={styles.input}
                value={currentDay.timeBlock.evening}
                onChange={(e) =>
                  updateTimeBlock(activeDay, "evening", e.target.value)
                }
                placeholder="e.g., Main workout"
              />
            </div>
            <div className={styles.timeBlockInput}>
              <label className={styles.label}>Night</label>
              <input
                type="text"
                className={styles.input}
                value={currentDay.timeBlock.night}
                onChange={(e) =>
                  updateTimeBlock(activeDay, "night", e.target.value)
                }
                placeholder="e.g., Protein + sleep"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel}>
          <X className={styles.btnIcon} />
          <span>Cancel</span>
        </button>
        <button className={styles.saveBtn} onClick={handleSave}>
          <Save className={styles.btnIcon} />
          <span>Save Timetable</span>
        </button>
      </div>
    </div>
  );
}
