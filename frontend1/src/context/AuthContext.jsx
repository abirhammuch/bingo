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
import { getAuthStorageKey } from "../utils/telegramStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem(getAuthStorageKey("authToken")),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem(getAuthStorageKey("authUser"));
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      }
    } else {
      setUser(null);
      localStorage.removeItem(getAuthStorageKey("authUser"));
    }
  }, [token]);

  const login = async (payload) => {
    setLoading(true);
    try {
      const data = await apiTelegramLogin(payload);
      if (!data?.token || !data?.user) {
        throw new Error("Invalid login response");
      }
      localStorage.setItem(getAuthStorageKey("authToken"), data.token);
      localStorage.setItem(
        getAuthStorageKey("authUser"),
        JSON.stringify(data.user),
      );
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const loginWithTelegramInitData = async (payload) => {
    setLoading(true);
    try {
      const data = await apiTelegramWebAppLogin(payload);
      if (!data?.token || !data?.user) {
        throw new Error("Invalid login response");
      }
      localStorage.setItem(getAuthStorageKey("authToken"), data.token);
      localStorage.setItem(
        getAuthStorageKey("authUser"),
        JSON.stringify(data.user),
      );
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(getAuthStorageKey("authToken"));
    localStorage.removeItem(getAuthStorageKey("authUser"));
    setToken(null);
    setUser(null);
    navigate("/");
  };

  const value = useMemo(
    () => ({ user, token, login, loginWithTelegramInitData, logout, loading }),
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
