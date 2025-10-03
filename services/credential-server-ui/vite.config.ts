import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: "**/*.tsx",
    }),
    nodePolyfills(),
  ],
  server: {
    host: true,
    port: 3002,
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    exclude: ["vite-plugin-node-polyfills"],
  },
});
