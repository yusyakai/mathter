import { expect, test } from "@playwright/test";
import { board, boardCard, collect } from "./helpers";

test("問題を単元・型・ことばでしぼりこめる", async ({ page }) => {
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
  await page.getByLabel("進み具合でしぼる").selectOption("done");
  await expect(page.locator(".problem-item")).toHaveCount(0);
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
  await collect(page, 0, "平方完成");
  await collect(page, 1, "文字");
  await collect(page, 2, "定義域に制限");
  const from = (await boardCard(page, "平方完成").boundingBox())!;
  await page.mouse.move(from.x + 30, from.y + 12);
  await page.mouse.down();
  await page.mouse.move(from.x + 60, from.y + 40, { steps: 5 });
  await expect(board(page).locator(".card.is-partner")).toHaveCount(1);
  await expect(board(page).locator(".card.is-partner")).toContainText("文字");
  await page.mouse.up();
});

test("学習の記録を消すと、ボードと連想ノートが最初に戻る", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");
  await collect(page, 0, "平方完成");
  await page.goto("/#/settings");
  page.on("dialog", (d) => void d.accept());
  await page.getByText("学習の記録を消す").click();
  await expect(page.locator(".message")).toContainText("消しました");
  await page.goto("/#/note");
  await expect(page.locator(".pattern")).toHaveCount(0);
  await page.goto("/#/p/quadratic-min");
  await expect(board(page).locator(".card")).toHaveCount(0);
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
