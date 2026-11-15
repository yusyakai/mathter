import { expect, test } from "@playwright/test";

test("一度開けば、通信がなくても問題を開ける", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // 保存が終わり、このページを受け持つようになるまで待つ
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".problem-item")).toHaveCount(11);
  await page.getByText("文字を含む2次関数の最小値").click();
  await expect(page.locator(".problem-text .katex").first()).toBeVisible();
  const fontLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check("16px KaTeX_Main");
  });
  expect(fontLoaded).toBe(true);
});
