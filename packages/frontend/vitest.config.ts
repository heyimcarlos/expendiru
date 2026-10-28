import stylex from "@stylexjs/unplugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    stylex.vite({
      useCSSLayers: true,
    }),
  ],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "happy-dom",
          setupFiles: ["./src/vitest-setup.ts"],
        },
      },
    ],
  },
});
