import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Clock,
  Server,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import styles from "./Maintenance3DModal.module.css";

export default function Maintenance3DModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const cardRef = useRef(null);

  // Target date: September 1, 2026 (or next month reset)
  useEffect(() => {
    const targetDate = new Date();
    // Move to 1st of next month
    if (targetDate.getDate() >= 25) {
      targetDate.setMonth(targetDate.getMonth() + 1);
      targetDate.setDate(1);
      targetDate.setHours(0, 0, 0, 0);
    } else {
      targetDate.setDate(targetDate.getDate() + 7);
    }

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3D Tilt Effect on mouse movement
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Normalized rotation values
    const rotateX = -(y / (rect.height / 2)) * 8;
    const rotateY = (x / (rect.width / 2)) * 8;
    setMousePos({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleClose = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Floating 3D Minimized Badge */}
      {isMinimized && (
        <div
          className={styles.floatingPill}
          onClick={handleRestore}
          title="Click to view Server Status Notice"
          role="button"
          tabIndex={0}
        >
          <div className={styles.pulseDot} />
          <Server size={18} className={styles.pillIcon} />
          <span className={styles.pillText}>
            Server Maintenance Mode • Resumes in {timeLeft.days}d {timeLeft.hours}h
          </span>
          <span className={styles.pillBadge}>View Details</span>
        </div>
      )}

      {/* Main 3D Modal Overlay */}
      {!isMinimized && (
        <div className={styles.overlay}>
          <div
            className={styles.cardContainer}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={cardRef}
            style={{
              transform: `perspective(1000px) rotateX(${mousePos.x}deg) rotateY(${mousePos.y}deg)`,
            }}
          >
            {/* 3D Depth Layers */}
            <div className={styles.ambientGlow} />

            <div className={styles.modalCard}>
              {/* Close / Minimize Button */}
              <button
                className={styles.closeBtn}
                onClick={handleClose}
                aria-label="Minimize notice"
                title="Minimize notice"
              >
                <X size={18} />
              </button>

              {/* 3D Floating Header Icon */}
              <div className={styles.iconWrapper3D}>
                <div className={styles.iconBackdrop} />
                <div className={styles.iconBox}>
                  <Server size={32} className={styles.mainIcon} />
                  <div className={styles.iconSparkle}>
                    <Sparkles size={16} />
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={styles.statusBadgeContainer}>
                <span className={styles.statusBadge}>
                  <span className={styles.beaconDot} />
                  SCHEDULED CLOUD MAINTENANCE
                </span>
              </div>

              {/* Title & Subtitle */}
              <h2 className={styles.title}>Project Temporarily Offline</h2>
              <p className={styles.subtitle}>
                The AI Habit Tracker cloud backend has temporarily reached its
                monthly free-tier hours on Render. Full services will
                automatically reactivate on <strong>September 1, 2026</strong>.
              </p>

              {/* 3D Countdown Blocks */}
              <div className={styles.countdownGrid}>
                <div className={styles.countdownBox}>
                  <span className={styles.countNum}>{timeLeft.days}</span>
                  <span className={styles.countLabel}>DAYS</span>
                </div>
                <div className={styles.countdownColon}>:</div>
                <div className={styles.countdownBox}>
                  <span className={styles.countNum}>
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className={styles.countLabel}>HOURS</span>
                </div>
                <div className={styles.countdownColon}>:</div>
                <div className={styles.countdownBox}>
                  <span className={styles.countNum}>
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className={styles.countLabel}>MINS</span>
                </div>
                <div className={styles.countdownColon}>:</div>
                <div className={styles.countdownBox}>
                  <span className={styles.countNum}>
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className={styles.countLabel}>SECS</span>
                </div>
              </div>

              {/* Live Timeline Step Bar */}
              <div className={styles.timeline}>
                <div className={`${styles.timelineStep} ${styles.stepDone}`}>
                  <div className={styles.stepDot}>✓</div>
                  <span>Limit Hit</span>
                </div>
                <div className={styles.timelineLine} />
                <div className={`${styles.timelineStep} ${styles.stepActive}`}>
                  <div className={styles.stepDot}>
                    <RefreshCw size={12} className={styles.spinIcon} />
                  </div>
                  <span>Paused</span>
                </div>
                <div className={styles.timelineLine} />
                <div className={styles.timelineStep}>
                  <div className={styles.stepDot}>🚀</div>
                  <span>Sept 1 Reset</span>
                </div>
              </div>

              {/* Safe Data Guarantee Card */}
              <div className={styles.guaranteeBox}>
                <ShieldCheck size={18} className={styles.guaranteeIcon} />
                <span>
                  All your data, habits, streaks, and accounts are 100% safely
                  persisted in MongoDB.
                </span>
              </div>

              {/* Expandable Explanation Section */}
              <div className={styles.detailsSection}>
                <button
                  className={styles.detailsToggle}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <span>Why is this happening?</span>
                  {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showDetails && (
                  <div className={styles.detailsContent}>
                    <p>
                      Render provides <strong>750 free instance hours</strong> per
                      month across all hosted web services. Our backend quota for
                      this billing cycle has been fully utilized.
                    </p>
                    <p>
                      On <strong>September 1st</strong>, Render automatically resets
                      the 750 free hours, and the server will instantly come back
                      online without any data loss.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button
                  className={styles.primaryBtn}
                  onClick={handleClose}
                >
                  <Zap size={18} />
                  <span>Preview Landing Page & UI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
