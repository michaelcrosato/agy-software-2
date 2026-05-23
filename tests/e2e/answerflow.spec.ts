import { test, expect } from "@playwright/test";

test.describe("AnswerFlow AI End-to-End User Flow Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto("/");
    // Wait briefly for client-side hydration to settle
    await page.waitForTimeout(500);
  });

  test("should load dashboard page and show correct metrics", async ({ page }) => {
    // Verify dashboard heading
    await expect(page.locator("h1")).toContainText("Workspace Overview");
    
    // Check that seeded metrics are visible
    await expect(page.locator("text=Response Projects").first()).toBeVisible();
    await expect(page.locator("span:has-text('Knowledge Base')").first()).toBeVisible();
    await expect(page.locator("span:has-text('Approved Library')").first()).toBeVisible();
    
    // Check seeded project list is visible
    await expect(page.locator("text=Enterprise Security Audit 2026")).toBeVisible();
  });

  test("should navigate to projects page and open the review workspace", async ({ page }) => {
    // Go to projects list
    await page.click("text=Projects");
    await expect(page).toHaveURL(/\/projects/);
    
    // Verify seeded project card
    await expect(page.locator("text=Enterprise Security Audit 2026")).toBeVisible();
    
    // Click into Review Space
    await page.click("text=Open Review Workspace");
    await expect(page).toHaveURL(/\/projects\/.+/);
    // Verify question is loaded
    await expect(page.locator("h2:has-text('Do you support Single Sign-On')")).toBeVisible();
    
    // Verify cited evidence card is visible
    await expect(page.locator("text=Cited Evidence & Grounding")).toBeVisible();
    await expect(page.locator("text=Authentication and SSO Policy")).toBeVisible();
  });

  test("should allow editing draft response and submitting review comments", async ({ page }) => {
    // Navigate to projects
    await page.click("text=Projects");
    await page.click("text=Open Review Workspace");
    await page.waitForTimeout(500);
    
    // Update draft answer
    const editArea = page.locator("textarea").first();
    await editArea.fill("Yes, we support Google Workspace SSO, Okta, and SAML 2.0. Single Sign-on is fully certified.");
    
    // Save draft
    await page.click("button:has-text('Save Answer Details')");
    await page.waitForTimeout(200);
    
    // Submit comment
    await page.fill('input[placeholder="Add review feedback, tag teammate..."]', "Confirmed this draft with compliance team.");
    await page.click("button:has-text('Send')");
    
    // Verify comment is displayed
    await expect(page.locator("text=Confirmed this draft with compliance team.")).toBeVisible();
  });

  test("should open the export dropdown and verify export formats are present", async ({ page }) => {
    // Navigate to projects and open review workspace
    await page.click("text=Projects");
    await page.click("text=Open Review Workspace");
    await page.waitForTimeout(500);

    // Verify Export button is visible
    const exportBtn = page.locator("button:has-text('Export Response')");
    await expect(exportBtn).toBeVisible();

    // Click Export dropdown
    await exportBtn.click();
    await page.waitForTimeout(200);

    // Check export format links are available
    await expect(page.locator("a:has-text('Excel Spreadsheet')")).toBeVisible();
    await expect(page.locator("a:has-text('Word Document')")).toBeVisible();
    await expect(page.locator("a:has-text('Structured JSON')")).toBeVisible();
  });

  test("should display knowledge base and approved Q&A library correctly", async ({ page }) => {
    // Navigate to Knowledge Base
    await page.click("text=Knowledge Base");
    await expect(page).toHaveURL(/\/sources/);
    await expect(page.locator("text=Authentication and SSO Policy")).toBeVisible();
    
    // Navigate to Library
    await page.click("text=Library");
    await expect(page).toHaveURL(/\/library/);
    
    // Search library
    await page.fill('input[placeholder*="Search approved answers"]', "SSO");
    await page.waitForTimeout(500);
    await expect(page.locator("text=Do you support Single Sign-On (SSO)?")).toBeVisible();
  });
});

