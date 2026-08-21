import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  telegramLogin as apiTelegramLogin,
  telegramWebAppLogin as apiTelegramWebAppLogin,
} from "../services/userService";

import { authenticateTelegram } from "../socket/socket";

const AuthContext = createContext(null);
const currency = "ETB";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("authUser");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("authUser");
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("authToken"));

  const [loading, setLoading] = useState(false);

  /*
   * Keep localStorage and React state synchronized.
   */
  useEffect(() => {
    if (!token) {
      return;
    }

    const storedUser = localStorage.getItem("authUser");

    if (!storedUser) {
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("Failed to restore user:", error);

      localStorage.removeItem("authUser");

      setUser(null);
    }
  }, [token]);

  /*
   * Normal Telegram login.
   */
  const login = async (payload) => {
    setLoading(true);

    try {
      const data = await apiTelegramLogin(payload);

      if (!data?.token) {
        throw new Error("Login response does not contain a token");
      }

      if (!data?.user) {
        throw new Error("Login response does not contain a user");
      }

      localStorage.setItem("authToken", data.token);

      localStorage.setItem("authUser", JSON.stringify(data.user));

      setToken(data.token);

      setUser(data.user);

      return data;
    } finally {
      setLoading(false);
    }
  };

  /*
   * Telegram WebApp login.
   */
  const loginWithTelegramInitData = async ({ initData, referralCode }) => {
    setLoading(true);

    try {
      if (!initData) {
        throw new Error("Telegram initData is missing");
      }

      const data = await apiTelegramWebAppLogin({
        initData,
        referralCode,
      });

      if (!data?.token) {
        throw new Error("Telegram login response does not contain a token");
      }

      if (!data?.user) {
        throw new Error("Telegram login response does not contain a user");
      }

      console.log("✅ AuthContext: user authenticated", data.user);

      localStorage.setItem("authToken", data.token);

      localStorage.setItem("authUser", JSON.stringify(data.user));

      setToken(data.token);

      setUser(data.user);

      // ========================================================
      // AUTHENTICATE SOCKET FOR TELEGRAM
      // ========================================================

      authenticateTelegram(initData);

      return data;
    } finally {
      setLoading(false);
    }
  };

  /*
   * Logout.
   */
  const logout = () => {
    localStorage.removeItem("authToken");

    localStorage.removeItem("authUser");

    setToken(null);

    setUser(null);

    navigate("/", {
      replace: true,
    });
  };

  const updateUserBalance = (balance) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const updatedUser = { ...currentUser, balance };
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      loginWithTelegramInitData,
      updateUserBalance,
      currency,
      logout,
      loading,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
