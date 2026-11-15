import { expect, test } from "@playwright/test";
import { board, boardCard, collect } from "./helpers";

test("問題を単元・型・ことば・進み具合でしぼりこめる", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("単元でしぼる").selectOption("数学Ⅱ 式と証明");
  await expect(page.locator(".problem-item")).toHaveCount(1);
  await page.getByText("しぼりこみをやめる").click();
  await expect(page.locator(".problem-item")).toHaveCount(11);
  await page.getByLabel("ことばでさがす").fill("接する");
  await expect(page.locator(".problem-item")).toHaveCount(1);
  await page.getByLabel("ことばでさがす").fill("");
  await page.getByLabel("型でしぼる").selectOption({ index: 1 });
  expect(await page.locator(".problem-item").count()).toBeLessThan(11);
  await page.getByLabel("進み具合でしぼる").selectOption("doing");
  await expect(page.locator(".problem-item")).toHaveCount(0);
  // 「配置を確かめる」を使わない設定では、「骨組み完成」は選べない
  await expect(page.getByLabel("進み具合でしぼる").locator("option")).toHaveCount(3);
});

test("設定で、文字を大きくでき、くっつけられる相手を光らせられる", async ({ page }) => {
  await page.goto("/#/settings");
  const size = () => page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  const before = await size();
  await page.locator("select").selectOption("1.5");
  expect(await size()).toBeCloseTo(before * 1.5, 1);
  await page.reload();
  expect(await size()).toBeCloseTo(before * 1.5, 1);
  await page.locator("select").selectOption("1");
  await page.getByText("くっつけられる相手を光らせる").click();

  await page.goto("/#/p/quadratic-min");
  await collect(page, "f1", "a1");
  await collect(page, "f2", "a4");
  await collect(page, "f3", "a5");
  const from = (await boardCard(page, "a1").boundingBox())!;
  await page.mouse.move(from.x + 12, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 40, from.y + from.height / 2 + 30, { steps: 5 });
  await expect(board(page).locator(".thought.is-partner")).toHaveCount(1);
  await expect(board(page).locator('[data-thought="a4"]')).toHaveClass(/is-partner/);
  await page.mouse.up();
});

test("学習の記録を消すと、ボードと連想ノートが最初に戻る", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");
  await collect(page, "f1", "a1");
  await page.goto("/#/settings");
  page.on("dialog", (d) => void d.accept());
  await page.getByText("学習の記録を消す").click();
  await expect(page.locator(".message")).toContainText("消しました");
  await page.goto("/#/note");
  await expect(page.locator(".pattern")).toHaveCount(0);
  await page.goto("/#/p/quadratic-min");
  await expect(board(page).locator(".thought")).toHaveCount(0);
});

test("問題を開いていた時間が、学習時間として一覧に出る", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#/p/quadratic-min");
  await page.locator(".problem-text .fragment").first().click();
  await page.clock.runFor(5 * 60 * 1000);
  await page.goto("/#/");
  await expect(page.locator(".study-time")).toContainText("今日 5分");
  await expect(page.locator(".study-time")).toContainText("合計 5分");
});
