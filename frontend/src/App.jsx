import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import LobbyPage from "./pages/LobbyPage";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import HistoryPage from "./pages/footerPage/HistoryPage";
import ProfilePage from "./pages/footerPage/ProfilePage";
import Invite from "./pages/footerPage/Invite";
import WalletPage from "./pages/footerPage/WalletPage";
import DepositePage from "./pages/footerPage/DepositePage";
import TelebirrDepositePage from "./pages/footerPage/TelebirrDepositePage";
import WithdrawPage from "./pages/footerPage/WithdrawPage";
import TeleBirrWithdrawPage from "./pages/footerPage/TeleBirrWithdrawPage";
import SettingPage from "./pages/footerPage/SettingPage";
import AdminLayout from "./pages/admin/adminlayout.jsx";
import UserPage from "./pages/admin/UserPage.jsx";
import TransactionPage from "./pages/admin/TransactionPage.jsx";
import AdminWithdrawPage from "./pages/admin/WithdrawPage.jsx";
import { useAppContext } from "./context/AppContext.jsx";
import Footer from "./components/footer/Footer";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";

const App = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const isAuthPage = ["/login", "/logout"].includes(location.pathname);
  const isLivePage = location.pathname === "/bingopage";
  const { theme } = useAppContext();

  const themeBackgrounds = {
    green: "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950",
    yellow: "bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950",
    blue: "bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950",
    red: "bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950",
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div
      className={`min-h-screen text-slate-100 ${themeBackgrounds[theme] || themeBackgrounds.green}`}
    >
      {isAuthPage ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
        </Routes>
      ) : isAdminPath ? (
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<UserPage />} />
            <Route path="users" element={<UserPage />} />
            <Route path="transactions" element={<TransactionPage />} />
            <Route path="withdraw" element={<AdminWithdrawPage />} />
          </Route>
        </Routes>
      ) : (
        <>
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<LobbyPage theme={theme} />} />
              <Route path="/lobby" element={<LobbyPage theme={theme} />} />
              <Route path="/bingopage" element={<LobbyPage theme={theme} />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/referral" element={<Invite />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/deposit" element={<DepositePage />} />
              <Route path="/settings" element={<SettingPage />} />
              <Route
                path="/telebirr-deposit"
                element={<TelebirrDepositePage />}
              />
              <Route path="/withdraw" element={<WithdrawPage />} />
              <Route
                path="/telebirr-withdraw"
                element={<TeleBirrWithdrawPage />}
              />
              <Route path="/appearance" element={<SettingPage />} />
            </Routes>
          </main>
          {!isLivePage && <Footer />}
        </>
      )}
    </div>
  );
};

export default App;
