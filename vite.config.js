import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Force all output into a single file
        manualChunks: undefined,
        entryFileNames: "bundle.js", // Single entry file
      },
    },
  },
});
