// src/pages/Focus/Pomodoro.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../../utils/api";
import styles from "./Pomodoro.module.css";
import PomodoroAnalytics from "../../components/PomodoroAnalytics/PomodoroAnalytics";

const DEFAULTS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  cyclesBeforeLongBreak: 4,
};

// ONLY FOR TESTING PURPOSE //
// const DEFAULTS = {
//   focus: 10,
//   shortBreak: 3,
//   longBreak: 7,
//   cyclesBeforeLongBreak: 4,
// };

function formatTime(sec) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Pomodoro() {
  const [sessionType, setSessionType] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULTS.focus);
  const [running, setRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [skippedToday, setSkippedToday] = useState(0);
  const [wasSkipped, setWasSkipped] = useState(false);
  const tickRef = useRef(null);
  const audioRef = useRef(null);

  const KEY = "pomodoro_state_v1";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.sessionType) setSessionType(s.sessionType);
        if (typeof s.secondsLeft === "number") setSecondsLeft(s.secondsLeft);
        if (typeof s.running === "boolean") setRunning(s.running);
        if (typeof s.cycleCount === "number") setCycleCount(s.cycleCount);
      }
    } catch (e) {
      // ignore
    }
    fetchTodayCount();
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const payload = {
      sessionType,
      secondsLeft,
      running,
      cycleCount,
      updatedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  }, [sessionType, secondsLeft, running, cycleCount]);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setRunning(false);
      playSound();

      // Only log as completed if it wasn't manually skipped
      if (sessionType === "focus" && !wasSkipped) {
        notify("Focus complete 🎉");
        const newCycle = cycleCount + 1;
        setCycleCount(newCycle);

        // Log completed focus session
        logFocusSession(DEFAULTS.focus / 60, "completed").catch((err) => {
          console.error("Log focus session failed", err);
        });
      } else if (sessionType !== "focus") {
        notify("Break over");
      }

      // Reset skip flag
      setWasSkipped(false);

      if (sessionType === "focus") {
        const afterCycles = cycleCount + (wasSkipped ? 0 : 1);
        if (afterCycles % DEFAULTS.cyclesBeforeLongBreak === 0) {
          setSessionType("long");
          setSecondsLeft(DEFAULTS.longBreak);
        } else {
          setSessionType("short");
          setSecondsLeft(DEFAULTS.shortBreak);
        }
      } else {
        setSessionType("focus");
        setSecondsLeft(DEFAULTS.focus);
      }
    }
  }, [secondsLeft]); // eslint-disable-line

  async function logFocusSession(minutes, status = "completed") {
    try {
      await api.post("/focus/log", {
        durationMin: minutes,
        sessionType: sessionType,
        status: status,
      });
      fetchTodayCount();
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTodayCount() {
    try {
      const res = await api.get("/focus/today");
      setCompletedToday(res.data.count || 0);
      setSkippedToday(res.data.skipped || 0);
    } catch (err) {
      console.error("fetchTodayCount", err);
    }
  }

  function startPause() {
    setRunning((r) => !r);
  }

  function resetSession() {
    setRunning(false);
    if (sessionType === "focus") setSecondsLeft(DEFAULTS.focus);
    else if (sessionType === "short") setSecondsLeft(DEFAULTS.shortBreak);
    else setSecondsLeft(DEFAULTS.longBreak);
  }

  function skipSession() {
    // Mark that this session was skipped
    setWasSkipped(true);

    // Log as skipped if it's a focus session
    if (sessionType === "focus") {
      // Calculate how much time was actually spent before skipping
      const timeSpent = sessionLength - secondsLeft;
      const minutesSpent = Math.floor(timeSpent / 60);

      logFocusSession(minutesSpent, "skipped").catch((err) => {
        console.error("Log skipped session failed", err);
      });
    }
    setSecondsLeft(0);
  }

  function switchTo(type) {
    setSessionType(type);
    setRunning(false);
    if (type === "focus") setSecondsLeft(DEFAULTS.focus);
    else if (type === "short") setSecondsLeft(DEFAULTS.shortBreak);
    else setSecondsLeft(DEFAULTS.longBreak);
  }

  function playSound() {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch (e) {}
  }

  function notify(message) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try {
        new Notification(message, { silent: false });
      } catch (e) {}
    }
  }

  const sessionLength =
    sessionType === "focus"
      ? DEFAULTS.focus
      : sessionType === "short"
      ? DEFAULTS.shortBreak
      : DEFAULTS.longBreak;
  const percent = Math.round(
    ((sessionLength - secondsLeft) / sessionLength) * 100
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Focus Mode — Pomodoro</h2>
        <div className={styles.description}>
          <p>
            The Pomodoro Technique was developed by Francesco Cirillo in the
            late 1980s, named after the tomato-shaped kitchen timer he used as a
            university student.
          </p>
          <p>
            This time management method breaks work into focused 25-minute
            intervals separated by short breaks, helping you maintain
            concentration and prevent burnout.
          </p>
          <p>
            After four work sessions, take a longer break to recharge and
            maintain peak productivity throughout your day.
          </p>
        </div>
      </div>

      <div className={styles.top}>
        <div className={styles.controls}>
          <button
            className={`${styles.typeBtn} ${
              sessionType === "focus" ? styles.active : ""
            }`}
            onClick={() => switchTo("focus")}
          >
            Focus
          </button>
          <button
            className={`${styles.typeBtn} ${
              sessionType === "short" ? styles.active : ""
            }`}
            onClick={() => switchTo("short")}
          >
            Short Break
          </button>
          <button
            className={`${styles.typeBtn} ${
              sessionType === "long" ? styles.active : ""
            }`}
            onClick={() => switchTo("long")}
          >
            Long Break
          </button>
        </div>

        <div className={styles.statsGroup}>
          <div className={styles.stat}>
            <div>Completed</div>
            <div className={styles.count}>{completedToday}</div>
          </div>
          <div className={styles.stat}>
            <div>Skipped</div>
            <div className={styles.count}>{skippedToday}</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.timerDisplay}>
          <div className={styles.sessionLabel}>
            {sessionType === "focus"
              ? "Focus"
              : sessionType === "short"
              ? "Break"
              : "Long Break"}
          </div>
          <div className={styles.time}>
            {formatTime(Math.max(0, secondsLeft))}
          </div>

          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div
                style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
                className={styles.progressFill}
              ></div>
            </div>
            <div className={styles.pct}>{percent}%</div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primary} onClick={startPause}>
              {running ? "Pause" : "Start"}
            </button>
            <button className={styles.secondary} onClick={resetSession}>
              Reset
            </button>
            <button className={styles.ghost} onClick={skipSession}>
              Skip
            </button>
          </div>

          <div className={styles.hint}>
            Long break after {DEFAULTS.cyclesBeforeLongBreak} focus sessions.
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <PomodoroAnalytics />

      <audio
        ref={audioRef}
        src="/sounds/pomodoro_bell.wav"
        preload="auto"
      ></audio>
    </div>
  );
}
