import React, { useRef, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Flame, Zap, Check, ArrowRight, Dumbbell, BookOpen, Droplets, Brain } from "lucide-react";
import s from "./Hero3D.module.css";

const HABITS = [
  { id: "water", label: "Drink 3L water", icon: Droplets, xp: 10 },
  { id: "workout", label: "45 min workout", icon: Dumbbell, xp: 25 },
  { id: "read", label: "Read 20 pages", icon: BookOpen, xp: 15 },
  { id: "focus", label: "Deep focus session", icon: Brain, xp: 20 },
];

const COACH = [
  "Tap a habit to check it off. This is a live preview.",
  "One down. Your streak is safe for today.",
  "Halfway. The AI coach plans tomorrow from what you finish today.",
  "One left to complete the day.",
  "Day complete. Create an account to keep this streak going.",
];

// Fixed pattern for the last 34 days; the final cell is "today"
const HISTORY = [2,3,3,0,2,3,3, 3,2,0,3,3,2,3, 3,3,2,3,0,3,3, 2,3,3,3,2,3,3, 3,3,3,2,3,3];
const RING = 2 * Math.PI * 26;

export default function Hero3D() {
  const stageRef = useRef(null);
  const raf = useRef(0);
  const [done, setDone] = useState([]);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const tilt = useCallback((e) => {
    if (reduced || !stageRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      stageRef.current?.style.setProperty("--ry", `${x * 18}deg`);
      stageRef.current?.style.setProperty("--rx", `${-y * 14}deg`);
    });
  }, [reduced]);

  const reset = useCallback(() => {
    cancelAnimationFrame(raf.current);
    stageRef.current?.style.setProperty("--ry", "0deg");
    stageRef.current?.style.setProperty("--rx", "0deg");
  }, []);

  const toggle = (id) =>
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const count = done.length;
  const all = count === HABITS.length;
  const xp = HABITS.filter((h) => done.includes(h.id)).reduce((a, h) => a + h.xp, 0);

  return (
    <section className={s.hero} id="hero">
      <div className={s.copy}>
        <h1 className={s.title}>
          <span className={s.line}><span>Build the habit.</span></span>
          <span className={s.line}><span>Keep the streak.</span></span>
        </h1>
        <p className={s.sub}>
          Track daily habits, workouts, calories and focus time in one place.
          An AI coach reads your own data and tells you what to fix next.
        </p>
        <div className={s.actions}>
          <Link to="/signup" className={s.primary}>
            <span>Start tracking</span>
            <ArrowRight size={17} strokeWidth={2.75} />
          </Link>
          <Link to="/login" className={s.secondary}>Log in</Link>
        </div>
        <p className={s.note}>Sign in with Google, phone or email.</p>
      </div>

      <div className={s.scene} onMouseMove={tilt} onMouseLeave={reset}>
        <div className={s.enter}>
          <div className={`${s.stage} ${all ? s.complete : ""}`} ref={stageRef}>
            {/* back layer: 5-week history */}
            <div className={`${s.card} ${s.back}`} aria-hidden="true">
              <div className={s.cardHead}>Last 5 weeks</div>
              <div className={s.heat}>
                {HISTORY.map((lv, i) => <i key={i} data-l={lv} />)}
                <i data-l={all ? 3 : 1} className={s.today} />
              </div>
            </div>

            {/* middle layer: interactive habit list */}
            <div className={`${s.card} ${s.mid}`}>
              <div className={s.cardHead}>
                <span>Today</span>
                <svg width="64" height="64" viewBox="0 0 64 64" className={s.ring} aria-label={`${count} of ${HABITS.length} done`}>
                  <circle cx="32" cy="32" r="26" className={s.ringBg} />
                  <circle cx="32" cy="32" r="26" className={s.ringFg}
                    style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - count / HABITS.length) }} />
                  <text x="32" y="37" textAnchor="middle" className={s.ringText}>{count}/{HABITS.length}</text>
                </svg>
              </div>
              <ul className={s.list}>
                {HABITS.map((h, i) => {
                  const Icon = h.icon;
                  const on = done.includes(h.id);
                  return (
                    <li key={h.id}>
                      <button type="button" aria-pressed={on}
                        className={`${s.row} ${on ? s.on : ""} ${count === 0 && i === 0 ? s.hint : ""}`}
                        onClick={() => toggle(h.id)}>
                        <Icon size={18} strokeWidth={2.4} />
                        <span>{h.label}</span>
                        <b className={s.tick}>{on && <Check size={14} strokeWidth={3.5} />}</b>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* front layer: floating chips */}
            <div className={`${s.chip} ${s.streak}`}>
              <Flame size={18} strokeWidth={2.6} />
              <span><b key={all ? 7 : 6}>{all ? 7 : 6}</b> day streak</span>
            </div>
            <div className={`${s.chip} ${s.xp}`}>
              <Zap size={16} strokeWidth={2.8} />
              <span><b key={xp}>+{xp}</b> XP</span>
            </div>
            <div className={`${s.chip} ${s.coach}`} aria-live="polite">
              <span key={count}>{COACH[count]}</span>
              {all && (
                <Link to="/signup" className={s.keep}>
                  Keep this streak <ArrowRight size={14} strokeWidth={3} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}