import React from "react";
import styles from "./PageLoader.module.css";

function PageLoader() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.ring}>
        <div />
        <div />
        <div />
        <div />
      </div>
      <p className={styles.text}>Loading…</p>
    </div>
  );
}

export default PageLoader;
