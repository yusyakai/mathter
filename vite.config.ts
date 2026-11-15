import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// base を相対にして GitHub Pages などサブパス配下でも動くようにする
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: { include: ["src/**/*.test.ts"] },
});
