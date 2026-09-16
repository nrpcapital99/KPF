import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The Firebase SDK is the bulk of the bundle and it changes far less often
    // than our own code. Splitting it into its own chunk means a deploy of the
    // app doesn't force returning visitors to re-download Firestore and Auth.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("firebase") || id.includes("@firebase")) {
            return "vendor-firebase";
          }
          if (
            id.includes("react-router") ||
            id.includes("/react-dom/") ||
            id.includes("/react/")
          ) {
            return "vendor-react";
          }
        },
      },
    },
    // Our own entry chunk should stay well under this; the warning is only
    // useful if it fires for app code rather than the known vendor split.
    chunkSizeWarningLimit: 700,
  },
});
