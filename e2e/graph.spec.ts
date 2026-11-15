import { expect, test } from "@playwright/test";
import { board, boardCard, collect, drag } from "./helpers";

test("考えに付いたグラフが出て、スライダーで動かしてもカードは動かない", async ({ page }) => {
  await page.goto("/#/p/quadratic-min");
  await collect(page, 0, "平方完成");
  await collect(page, 1, "文字");
  await drag(page, boardCard(page, "平方完成"), boardCard(page, "文字"));
  const graph = board(page).locator(".graph");
  await expect(graph.locator("svg")).toBeVisible();
  await expect(graph.locator(".graph-slider span")).toHaveText("a = 1");

  const before = await graph.locator("path.graph-curve").last().getAttribute("d");
  const slider = graph.locator("input[type=range]");
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(graph.locator(".graph-slider span")).not.toHaveText("a = 1");
  expect(await graph.locator("path.graph-curve").last().getAttribute("d")).not.toBe(before);
  await expect(board(page).locator(".card")).toHaveCount(1);
  await expect(page.locator(".slot .card")).toHaveCount(0);
});

test("作る画面でグラフを付けると、すぐ下に見え方が出て、式の誤りは知らせる", async ({ page }) => {
  await page.goto("/#/edit");
  await page.locator(".toolbar select").selectOption({ label: "2次不等式を解く" });
  const block = page.locator(".step-panel").nth(2).locator(".block").first();
  await block.getByText("＋ グラフを付ける").click();
  await expect(block.locator(".graph svg")).toBeVisible();
  const expr = block.locator(".graph-editor input[type=text]").first();
  await expr.fill("x^2-2ax+3");
  await expect(block.locator(".graph-error")).toContainText("文字「a」");
  await expect(page.locator(".editor-bar")).toContainText("あと 1 か所");
  await block.getByText("スライダーで動かせるようにする").click();
  await expect(block.locator(".graph-slider")).toBeVisible();
  await expect(page.locator(".editor-bar")).toContainText("この問題は試せます");
  await expr.fill("x^2-(");
  await expect(block.locator(".graph-error")).toBeVisible();
});
