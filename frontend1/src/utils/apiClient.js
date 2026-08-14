const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = rawApiUrl
  ? rawApiUrl.replace(/\/+$|\s+/g, "")
  : "http://localhost:5000";

const defaultHeaders = {
  "Content-Type": "application/json",
};

const getAuthToken = () => localStorage.getItem("authToken");

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const request = async (path, options = {}) => {
  const token = getAuthToken();
  const response = await fetch(buildUrl(path), {
    headers: {
      ...defaultHeaders,
      Authorization: token ? `Bearer ${token}` : undefined,
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
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
