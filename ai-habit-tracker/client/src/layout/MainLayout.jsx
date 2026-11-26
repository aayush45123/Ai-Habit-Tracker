import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Bot } from "lucide-react";
import Sidebar from "../components/common/sidebar/SideBar";
import Footer from "../components/common/footer/footer";
import AIChatDrawer from "../components/AIChatDrawer/AIChatDrawer";
import styles from "./MainLayout.module.css";

function MainLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const routeHistoryRef = useRef([]);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const history = routeHistoryRef.current;
    if (history[history.length - 1] === pathname) return;
    const previousIndex = history.lastIndexOf(pathname);
    if (previousIndex >= 0) {
      history.splice(previousIndex + 1);
    } else {
      history.push(pathname);
    }
  }, [pathname]);

  const goBack = () => {
    const history = routeHistoryRef.current;
    if (history[history.length - 1] === pathname) history.pop();
    const previousPath = history.pop();
    navigate(previousPath || "/dashboard");
  };

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
          {pathname !== "/dashboard" && (
            <button type="button" className={styles.backButton} onClick={goBack}>
              <ArrowLeft size={17} aria-hidden="true" />
              <span>Back</span>
            </button>
          )}
          <Outlet />
        </div>

        {/* Footer stays at bottom of main body */}
        <Footer />
      </div>

      <button
        type="button"
        className={styles.chatLauncher}
        onClick={() => setChatOpen(true)}
        aria-label="Open HabitAI coach"
      >
        <Bot size={21} aria-hidden="true" />
        <span>Ask HabitAI</span>
      </button>
      <AIChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

export default MainLayout;
