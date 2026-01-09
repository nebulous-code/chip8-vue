import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

/**
 * This config defines how Vite builds and serves the Vue application.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: {
    exclude: ["chip8wasm"],
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, "../chip8/chip8wasm/pkg"),
      ],
    },
  },
});
