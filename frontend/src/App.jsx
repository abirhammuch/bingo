import React, { useEffect } from "react";
import {
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
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
import CBEWithdrawPage from "./pages/footerPage/CBEWithdrawPage";
import SettingPage from "./pages/footerPage/SettingPage";
import AdminLayout from "./pages/admin/adminlayout.jsx";
import UserPage from "./pages/admin/UserPage.jsx";
import TransactionPage from "./pages/admin/TransactionPage.jsx";
import AdminWithdrawPage from "./pages/admin/WithdrawPage.jsx";
import AdminDepositPage from "./pages/admin/DepositePage.jsx";
import BonusPage from "./pages/admin/BonusPage.jsx";
import StakePage from "./pages/admin/StakePage.jsx";
import { useAppContext } from "./context/AppContext.jsx";
import Footer from "./components/footer/Footer";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";
import Coupon from "./pages/footerPage/Coupon.jsx";
import CBEDepositePage from "./pages/footerPage/CBEDepositePage.jsx";
import TelegramBroadcastPage from "./pages/admin/TelegramBroadcastPage.jsx";
import AdminPasswordPage from "./pages/admin/AdminPasswordPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import TournamentInvite from "./components/tournaments/Invite.jsx";
import { getAuthStorageKey } from "./utils/telegramStorage";
import { useAuth } from "./context/AuthContext.jsx";

const hasValidAdminSession = () => {
  const token = localStorage.getItem("adminToken");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload.isAdmin === true &&
      (!payload.exp || payload.exp * 1000 > Date.now())
    );
  } catch {
    return false;
  }
};

const AdminRouteGuard = ({ children }) => {
  const location = useLocation();

  if (!hasValidAdminSession()) {
    localStorage.removeItem("adminToken");
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  return children;
};

const ReferralRedirect = () => {
  const { referralCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (referralCode) {
      localStorage.setItem(
        "pendingReferralCode",
        referralCode.replace(/^ref_/i, ""),
      );
    }
    navigate(
      localStorage.getItem(getAuthStorageKey("authToken"))
        ? "/bingopage"
        : "/login",
      {
        replace: true,
      },
    );
  }, [navigate, referralCode]);

  return null;
};

const BlockedAccountPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
    <div>
      <div className="mb-4 text-5xl">🚫</div>
      <h1 className="text-2xl font-bold">Cheating is bad!</h1>
      <p className="mt-2 text-slate-400">
        Your account has been blocked and these pages are unavailable.
      </p>
    </div>
  </div>
);

const App = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const isAuthPage = ["/login", "/logout"].includes(location.pathname);
  const isLivePage = location.pathname === "/bingopage";
  const { theme } = useAppContext();
  const { user: authUser } = useAuth();

  const themeBackgrounds = {
    green: "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950",
    yellow: "bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950",
    blue: "bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950",
    red: "bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950",
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  if (authUser?.isBlocked && !isAdminPath && !isAuthPage) {
    return <BlockedAccountPage />;
  }

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
          <Route
            path="/admin"
            element={
              <AdminRouteGuard>
                <AdminLayout />
              </AdminRouteGuard>
            }
          >
            <Route index element={<UserPage />} />
            <Route path="users" element={<UserPage />} />
            <Route
              path="telegram-broadcast"
              element={<TelegramBroadcastPage />}
            />
            <Route path="password" element={<AdminPasswordPage />} />
            <Route path="admins" element={<AdminUsersPage />} />
            <Route path="transactions" element={<TransactionPage />} />
            <Route path="bonus" element={<BonusPage section="all" />} />
            <Route
              path="referral-bonus"
              element={<BonusPage section="referral" />}
            />
            <Route
              path="tournament"
              element={<BonusPage section="tournament" />}
            />
            <Route path="coupons" element={<BonusPage section="coupons" />} />
            <Route path="stake" element={<StakePage />} />
            <Route
              path="registration-bonus"
              element={<BonusPage section="registration" />}
            />
            <Route
              path="game-commission"
              element={<BonusPage section="commission" />}
            />
            <Route
              path="withdraw-fee"
              element={<BonusPage section="withdrawFee" />}
            />
            <Route path="deposit" element={<AdminDepositPage />} />
            <Route path="withdraw" element={<AdminWithdrawPage />} />
          </Route>
        </Routes>
      ) : (
        <>
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<LobbyPage theme={theme} />} />
              <Route path="/lobby" element={<LobbyPage theme={theme} />} />
              <Route path="/ref/:referralCode" element={<ReferralRedirect />} />
              <Route path="/bingopage" element={<LobbyPage theme={theme} />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/referral" element={<Invite />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/deposit" element={<DepositePage />} />
              <Route path="/cbe-deposit" element={<CBEDepositePage />} />
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
              <Route path="/cbe-withdraw" element={<CBEWithdrawPage />} />
              <Route path="/appearance" element={<SettingPage />} />
              <Route path="/coupon" element={<Coupon />} />
              <Route path="/tournament/invite" element={<TournamentInvite />} />
            </Routes>
          </main>
          {!isLivePage && <Footer />}
        </>
      )}
    </div>
  );
};

export default App;
