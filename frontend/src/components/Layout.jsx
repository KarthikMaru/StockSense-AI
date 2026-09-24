import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

/**
 * Two layout modes:
 * - withSidebar=true: dashboard-style pages (Dashboard, Stocks, Watchlist, etc.)
 * - withSidebar=false: marketing/full-width pages (Home, Login, Register)
 */
export default function Layout({ children, withSidebar = false }) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-dark">
      <Navbar />
      <div className="flex flex-1">
        {withSidebar && <Sidebar />}
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
