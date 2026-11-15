import { defineConfig } from "@playwright/test";

/** 画面を実際に操作して確かめるテスト。ビルドしたものを配信して動かす。 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4174",
    trace: "off",
    viewport: { width: 1360, height: 1000 },
  },
  webServer: {
    command: "npm run build && npx vite preview --port 4174 --strictPort",
    url: "http://localhost:4174",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
