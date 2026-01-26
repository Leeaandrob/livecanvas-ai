# E2E Test Template: Frontend Web / Full-Stack (Playwright)

## Overview

This template provides the structure for End-to-End UI tests using Playwright for web applications (React, Vue, Angular, Next.js, Nuxt, etc.).

## Prerequisites

```bash
npm init playwright@latest
# or
npx playwright install
```

## Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Template Structure

```typescript
// tests/e2e/[feature-name].spec.ts

import { test, expect, Page } from '@playwright/test';

test.describe('Feature: [FEATURE_NAME]', () => {
  // ============================================
  // SETUP & TEARDOWN
  // ============================================

  test.beforeAll(async () => {
    // Global setup: seed database, create test users
  });

  test.afterAll(async () => {
    // Global cleanup
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to feature page before each test
    await page.goto('/feature-page');
  });

  // ============================================
  // ACCEPTANCE CRITERIA TESTS
  // ============================================

  test.describe('AC1: [Acceptance Criteria Description]', () => {
    test('should [expected behavior] when [condition]', async ({ page }) => {
      // Arrange
      await page.goto('/feature-page');

      // Act
      await page.fill('[data-testid="input-field"]', 'test value');
      await page.click('[data-testid="submit-button"]');

      // Assert
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="result"]')).toContainText('Expected result');
    });

    test('should show validation error when [invalid input]', async ({ page }) => {
      // Arrange
      await page.goto('/feature-page');

      // Act
      await page.fill('[data-testid="input-field"]', ''); // Invalid: empty
      await page.click('[data-testid="submit-button"]');

      // Assert
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('required');
    });
  });

  test.describe('AC2: [Another Acceptance Criteria]', () => {
    test('should navigate to [page] when [action]', async ({ page }) => {
      // Arrange
      await page.goto('/');

      // Act
      await page.click('[data-testid="nav-link"]');

      // Assert
      await expect(page).toHaveURL('/expected-page');
      await expect(page.locator('h1')).toContainText('Expected Title');
    });
  });

  // ============================================
  // USER FLOWS
  // ============================================

  test.describe('User Flows', () => {
    test('complete [flow name] flow', async ({ page }) => {
      // Step 1: Start
      await page.goto('/start-page');
      await expect(page.locator('[data-testid="step-1"]')).toBeVisible();

      // Step 2: Fill form
      await page.fill('[data-testid="name-input"]', 'John Doe');
      await page.fill('[data-testid="email-input"]', 'john@example.com');
      await page.click('[data-testid="next-button"]');

      // Step 3: Confirm
      await expect(page.locator('[data-testid="step-2"]')).toBeVisible();
      await page.click('[data-testid="confirm-button"]');

      // Step 4: Success
      await expect(page.locator('[data-testid="success-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmation-number"]')).toBeVisible();
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  test.describe('Error Handling', () => {
    test('should show error page on 404', async ({ page }) => {
      await page.goto('/non-existent-page');

      await expect(page.locator('[data-testid="error-404"]')).toBeVisible();
      await expect(page.locator('text=Page not found')).toBeVisible();
    });

    test('should handle network error gracefully', async ({ page }) => {
      // Simulate offline
      await page.route('**/api/**', route => route.abort());

      await page.goto('/feature-page');
      await page.click('[data-testid="load-data-button"]');

      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    });

    test('should show loading state', async ({ page }) => {
      // Slow down API response
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto('/feature-page');
      await page.click('[data-testid="load-data-button"]');

      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    });
  });

  // ============================================
  // ACCESSIBILITY
  // ============================================

  test.describe('Accessibility', () => {
    test('should have no accessibility violations', async ({ page }) => {
      await page.goto('/feature-page');

      // Using axe-playwright
      // const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      // expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/feature-page');

      // Tab through elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="first-focusable"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="second-focusable"]')).toBeFocused();

      // Submit with Enter
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="result"]')).toBeVisible();
    });
  });

  // ============================================
  // RESPONSIVE DESIGN
  // ============================================

  test.describe('Responsive Design', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeHidden();
    });

    test('should display desktop nav on large screens', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');

      await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeHidden();
    });
  });
});

// ============================================
// PAGE OBJECT MODEL (Optional)
// ============================================

class FeaturePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/feature-page');
  }

  async fillForm(data: { name: string; email: string }) {
    await this.page.fill('[data-testid="name-input"]', data.name);
    await this.page.fill('[data-testid="email-input"]', data.email);
  }

  async submit() {
    await this.page.click('[data-testid="submit-button"]');
  }

  async expectSuccess() {
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
  }
}
```

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/feature-name.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Generate test from recording
npx playwright codegen http://localhost:3000
```

## Best Practices

1. **Use data-testid** - Stable selectors that don't change with styling
2. **Wait for elements** - Use Playwright's auto-waiting, avoid manual waits
3. **Isolate tests** - Each test should be independent
4. **Test user flows** - Focus on complete user journeys
5. **Test responsive** - Verify behavior on different screen sizes
6. **Test accessibility** - Ensure keyboard navigation and screen reader support
