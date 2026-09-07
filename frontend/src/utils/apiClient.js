import { getAuthStorageKey } from "./telegramStorage";

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = rawApiUrl
  ? rawApiUrl.replace(/\/+$|\s+/g, "")
  : "http://localhost:5000";

const defaultHeaders = {
  "Content-Type": "application/json",
};

const getAuthToken = (path) => {
  const isAdminRequest =
    path.startsWith("/api/admin") || path.startsWith("/api/users/admin");

  return isAdminRequest
    ? localStorage.getItem("adminToken")
    : localStorage.getItem(getAuthStorageKey("authToken"));
};

const clearInvalidSession = (path) => {
  if (path.startsWith("/api/admin") || path.startsWith("/api/users/admin")) {
    localStorage.removeItem("adminToken");
    return;
  }

  localStorage.removeItem(getAuthStorageKey("authToken"));
  localStorage.removeItem(getAuthStorageKey("authUser"));
};

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const request = async (path, options = {}) => {
  const token = getAuthToken(path);
  const response = await fetch(buildUrl(path), {
    headers: {
      ...defaultHeaders,
      Authorization: token ? `Bearer ${token}` : undefined,
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearInvalidSession(path);
    }

    const error = data?.message || response.statusText;
    throw new Error(error || "API request failed");
  }

  return data;
};

export const get = (path, options) =>
  request(path, { method: "GET", ...options });
export const post = (path, body, options) =>
  request(path, { method: "POST", body: JSON.stringify(body), ...options });
export const patch = (path, body, options) =>
  request(path, { method: "PATCH", body: JSON.stringify(body), ...options });
export const del = (path, options) =>
  request(path, { method: "DELETE", ...options });

export default {
  get,
  post,
  patch,
  del,
  API_BASE_URL,
};
