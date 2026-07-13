import { expect, test } from "@playwright/test";

test("演示模式可进入面试且没有浏览器错误", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "定制本场练习" })).toBeVisible();
  await page.getByRole("button", { name: "开始模拟面试" }).click({ force: true });
  await expect(page.getByAltText("面试官林知远")).toBeVisible();
  await expect(page.getByText("当前问题")).toBeVisible();
  await expect(page.getByText("完成进度").locator("..").getByText("0 / 5")).toBeVisible();
  await expect(page.locator(".transcript-list article.assistant").first()).toContainText(/自我介绍|介绍.*自己/);
  expect(errors).toEqual([]);
});

test("本地语音模式可连接网关并接收首条语音问题", async ({ browser }) => {
  const context = await browser.newContext();
  await context.grantPermissions(["microphone"], { origin: "http://127.0.0.1:5173" });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await page.getByRole("button", { name: "测试连通性" }).click();
  await expect(page.getByText("连接成功，可使用该模型。")).toBeVisible();
  await page.getByRole("button", { name: "本地语音模式" }).click();
  await page.getByRole("button", { name: "开始模拟面试" }).click();
  await expect(page.getByAltText("面试官林知远")).toBeVisible();
  await expect(page.getByText(/自我介绍|介绍.*自己/).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("完成进度").locator("..").getByText("0 / 5")).toBeVisible();
  await expect(page.locator(".transcript-list article.assistant").first()).toContainText(/自我介绍|介绍.*自己/);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/live-mode.png", fullPage: true });
  await context.close();
});
