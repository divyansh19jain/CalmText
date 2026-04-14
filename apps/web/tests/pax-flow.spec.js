import { test, expect } from '@playwright/test';

test.describe('CalmText Analysis Flow', () => {
  test('should complete the full pax analysis flow', async ({ page }) => {
    // 1. Navigate to the application
    await page.goto('/');
    
    // Check for the initial state
    await expect(page.locator('h1')).toBeHidden(); // In the current Zen Dog UI, the <h1> might be hidden or different
    // Based on App.jsx: "Paste the text message you received..."
    const textarea = page.getByPlaceholder('Paste the text message you received...');
    await expect(textarea).toBeVisible();

    // 2. Type a draft message
    const testMessage = 'I don\'t understand what you\'re doing. Please explain.';
    await textarea.fill(testMessage);

    // 3. Click the "Paws" button
    const pawsButton = page.getByRole('button', { name: 'Paws' });
    await pawsButton.click();

    // 4. Verify the loading screen appears
    const loadingText = page.getByText('Taking a moment to paws...');
    await expect(loadingText).toBeVisible();

    // 5. Verify the result screen appears
    // The result screen shows "Pax says..."
    const resultHeader = page.getByText('Pax says...', { exact: false });
    // Increase timeout for API response if needed
    await expect(resultHeader).toBeVisible({ timeout: 10000 });

    // Verify the original message is displayed
    await expect(page.getByText(testMessage)).toBeVisible();
    
    // Verify analysis result is present (it should contain "Pax says:")
    await expect(page.getByText(/Pax says:/)).toBeVisible();
  });
});
