import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    middlewares: [
      (req, res, next) => {
        // SPA fallback: serve index.html for routes that don't have file extensions
        if (
          req.method === "GET" &&
          !req.url.includes(".") &&
          !req.url.startsWith("/api")
        ) {
          req.url = "/";
        }
        next();
      },
    ],
  },
});
