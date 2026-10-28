import { foldkit } from "@foldkit/vite-plugin";
import stylex from "@stylexjs/unplugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    stylex.vite({
      useCSSLayers: true,
    }),
    foldkit(),
  ],
  optimizeDeps: {
    entries: ["src/entry.ts"],
  },
});
