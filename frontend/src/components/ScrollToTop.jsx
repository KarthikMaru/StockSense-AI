import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router doesn't reset scroll position on navigation by default,
 * which feels broken on a content-heavy site like this (e.g. navigating
 * from the bottom of Stock Explorer to a new Stock Details page should
 * start at the top). Mount this once, near the root, inside <BrowserRouter>.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
