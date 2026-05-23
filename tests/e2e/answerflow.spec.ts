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

  test("should allow uploading a CSV questionnaire and mapping columns successfully", async ({ page }) => {
    // Navigate to projects
    await page.click("text=Projects");
    await page.waitForTimeout(500);

    // Open new project form
    await page.click("text=New Response Project");
    await page.waitForTimeout(200);

    // Fill in basic details
    await page.fill('input[placeholder="e.g. Enterprise Security Review Q3"]', "CSV Import Test Project");
    await page.fill('input[placeholder="e.g. Acme Corporation"]', "CSV Test Corp");

    // Simulate file upload
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=Upload CSV File");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "questionnaire.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "Question Header,Category Header,Location Header\n" +
        "Does the system support SSO?,Security,Row 10\n" +
        "How often are database backups performed?,Infrastructure,Row 11\n"
      ),
    });

    await page.waitForTimeout(500);

    // Verify CSV details banner is visible
    await expect(page.locator("text=questionnaire.csv")).toBeVisible();
    await expect(page.locator("text=2 rows detected")).toBeVisible();

    // Verify Column Mapper configuration is visible
    await expect(page.locator("text=Column Mapper Configuration")).toBeVisible();

    // Map column dropdowns
    await page.selectOption("select >> nth=0", "0"); // Question Text mapped to index 0 (Question Header)
    await page.selectOption("select >> nth=1", "1"); // Category mapped to index 1 (Category Header)
    await page.selectOption("select >> nth=2", "2"); // Location mapped to index 2 (Location Header)

    await page.waitForTimeout(200);

    // Verify Live Parse Preview matches the first mock question
    await expect(page.locator("text=Does the system support SSO?")).toBeVisible();
    await expect(page.locator("text=Location: Row 10")).toBeVisible();

    // Click Parse & Create Project
    await page.click("button:has-text('Parse & Create Project')");
    await page.waitForTimeout(1000);

    // Should redirect to review workspace and load questions from the CSV
    await expect(page).toHaveURL(/\/projects\/.+/);
    await expect(page.locator("h2:has-text('Does the system support SSO?')")).toBeVisible();
  });

  test("should allow inviting a teammate and assigning a question to them", async ({ page }) => {
    // Navigate to Team page
    await page.click("text=Team");
    await expect(page).toHaveURL(/\/team/);

    // Verify page headers
    await expect(page.locator("h1")).toContainText("Team Collaboration");

    // Invite new teammate
    await page.fill('input[placeholder="e.g. Robert Chen"]', "Test Expert Teammate");
    await page.fill('input[placeholder="e.g. robert@company.com"]', "test.expert@company.com");
    await page.click("button:has-text('Send Invitation')");

    // Check that success banner is displayed and teammate is listed!
    await expect(page.locator("text=invited successfully!")).toBeVisible();
    await expect(page.locator("h3:has-text('Test Expert Teammate')")).toBeVisible();
    await expect(page.locator("text=test.expert@company.com").first()).toBeVisible();

    // Now, navigate to Projects and open Review Workspace
    await page.click("text=Projects");
    await page.click("text=Open Review Workspace");
    await page.waitForTimeout(500);

    // Select our newly invited teammate in the Assignee dropdown (the first select in the form)
    const assigneeSelect = page.locator("form select").first();
    await assigneeSelect.selectOption({ label: "Test Expert Teammate" });

    // Save draft
    await page.click("button:has-text('Save Answer Details')");
    await page.waitForTimeout(500);

    // Refresh page and verify teammate is still selected!
    await page.reload();
    await page.waitForTimeout(500);
    const selectValue = await assigneeSelect.inputValue();
    expect(selectValue).toBeTruthy();
  });
});

