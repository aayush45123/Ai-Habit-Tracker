import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component
 * Automatically smoothly scrolls the window and all scrollable containers
 * to the top whenever the route pathname changes.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Smooth scroll window and document elements
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    if (document.documentElement) {
      document.documentElement.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }

    if (document.body) {
      document.body.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }

    // Also find any overflowing/scrollable main containers if applicable
    const mainContainers = document.querySelectorAll("[class*='mainSection'], [class*='pageBody']");
    mainContainers.forEach((el) => {
      if (el && typeof el.scrollTo === "function") {
        el.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
      }
    });
  }, [pathname]);

  return null;
}
