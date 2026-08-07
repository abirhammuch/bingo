import React, { createContext, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState("green");
  const [currency, setCurrency] = useState("ETB");

  const navigateTo = (path, options) => {
    if (typeof path === "string") {
      navigate(path, options);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "";
    return `${currency} ${amount}`;
  };

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      mobileOpen,
      setMobileOpen,
      theme,
      setTheme,
      currency,
      setCurrency,
      navigateTo,
      goBack: () => navigate(-1),
      goForward: () => navigate(1),
      formatCurrency,
    }),
    [collapsed, mobileOpen, theme, currency, navigate],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
