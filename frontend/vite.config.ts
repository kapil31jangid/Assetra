import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["echarts", "echarts-for-react"],
          forms: ["@hookform/resolvers", "react-hook-form", "zod"],
          mui: ["@emotion/react", "@emotion/styled", "@mui/icons-material", "@mui/material"],
          react: ["@tanstack/react-query", "react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/session": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    }
  },
});
