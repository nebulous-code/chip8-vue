import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

/**
 * This config defines how Vite builds and serves the Vue application.
 */
export default defineConfig({
  plugins: [vue()],
  // This keeps the file-based WASM package working through symlinks.
  resolve: {
    preserveSymlinks: true,
  },
  // This avoids pre-bundling the WASM package so it can load correctly.
  optimizeDeps: {
    exclude: ["chip8wasm"],
  },
  // This allows the dev server to read the generated WASM package path.
  server: {
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, "../chip8/chip8wasm/pkg"),
      ],
    },
  },
});
