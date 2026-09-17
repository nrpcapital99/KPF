import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The team page lazily loads Auth + full Firestore as one chunk. That's
    // expected and only the team downloads it, so don't warn about it.
    chunkSizeWarningLimit: 900,
  },
});
