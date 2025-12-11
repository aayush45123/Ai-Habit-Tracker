import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/sidebar/SideBar";
import Footer from "../components/common/footer/footer";
import styles from "./MainLayout.module.css";

function MainLayout() {
  return (
    <div className={styles.layoutContainer}>
      <Sidebar />

      <div className={styles.mainSection}>
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
