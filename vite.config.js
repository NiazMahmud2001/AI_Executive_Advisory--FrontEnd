import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the UI runs on :5173 and forwards /api to FastAPI on :8000, so the browser sees one origin:
// the session cookie stays SameSite=Strict and no CORS is needed. In production FastAPI serves the built files.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "https://ai-executive-advisory-backend-1.onrender.com" },
  },
});
