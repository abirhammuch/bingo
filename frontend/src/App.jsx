import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LobbyPage from "./pages/LobbyPage";
import TournamentPage from "./pages/TournamentPage";
import PromotionPage from "./pages/PromotionPage";
import PromoCodePage from "./pages/PromoCodePage";
import PredictionPoolPage from "./pages/PredictionPoolPage";
import ReferralPage from "./pages/ReferralPage";
import VIPRewardPage from "./pages/VIPRewardPage";
import CashbackPage from "./pages/CashbackPage";
import HappyHour from "./pages/HappyHour";
import AppearancePage from "./pages/AppearancePage";

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (mobileOpen && window.innerWidth <= 768) {
      setMobileOpen(false);
    }
  }, [location.pathname, mobileOpen]);

  const toggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((s) => !s);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Header
        onToggleSidebar={toggle}
        isSidebarCollapsed={collapsed}
        isMobileOpen={mobileOpen}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6 relative">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="flex-1 relative z-10">
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-6 min-h-[60vh]">
            <Routes>
              <Route path="/" element={<LobbyPage />} />
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/tournament" element={<TournamentPage />} />
              <Route path="/promotions" element={<PromotionPage />} />
              <Route path="/promo-codes" element={<PromoCodePage />} />
              <Route path="/prediction" element={<PredictionPoolPage />} />
              <Route path="/referral" element={<ReferralPage />} />
              <Route path="/vip" element={<VIPRewardPage />} />
              <Route path="/cashback" element={<CashbackPage />} />
              <Route path="/happy-hour" element={<HappyHour />} />
              <Route path="/appearance" element={<AppearancePage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
