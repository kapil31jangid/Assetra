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
  },
});
