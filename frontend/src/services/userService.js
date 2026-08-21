import api from "../utils/apiClient";

export const getUserProfile = (telegramId) =>
  api.get(`/api/users/profile/${encodeURIComponent(telegramId)}`);

export const getUserBalance = (telegramId) =>
  api.get(`/api/users/balance/${encodeURIComponent(telegramId)}`);

export const getUserStats = (telegramId) =>
  api.get(`/api/users/stats/${encodeURIComponent(telegramId)}`);

export const telegramLogin = (payload) =>
  api.post(`/api/users/telegram-login`, payload);
export const telegramLoginWithCode = (payload) =>
  api.post(`/api/users/telegram-login-code`, payload);
export const telegramWebAppLogin = (payload) =>
  api.post(`/api/users/telegram-webapp-login`, payload);

export const adminAddCoins = (payload) =>
  api.post(`/api/users/admin/add-coins`, payload);

export const adminDeductCoins = (payload) =>
  api.post(`/api/users/admin/deduct-coins`, payload);

export const adminSetBalance = (payload) =>
  api.patch(`/api/users/admin/balance`, payload);

export const fetchUsers = (query = {}) => {
  const params = new URLSearchParams(query).toString();
  return api.get(`/api/users/admin/users${params ? `?${params}` : ""}`);
};

export const toggleUserBlock = (telegramId) =>
  api.patch(`/api/users/admin/block/${encodeURIComponent(telegramId)}`);

export const toggleUserActive = (telegramId) =>
  api.patch(`/api/users/admin/active/${encodeURIComponent(telegramId)}`);

export const fetchAdminCoupons = () => api.get("/api/admin/coupons");

export const createAdminCoupon = (payload) =>
  api.post("/api/admin/coupons", payload);

export const updateAdminCoupon = (id, payload) =>
  api.patch(`/api/admin/coupons/${id}`, payload);

export const toggleAdminCoupon = (id) =>
  api.patch(`/api/admin/coupons/${id}/toggle`);
