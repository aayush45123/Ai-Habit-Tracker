// src/pages/Focus/Pomodoro.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../../utils/api";
import styles from "./Pomodoro.module.css";

/*
  Features:
  - 25 min focus / 5 min break / long break after 4 cycles
  - Sound + Desktop notification
  - Persist timer state in localStorage (so refresh won't fully lose progress)
  - Log a focus session to backend on successful completion (POST /focus/log)
  - Show today's focus count (GET /focus/today)
*/


// ONLY FOR TESTING PURPOSE //
// const DEFAULTS = {
//   focus: 10, 
//   shortBreak: 3, 
//   longBreak: 7,
//   cyclesBeforeLongBreak: 4,
// };

const DEFAULTS = {
  focus:  25 * 60,
  shortBreak: 5 * 60, 
  longBreak: 15 * 60, 
  cyclesBeforeLongBreak: 4,
};

function formatTime(sec) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Pomodoro() {
  // sessionType: "focus" | "short" | "long"
  const [sessionType, setSessionType] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULTS.focus);
  const [running, setRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0); // completed focus sessions in current set
  const [completedToday, setCompletedToday] = useState(0);
  const tickRef = useRef(null);
  const audioRef = useRef(null);

  // localStorage key
  const KEY = "pomodoro_state_v1";

  // load persisted state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        // restore
        if (s.sessionType) setSessionType(s.sessionType);
        if (typeof s.secondsLeft === "number") setSecondsLeft(s.secondsLeft);
        if (typeof s.running === "boolean") setRunning(s.running);
        if (typeof s.cycleCount === "number") setCycleCount(s.cycleCount);
      }
    } catch (e) {
      // ignore
    }
    fetchTodayCount();
    // request notification permission early
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // persist
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

  // timer effect
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

  // handle end of a session
  useEffect(() => {
    if (secondsLeft <= 0) {
      // stop timer first
      setRunning(false);
      playSound();
      notify(
        `${sessionType === "focus" ? "Focus complete 🎉" : "Break over"} `
      );

      if (sessionType === "focus") {
        // increment cycle
        const newCycle = cycleCount + 1;
        setCycleCount(newCycle);

        // log focus session to backend (duration = focus minutes)
        logFocusSession(DEFAULTS.focus / 60).catch((err) => {
          // ignore: we don't block UX if logging fails
          console.error("Log focus session failed", err);
        });
      }

      // determine next session
      if (sessionType === "focus") {
        // choose short or long break
        const afterCycles = cycleCount + 1; // cycles after increment
        if (afterCycles % DEFAULTS.cyclesBeforeLongBreak === 0) {
          setSessionType("long");
          setSecondsLeft(DEFAULTS.longBreak);
        } else {
          setSessionType("short");
          setSecondsLeft(DEFAULTS.shortBreak);
        }
      } else {
        // break ended -> go to focus
        setSessionType("focus");
        setSecondsLeft(DEFAULTS.focus);
      }
    }
  }, [secondsLeft]); // eslint-disable-line

  async function logFocusSession(minutes) {
    try {
      await api.post("/focus/log", {
        durationMin: minutes,
        // server will attach date/user
      });
      // refresh today's count
      fetchTodayCount();
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchTodayCount() {
    try {
      const res = await api.get("/focus/today");
      setCompletedToday(res.data.count || 0);
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
    } else {
      // fallback: small browser alert
      // not ideal — but visible
      // window.alert(message);
      // prefer in-app toast (not included here)
    }
  }

  // small helpers to display progress %
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
      <h2 className={styles.title}>Focus Mode — Pomodoro</h2>

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

        <div className={styles.stat}>
          <div>Completed today</div>
          <div className={styles.count}>{completedToday}</div>
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

      {/* audio element for bell */}
      <audio
        ref={audioRef}
        src="/sounds/pomodoro_bell.wav"
        preload="auto"
      ></audio>
    </div>
  );
}
