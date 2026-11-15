import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/**
 * 通信なしでも使えるように、ビルドの最後に dist/sw.js（サービスワーカー）を作る。
 * アプリの本体（HTML・JS・CSS・数式のフォント）を端末に保存しておき、
 * 通信があるときは新しい版を取りに行く。
 */
function offline(): Plugin {
  return {
    name: "mathter-offline",
    apply: "build",
    closeBundle() {
      const dist = "dist";
      const walk = (dir: string): string[] =>
        readdirSync(dir).flatMap((name) => {
          const path = join(dir, name);
          return statSync(path).isDirectory() ? walk(path) : [path];
        });
      // 数式のフォントは woff2 だけで足りる（ほかの形式は古いブラウザ用）
      const files = walk(dist)
        .map((path) => relative(dist, path).split("\\").join("/"))
        .filter((f) => f !== "sw.js" && !/\.(ttf|woff)$/.test(f));
      const hash = createHash("sha256");
      for (const f of files) hash.update(f).update(readFileSync(join(dist, f)));
      const version = hash.digest("hex").slice(0, 12);
      const urls = ["./", ...files.map((f) => `./${f}`)];
      writeFileSync(
        join(dist, "sw.js"),
        `const CACHE = "mathter-${version}";
const FILES = ${JSON.stringify(urls)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith("mathter-") && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    // ページそのものは、通信があれば新しいものを使い、なければ保存してあるものを使う
    event.respondWith(fetch(request).catch(() => caches.match("./index.html", { ignoreVary: true })));
    return;
  }
  event.respondWith(
    caches.match(request, { ignoreSearch: true, ignoreVary: true }).then((hit) => hit || fetch(request)),
  );
});
`,
      );
    },
  };
}

// base を相対にして GitHub Pages などサブパス配下でも動くようにする
export default defineConfig({
  base: "./",
  plugins: [react(), offline()],
  test: { include: ["src/**/*.test.ts"] },
});
