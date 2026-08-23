import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const sheetCsvPath = "/spreadsheets/d/1NnxwN4CLQGogszMpOHnaMlK2ePeUQu0PRl8DBJE5-bU/export?format=csv";

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
