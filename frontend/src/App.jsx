import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LobbyPage from "./pages/LobbyPage";
import BingoPage from "./pages/bingopage/BingoPage";
import LudoPage from "./pages/LudoPage";
import SpinPage from "./pages/SpinPage";
import TournamentPage from "./pages/TournamentPage";
import PromotionPage from "./pages/PromotionPage";
import PromoCodePage from "./pages/PromoCodePage";
import PredictionPoolPage from "./pages/PredictionPoolPage";
import OpenPredictionPage from "./pages/OpenPredictionPage";
import ReferralPage from "./pages/ReferralPage";
import ProfilePage from "./pages/ProfilePage";
import MyWalletPage from "./pages/MyWalletPage";
import VIPRewardPage from "./pages/VIPRewardPage";
import CashbackPage from "./pages/CashbackPage";
import HappyHour from "./pages/HappyHour";
import FreeCashRain from "./pages/FreeCashRain";
import AppearancePage from "./pages/AppearancePage";
import SearchResults from "./pages/SearchResults";
import { useAppContext } from "./context/AppContext.jsx";

const App = () => {
  const {
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
    theme,
    setTheme,
  } = useAppContext();
  const location = useLocation();

  const themeBackgrounds = {
    green: "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950",
    yellow: "bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950",
    blue: "bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950",
    red: "bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950",
  };

  const themeBorders = {
    green: "border-emerald-500/20",
    yellow: "border-amber-500/20",
    blue: "border-sky-500/20",
    red: "border-rose-500/20",
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setMobileOpen]);

  useEffect(() => {
    if (mobileOpen && window.innerWidth <= 768) {
      setMobileOpen(false);
    }
  }, [location.pathname, mobileOpen, setMobileOpen]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((s) => !s);
  };

  return (
    <div
      className={`min-h-screen text-slate-100 ${themeBackgrounds[theme] || themeBackgrounds.green}`}
    >
      <Header
        onToggleSidebar={toggle}
        isSidebarCollapsed={collapsed}
        isMobileOpen={mobileOpen}
        theme={theme}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6 relative">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          theme={theme}
          setTheme={setTheme}
          onClose={() => setMobileOpen(false)}
        />
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="flex-1 relative z-10">
          <div
            className={`rounded-2xl bg-slate-800/40 border ${themeBorders[theme] || themeBorders.green} p-6 min-h-[60vh]`}
          >
            <Routes>
              <Route path="/" element={<LobbyPage theme={theme} />} />
              <Route path="/lobby" element={<LobbyPage theme={theme} />} />
              <Route path="/tournament" element={<TournamentPage />} />
              <Route path="/promotions" element={<PromotionPage />} />
              <Route path="/promo-codes" element={<PromoCodePage />} />
              <Route path="/prediction" element={<PredictionPoolPage />} />
              <Route path="/prediction/open" element={<OpenPredictionPage />} />
              <Route path="/referral" element={<ReferralPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/wallet" element={<MyWalletPage />} />
              <Route path="/vip" element={<VIPRewardPage />} />
              <Route path="/cashback" element={<CashbackPage />} />
              <Route path="/happy-hour" element={<HappyHour />} />
              <Route path="/free-cash-rain" element={<FreeCashRain />} />
              <Route path="/appearance" element={<AppearancePage />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/bingopage" element={<BingoPage />} />
              <Route path="/ludo" element={<LudoPage />} />
              <Route path="/spin" element={<SpinPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
