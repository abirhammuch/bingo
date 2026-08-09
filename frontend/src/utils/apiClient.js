const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const defaultHeaders = {
  "Content-Type": "application/json",
};

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const request = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), {
    headers: {
      ...defaultHeaders,
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
