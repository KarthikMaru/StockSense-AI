import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import StockExplorer from "./pages/StockExplorer";
import StockDetails from "./pages/StockDetails";
import MutualFunds from "./pages/MutualFunds";
import SIPCalculator from "./pages/SIPCalculator";
import AIAdvisor from "./pages/AIAdvisor";
import CompareStocks from "./pages/CompareStocks";
import Watchlist from "./pages/Watchlist";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      {/* Public marketing / auth pages (no sidebar) */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />

      {/* Publicly browsable research pages (sidebar shown once logged in feels natural,
          but stock research shouldn't require an account) */}
      <Route path="/stocks" element={<Layout withSidebar><StockExplorer /></Layout>} />
      <Route path="/stocks/:symbol" element={<Layout withSidebar><StockDetails /></Layout>} />
      <Route path="/mutual-funds" element={<Layout withSidebar><MutualFunds /></Layout>} />
      <Route path="/sip-calculator" element={<Layout withSidebar><SIPCalculator /></Layout>} />
      <Route path="/ai-advisor" element={<Layout withSidebar><AIAdvisor /></Layout>} />
      <Route path="/compare" element={<Layout withSidebar><CompareStocks /></Layout>} />

      {/* Authenticated-only pages */}
      <Route
        path="/dashboard"
        element={
          <Layout withSidebar>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/watchlist"
        element={
          <Layout withSidebar>
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/portfolio"
        element={
          <Layout withSidebar>
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout withSidebar>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Layout>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
}
