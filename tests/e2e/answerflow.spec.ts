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
    await expect(page.locator("a:has-text('Comma-Separated Values')")).toBeVisible();
    await expect(page.locator("a:has-text('Word Document (.docx)')")).toBeVisible();
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

  test("should allow uploading a TXT document to Knowledge Base successfully", async ({ page }) => {
    // Navigate to Knowledge Base
    await page.click("text=Knowledge Base");
    await expect(page).toHaveURL(/\/sources/);

    // Open upload form
    await page.click("text=Upload Knowledge Document");
    await page.waitForTimeout(200);

    // Simulate file upload
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=Drag & drop policy or technical files here");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "breach_notification_policy.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Breach Notification Timeline\n\n" +
        "We notify customers within 72 hours of a confirmed data breach incident.\n\n" +
        "Critical incidents are escalated immediately to GRC and legal counsel."
      ),
    });

    await page.waitForTimeout(500);

    // Verify fields populated
    await expect(page.locator('input[placeholder="e.g. Incident Response and Breach Notification Plan"]')).toHaveValue("Breach Notification Policy");
    await expect(page.locator("textarea").first()).toContainText("We notify customers within 72 hours");

    // Click Parse & Chunk Document
    await page.click("button:has-text('Parse & Chunk Document')");
    await page.waitForTimeout(1000);

    // Verify it is listed in the sources table!
    await expect(page.locator("h3:has-text('Breach Notification Policy')")).toBeVisible();
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
    await page.click("text=Upload CSV/Excel File");
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

  test("should allow auto-drafting a single question via RAG", async ({ page }) => {
    // Navigate to projects and open review workspace
    await page.click("text=Projects");
    await page.click("text=Open Review Workspace");
    await page.waitForTimeout(500);

    // Let's clear the textarea and save it to simulate an empty draft
    const editArea = page.locator("textarea").first();
    await editArea.fill("");
    await page.click("button:has-text('Save Answer Details')");
    await page.waitForTimeout(500);

    // Verify it is empty
    await expect(editArea).toHaveValue("");

    // Click "Draft with AI" button
    await page.click("button:has-text('Draft with AI')");

    // Check that the textarea is populated with the RAG answer (auto-retries up to 10s)
    await expect(editArea).not.toHaveValue("", { timeout: 10000 });
    const newVal = await editArea.inputValue();
    expect(newVal.length).toBeGreaterThan(10);
    
    // Verify cited evidence is visible
    await expect(page.locator("text=Cited Evidence & Grounding")).toBeVisible();
  });

  test("should allow selecting a custom generation tone and drafting with RAG", async ({ page }) => {
    // Navigate to projects and open review workspace
    await page.click("text=Projects");
    await page.click("text=Open Review Workspace");
    await page.waitForTimeout(500);

    // Verify tone selector exists
    const toneSelector = page.locator("#tone-selector");
    await expect(toneSelector).toBeVisible();

    // Select 'Security Questionnaire Tone'
    await toneSelector.selectOption("Security");

    // Click 'Draft with AI' button
    await page.click("#draft-with-ai-btn");

    // Check that the textarea is populated with the formatted answer
    const editArea = page.locator("textarea").first();
    await expect(editArea).toHaveValue(/^Security Policy Verification:/, { timeout: 10000 });
  });

  test("should allow question similarity clustering and bulk actions in workspace", async ({ page }) => {
    // Capture browser console logs
    page.on("console", msg => console.log("[BROWSER CONSOLE]", msg.text()));

    // Navigate to projects and open review workspace for the seeded project specifically
    await page.click("text=Projects");
    await page.click("div.group:has-text('Enterprise Security Audit 2026') button:has-text('Open Review Workspace')");
    await page.waitForTimeout(500);

    // Verify Standard List is visible
    await expect(page.locator("text=Standard List")).toBeVisible();
    await expect(page.locator("text=Similarity Clusters")).toBeVisible();

    // Toggle Similarity Clusters view
    await page.click("#similarity-clusters-tab");
    await page.waitForTimeout(500);

    // Expand accordion on repetitive questions
    await page.click("text=Expand Similar Questions");
    await page.waitForTimeout(500);

    // Select the first similar item inside cluster to view details
    await page.click("text=Row 2");
    await page.waitForTimeout(500);

    // Check that the cluster detection bar is rendered
    await expect(page.locator("text=Repetitive Question Cluster Detected")).toBeVisible();
    await expect(page.locator("#propagate-answer-btn")).toBeVisible();
    await expect(page.locator("#bulk-approve-btn")).toBeVisible();

    // Fill the answer box with a test value
    const answerInput = page.locator("textarea").first();
    await answerInput.fill("SSO support includes fully integrated standard Okta and Google Workspace SSO provider configurations.");

    // Trigger propagate answer
    await page.click("#propagate-answer-btn");
    await page.waitForTimeout(1000); // Wait for sequential updates

    // Trigger bulk approve cluster
    await page.click("#bulk-approve-btn");
    await page.waitForTimeout(1000); // Wait for sequential approvals

    // Confirm that the status is successfully marked as Approved in UI
    await page.click("text=Standard List");
    await page.waitForTimeout(500);
    await expect(page.locator("span:text-is('Approved')").first()).toBeVisible();
  });

  test("should enforce sensitive claim controls in workspace editor and export dropdown", async ({ page }) => {
    // 1. Navigate to projects and open review workspace for seeded project
    await page.click("text=Projects");
    await page.click("div.group:has-text('Enterprise Security Audit 2026') button:has-text('Open Review Workspace')");
    await page.waitForTimeout(500);

    // 2. Select Question 3 ("Do you offer data hosting in the European Union (EU)?")
    // Question 3 has category "Compliance" (sensitive) and status "Needs Review" (unapproved)
    await page.click("text=Row 81");
    await page.waitForTimeout(500);

    // Assert that the visual Sensitive Claim Control alert banner is rendered in the active editor
    const sensitiveBanner = page.locator("#sensitive-claim-banner");
    await expect(sensitiveBanner).toBeVisible();
    await expect(sensitiveBanner).toContainText("Sensitive Claim Control Active");
    await expect(sensitiveBanner).toContainText("Compliance");

    // 3. Open Export dropdown
    const exportBtn = page.locator("button:has-text('Export Response')");
    await exportBtn.click();
    await page.waitForTimeout(200);

    // Assert that the exclamation badge is visible on the button
    const sensitiveBadge = page.locator("#unapproved-sensitive-badge");
    await expect(sensitiveBadge).toBeVisible();

    // Assert that the warning box inside the dropdown is displayed
    const warningBox = page.locator("#unapproved-sensitive-warning-box");
    await expect(warningBox).toBeVisible();
    await expect(warningBox).toContainText("Unapproved Sensitive Claims");
    await expect(warningBox).toContainText("sensitive answers will be redacted");

    // 4. Assert export links by default DO NOT have the bypass query param
    const xlsxLink = page.locator("#export-xlsx-link");
    const csvLink = page.locator("#export-csv-link");
    await expect(xlsxLink).toHaveAttribute("href", /export\?format=xlsx$/);
    await expect(csvLink).toHaveAttribute("href", /export\?format=csv$/);

    // 5. Toggle the checkbox to allow unapproved sensitive claims
    await page.click("#allow-unapproved-checkbox");
    await page.waitForTimeout(200);

    // Assert export links now DO contain the bypass query param
    await expect(xlsxLink).toHaveAttribute("href", /export\?format=xlsx&allowUnapprovedSensitive=true$/);
    await expect(csvLink).toHaveAttribute("href", /export\?format=csv&allowUnapprovedSensitive=true$/);
  });

  test("should allow uploading a DOCX questionnaire and extracting questions successfully", async ({ page }) => {
    // Navigate to projects
    await page.click("text=Projects");
    await page.waitForTimeout(500);

    // Open new project form
    await page.click("text=New Response Project");
    await page.waitForTimeout(200);

    // Fill in basic details
    await page.fill('input[placeholder="e.g. Enterprise Security Review Q3"]', "DOCX Import Test Project");
    await page.fill('input[placeholder="e.g. Acme Corporation"]', "DOCX Test Corp");

    // Simulate file upload with single-paragraph.docx
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=Upload CSV/Excel File");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles("tests/single-paragraph.docx");

    await page.waitForTimeout(1500);

    // Verify DOCX details banner is visible
    await expect(page.locator("text=single-paragraph.docx")).toBeVisible();

    // Verify Live Parse Preview matches the extracted text from mammoth
    await expect(page.locator("text=Walking on imported air")).toBeVisible();

    // Click Parse & Create Project
    await page.click("button:has-text('Parse & Create Project')");
    await page.waitForTimeout(1500);

    // Should redirect to review workspace and load questions from the DOCX
    await expect(page).toHaveURL(/\/projects\/.+/);
    await expect(page.locator("h2:has-text('Walking on imported air')")).toBeVisible();
  });

  test("should allow uploading a PDF document to Knowledge Base successfully", async ({ page }) => {
    // Navigate to Knowledge Base
    await page.click("text=Knowledge Base");
    await expect(page).toHaveURL(/\/sources/);

    // Open upload form
    await page.click("text=Upload Knowledge Document");
    await page.waitForTimeout(200);

    // Simulate file upload with test-questionnaire.pdf
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=Drag & drop policy or technical files here");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles("tests/test-questionnaire.pdf");

    await page.waitForTimeout(1500);

    // Verify fields populated from pdf-parse
    await expect(page.locator('input[placeholder="e.g. Incident Response and Breach Notification Plan"]')).toHaveValue("Test Questionnaire");
    await expect(page.locator("textarea").first()).toContainText("Does the platform support Okta or Google SSO?");

    // Click Parse & Chunk Document
    await page.click("button:has-text('Parse & Chunk Document')");
    await page.waitForTimeout(1500);

    // Verify it is listed in the sources table!
    await expect(page.locator("h3:has-text('Test Questionnaire')")).toBeVisible();
  });

  test("should allow uploading a PDF questionnaire and extracting questions successfully", async ({ page }) => {
    // Navigate to projects
    await page.click("text=Projects");
    await page.waitForTimeout(500);

    // Open new project form
    await page.click("text=New Response Project");
    await page.waitForTimeout(200);

    // Fill in basic details
    await page.fill('input[placeholder="e.g. Enterprise Security Review Q3"]', "PDF Import Test Project");
    await page.fill('input[placeholder="e.g. Acme Corporation"]', "PDF Test Corp");

    // Simulate file upload with test-questionnaire.pdf
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=Upload CSV/Excel File");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles("tests/test-questionnaire.pdf");

    await page.waitForTimeout(1500);

    // Verify PDF details banner is visible
    await expect(page.locator("text=test-questionnaire.pdf")).toBeVisible();

    // Verify Live Parse Preview matches the extracted text from pdf-parse
    await expect(page.locator("text=Does the platform support Okta or Google SSO?")).toBeVisible();

    // Click Parse & Create Project
    await page.click("button:has-text('Parse & Create Project')");
    await page.waitForTimeout(1500);

    // Should redirect to review workspace and load questions from the PDF
    await expect(page).toHaveURL(/\/projects\/.+/);
    await expect(page.locator("h2:has-text('Does the platform support Okta or Google SSO?')")).toBeVisible();
  });
});

