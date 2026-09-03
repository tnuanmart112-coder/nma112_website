import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const sheetCsvPath = "/spreadsheets/d/1MxKJMaBHAe4d2xEc_IcCQQGDNk8nhfRIyQXUV7zFqaw/export?format=csv";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/sheet.csv": {
        target: "https://docs.google.com",
        changeOrigin: true,
        rewrite: () => sheetCsvPath,
      },
    },
  },
});
