import React from "react";
import styles from "./Skeleton.module.css";

/**
 * Base Skeleton primitive — renders a shimming placeholder block.
 *
 * Props:
 *   width    — CSS width  (default "100%")
 *   height   — CSS height (default "1rem")
 *   variant  — "rect" | "rounded" | "circle" (default "rect")
 *   style    — extra inline style overrides
 *   className — extra class names
 */
export function Skeleton({
  width = "100%",
  height = "1rem",
  variant = "rect",
  style = {},
  className = "",
}) {
  return (
    <span
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

/**
 * Full-page app-shell skeleton shown while auth / route guards are loading.
 * Mimics the sidebar + main content layout.
 */
export function AppShellSkeleton() {
  return (
    <div className={styles.appShell} aria-label="Loading…" role="status">
      {/* Sidebar */}
      <aside className={styles.appShellSidebar}>
        <Skeleton height="48px" width="80%" variant="rect" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} height="40px" width="100%" variant="rect" />
        ))}
      </aside>

      {/* Main content area */}
      <main className={styles.appShellMain}>
        <Skeleton height="44px" width="260px" variant="rect" />
        <Skeleton height="20px" width="180px" variant="rounded" />
        <div className={styles.appShellCardGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="260px" variant="rect" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default Skeleton;
