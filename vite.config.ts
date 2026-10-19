import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, ".", "").VITE_BASE_PATH || "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/tone/")) return "audio";
          if (id.includes("/node_modules/@tonejs/midi/")) return "midi";
        },
      },
    },
  },
}));
