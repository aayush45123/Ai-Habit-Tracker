import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/common/sidebar/SideBar";
import Footer from "../components/common/footer/footer";
import styles from "./MainLayout.module.css";

function MainLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    // Smoothly scroll window and main layout container to top on page switch
    if (mainRef.current && typeof mainRef.current.scrollTo === "function") {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [pathname]);

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />

      <div className={styles.mainSection} ref={mainRef}>
        <div className={styles.pageBody}>
          <Outlet />
        </div>

        {/* Footer stays at bottom of main body */}
        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
