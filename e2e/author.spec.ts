import { expect, test, type Page } from "@playwright/test";
import { board, candidate, drag, fragment, turnOnJudge } from "./helpers";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TEXT = "不等式 $2x-3<5$ を満たす 自然数 $x$ をすべて求めよ。";

const step = (page: Page, n: number) => page.locator(".step-panel").nth(n - 1);

async function pick(page: Page, part: string, trim = 0): Promise<void> {
  const start = TEXT.indexOf(part) + trim;
  const end = TEXT.indexOf(part) + part.length - trim;
  await step(page, 2)
    .locator("textarea")
    .evaluate(
      (el, [s, e]) => {
        (el as HTMLTextAreaElement).focus();
        (el as HTMLTextAreaElement).setSelectionRange(s, e);
      },
      [start, end],
    );
  await page.getByText("選んだ部分を着眼点にする").click();
}

/** 1問を最初から作る。skeleton が false なら、模範の骨組みは作らない。 */
async function author(page: Page, skeleton = true): Promise<void> {
  await page.goto("/#/edit");
  await page.getByText("新しい問題を作る").click();
  await expect(page.locator(".editor-bar")).toContainText("あと");
  await page.getByPlaceholder("例：文字を含む2次関数の最小値").fill("1次不等式の整数解");
  await page.getByPlaceholder("例：数学Ⅰ 2次関数").fill("数学Ⅰ 数と式");
  await step(page, 2).locator("textarea").fill(TEXT);
  await pick(page, "$2x-3<5$", 2);
  await pick(page, "自然数");

  const s3 = step(page, 3);
  await s3.locator(".block").nth(0).getByText("＋ 連想を足す").click();
  await s3.locator(".block").nth(0).getByPlaceholder("例：平方完成", { exact: true }).fill("$x$ について解く");
  await s3.locator(".block").nth(1).getByText("＋ 連想を足す").click();
  await s3.locator(".block").nth(1).getByPlaceholder("例：平方完成", { exact: true }).fill("正の整数");

  const s4 = step(page, 4);
  await s4.getByText("＋ 組み合わせを足す").click();
  await s4.locator("select").nth(0).selectOption({ index: 1 });
  await s4.locator("select").nth(1).selectOption({ index: 2 });
  await s4.getByPlaceholder(/が動く/).fill("範囲の中の自然数");

  if (skeleton) {
    const s5 = step(page, 5);
    await s5.getByText("＋ 段を足す").click();
    await s5.locator("select").nth(0).selectOption({ label: "範囲の中の自然数" });
  }

  const s6 = step(page, 6);
  await s6.getByText("＋ 行を足す").click();
  await s6.locator("textarea").nth(0).fill("$2x-3<5$ より $x<4$");
  await s6.locator(".chips").nth(0).locator("button").nth(0).click();
  await s6.getByText("＋ 行を足す").click();
  await s6.locator("textarea").nth(1).fill("$x$ は自然数であるから $x=1,\\ 2,\\ 3$");
  await expect(page.locator(".editor-bar")).toContainText("この問題は試せます");
}

test("問題を最初から作って、学習画面で試せる", async ({ page }) => {
  await author(page);
  await page.locator(".editor-bar a.primary").click();
  await expect(page.locator(".crumb")).toContainText("1次不等式の整数解");
  await expect(page.locator(".problem-text .fragment")).toHaveCount(2);
  await fragment(page, "f1").click();
  await expect(candidate(page, "a1")).toContainText("について解く");
  await page.goto("/#/");
  await expect(page.locator(".problem-item").first()).toContainText("自作");
});

test("着眼点は数式全体に広がり、重なると作れず、問題文を直しても付いてくる", async ({ page }) => {
  await page.goto("/#/edit");
  await page.getByText("新しい問題を作る").click();
  await step(page, 2).locator("textarea").fill(TEXT);
  await pick(page, "$2x-3<5$", 2);
  await pick(page, "自然数");
  await pick(page, "自然数");
  await expect(step(page, 2).locator(".message")).toContainText("重なっています");
  await step(page, 2).locator("textarea").fill(`次の${TEXT}`);
  await expect(page.locator(".editor-preview .fragment")).toHaveCount(2);
  await expect(page.locator(".editor-preview .fragment").nth(1)).toContainText("自然数");
  // 並べかえると、見る順番が変わる
  await step(page, 3).locator(".block").nth(1).getByLabel("上へ").click();
  await expect(step(page, 3).locator(".block-title").first()).toContainText("自然数");
});

test("骨組みに同時に置けない考えを選ぶと、注意が出る", async ({ page }) => {
  await author(page);
  const s5 = step(page, 5);
  await s5.getByText("＋ 段を足す").click();
  await s5.locator(".block").nth(1).locator("select").nth(0).selectOption({ index: 1 });
  await expect(s5.locator(".issues")).toContainText("両方を骨組みに置けません");
  await expect(page.locator(".editor-bar")).toContainText("あと");
});

test("模範の骨組みがなくても試せる。その問題では「配置を確かめる」は出ない", async ({ page }) => {
  await turnOnJudge(page);
  await author(page, false);
  await expect(step(page, 5).locator(".issues")).toContainText("なくても試せます");
  await page.locator(".editor-bar a.primary").click();
  await fragment(page, "f1").click();
  await drag(page, candidate(page, "a1").locator(".card-head"), page.locator(".answer-new"));
  await expect(page.locator(".answer-row")).toHaveCount(1);
  await expect(page.getByText("配置を確かめる")).toHaveCount(0);
});

test("長い連想には、直さなくてもよい注意が出る", async ({ page }) => {
  await author(page);
  const s3 = step(page, 3);
  await s3
    .locator(".block")
    .nth(0)
    .getByPlaceholder("例：平方完成", { exact: true })
    .fill("不等式を見たら、まず文字について解いて、解の範囲を求めることを考える");
  await expect(s3.locator(".issues li.is-note")).toContainText("長めです");
  await expect(page.locator(".editor-bar")).toContainText("この問題は試せます");
});

test("新しい型を作ると、連想ノートに貯まる", async ({ page }) => {
  await author(page);
  const block = step(page, 3).locator(".block").nth(1);
  await block.locator("select").selectOption("__new");
  await block.getByPlaceholder("例：「接する」").fill("「自然数」");
  await block.getByText("この型を作る").click();
  await expect(block.locator("select")).not.toHaveValue("");

  await page.locator(".editor-bar a.primary").click();
  await fragment(page, "f2").click();
  await drag(page, candidate(page, "a2").locator(".card-head"), board(page).locator("h2"));
  await page.getByRole("link", { name: "連想ノート" }).click();
  await expect(page.locator(".pattern", { hasText: "「自然数」" })).toHaveCount(1);
});

test("書き出したファイルを、別の端末で読み込める", async ({ page, browser }) => {
  await author(page);
  await page.goto("/#/edit");
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.getByText("すべて書き出す").click(),
  ]);
  // 日本語を含む場所に置くと、テストの道具がファイルを渡せないので、英数字だけの場所に置く
  const path = join(mkdtempSync(join(tmpdir(), "mathter-")), "backup.json");
  await file.saveAs(path);

  const other = await (await browser.newContext()).newPage();
  await other.goto("/#/edit");
  await other.locator("input[type=file]").setInputFiles(path);
  await expect(other.locator(".message")).toContainText("1 問を読み込みました");
  await expect(other.locator("li.problem-item")).toContainText("試せます");
});

test("AIの返事を貼ると、下書きとして読み込める", async ({ page }) => {
  await page.goto("/#/edit");
  await page.getByText("AIに下書きを作らせる").click();
  const panel = page.locator(".ai-panel");
  await panel.locator("textarea").nth(0).fill("$x^2=4$ を解け。");
  await expect(panel.locator(".prompt-view")).toHaveValue(/\$x\^2=4\$ を解け。/);
  const reply = `承知しました。
\`\`\`json
{
  "title": "2次方程式を解く", "unit": "数学Ⅰ 数と式", "text": "$x^2=4$ を解け。",
  "marks": ["$x^2=4$"],
  "associations": [{"key": "A1", "mark": "$x^2=4$", "pattern": null, "title": "2乗して $4$ → 平方根を考える", "detail": "$x=\\pm\\sqrt{4}$"}],
  "combinations": [],
  "skeleton": [["A1"]],
  "solution": [{"text": "$x=\\pm 2$", "marks": ["$x^2=4$"], "thoughts": ["A1"]}]
}
\`\`\``;
  await panel.locator("textarea").last().fill(reply);
  await panel.getByText("下書きとして読み込む").click();
  await expect(page.locator(".editor-bar")).toContainText("この問題は試せます");
  await expect(page.getByPlaceholder("例：文字を含む2次関数の最小値")).toHaveValue("2次方程式を解く");
});
