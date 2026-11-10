import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base を相対にして GitHub Pages などサブパス配下でも動くようにする
export default defineConfig({
  base: "./",
  plugins: [react()],
});
