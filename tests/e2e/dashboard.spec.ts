import { test, expect } from "@playwright/test";

test("dashboard shows AnswerFlow branding and seeded project", async ({ page }) => {
  await page.goto("/");

  // App shell branding must be visible
  await expect(page.getByRole("link", { name: /AnswerFlow AI home/i })).toBeVisible();

  // Seeded project name must appear in the project list
  await expect(page.getByText("Acme Corp Security Questionnaire")).toBeVisible();
});
