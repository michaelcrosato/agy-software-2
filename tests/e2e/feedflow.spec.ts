import { test, expect } from "@playwright/test";

test.describe("FeedFlow End-to-End User Flow Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto("/");
    // Wait briefly for client-side hydration to settle
    await page.waitForTimeout(500);
  });

  test("should load landing page and show default boards", async ({ page }) => {
    // Check main title
    await expect(page.locator("h1")).toContainText("The Modern");
    await expect(page.locator("h1")).toContainText("Feedback Loop");

    // Check default boards are seeded and visible
    await expect(page.locator("text=Core Features & Requests")).toBeVisible();
    await expect(page.locator("text=Bug Reports")).toBeVisible();
  });

  test("should navigate to a board and submit a new feedback post", async ({ page }) => {
    // Navigate to Core Features board
    await page.click("text=Core Features & Requests");
    await expect(page).toHaveURL(/\/boards\/core-features/);

    // Verify submit form is present
    await expect(page.locator("h3")).toContainText("Submit Feedback");

    // Submit new feedback
    const title = "Add Discord notifications for team channels";
    const description = "We need an integration that posts feedback directly to our Discord channels so the team can discuss them in real-time.";
    
    await page.fill('input[placeholder="e.g. Add support for Google SSO..."]', title);
    await page.fill('textarea[placeholder*="Please explain the problem"]', description);
    
    // Submit
    await page.click("button:has-text('Submit Request')");

    // Post should be in the list
    await expect(page.locator(`text=${title}`)).toBeVisible();
    
    // Since the author automatically votes for it, vote count should be 1
    const card = page.locator(`div.glass-panel:has-text("${title}")`);
    await expect(card.locator("button").first()).toContainText("1");
  });

  test("should show duplicate warnings when typing similar title", async ({ page }) => {
    // Navigate to Core Features board
    await page.click("text=Core Features & Requests");

    // Enter title similar to a seeded post ("Add support for Google Single Sign-On (SSO)")
    await page.fill('input[placeholder="e.g. Add support for Google SSO..."]', "Google SSO support");

    // Wait for debounced duplicate check to fire
    await page.waitForTimeout(600);

    // Verify warning panel appears
    await expect(page.locator("text=Is your idea already listed?")).toBeVisible();
    await expect(page.locator("text=We found similar requests!")).toBeVisible();
    
    // Check that seeded duplicate is displayed
    await expect(page.locator(".border-yellow-500\\/20").locator("text=Add support for Google Single Sign-On (SSO)")).toBeVisible();
  });

  test("should allow switching user, upvoting a post, and submitting comments", async ({ page }) => {
    // Navigate to Core Features board
    await page.click("text=Core Features & Requests");
    // Wait briefly for board page event handlers to bind
    await page.waitForTimeout(500);

    // Select the first feedback card (seeded "Add support for Google Single Sign-On (SSO)" which starts with 3 votes)
    const card = page.locator('div.glass-panel:has-text("Add support for Google Single Sign-On")');
    await expect(card).toBeVisible();

    // Verify default state
    await expect(card.locator("button").first()).toContainText("3");

    // Add a comment
    await card.locator("text=Expand thread").click(); // Expand commenting or open detailed card
    await card.locator('input[placeholder="Write a constructive reply..."]').fill("I absolutely support this feature!");
    await card.locator('button[type="submit"]').click();

    // Verify comment is displayed
    await expect(page.locator("text=I absolutely support this feature!")).toBeVisible();
    await page.waitForTimeout(500);

    // Toggle vote (since current user "Alex Johnson" has already voted, clicking it should remove the vote)
    await card.locator("button").first().click();
    await expect(card.locator("button").first()).toContainText("2");

    // Switch user to Michael Crosato
    await page.click("#user-menu-button");
    await page.click("text=michael@example.com");
    await page.waitForTimeout(200);

    // Vote again (since Michael has voted in seed, clicking it removes his vote, count goes to 1)
    await card.locator("button").first().click();
    await expect(card.locator("button").first()).toContainText("1");

    // Vote once more to add Michael's vote back, count goes back to 2
    await card.locator("button").first().click();
    await expect(card.locator("button").first()).toContainText("2");
  });
});
