import { expect, test, type Page } from '@playwright/test';

const MOCK_BASE = 'https://your-domain.atlassian.net';

interface WindowWithJiraMock {
  jiraMock?: unknown;
}

async function waitForMockApp(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Jira Mock API Tester/ })).toBeVisible();
  await expect(page.locator('div.swagger-ui')).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => Boolean((window as WindowWithJiraMock).jiraMock)))
    .toBe(true);
}

test('MSW service worker activates and exposes the data store', async ({ page }) => {
  await waitForMockApp(page);

  const controllerState = await page.evaluate(() => navigator.serviceWorker.controller !== null);
  expect(controllerState).toBe(true);

  const stats = await page.evaluate(() => {
    const jiraMock = (
      window as {
        jiraMock?: {
          dataStore: { getAllProjects: () => unknown[]; getAllIssues: () => unknown[] };
        };
      }
    ).jiraMock;
    if (!jiraMock) return null;
    return {
      projects: jiraMock.dataStore.getAllProjects().length,
      issues: jiraMock.dataStore.getAllIssues().length,
    };
  });
  expect(stats).not.toBeNull();
  expect(stats?.projects).toBeGreaterThan(0);
  expect(stats?.issues).toBeGreaterThan(0);
});

test('browser fetches to the mocked Jira origin are intercepted by MSW', async ({ page }) => {
  await waitForMockApp(page);

  const result = await page.evaluate(async (base) => {
    const response = await fetch(`${base}/rest/api/2/project/search`);
    const body = await response.json();
    return {
      status: response.status,
      total: body.total as number,
      projectCount: (body.values as unknown[]).length,
      firstKey: (body.values as { key: string }[])[0]?.key,
    };
  }, MOCK_BASE);

  expect(result.status).toBe(200);
  expect(result.total).toBeGreaterThan(0);
  expect(result.projectCount).toBeGreaterThan(0);
  expect(result.firstKey).toMatch(/^[A-Z][A-Z0-9]+$/);
});

test('Swagger UI executes a request against MSW and renders the mocked response', async ({
  page,
}) => {
  await waitForMockApp(page);

  const operation = page.locator('.opblock', { hasText: '/rest/api/2/priority' }).first();
  await operation.locator('.opblock-summary').click();
  await operation.getByRole('button', { name: 'Execute' }).click();

  await expect(operation.getByRole('row', { name: /200/ }).first()).toBeVisible({
    timeout: 30_000,
  });
  const responseRow = operation
    .getByRole('row', { name: /200.*Response body.*Response headers/s })
    .first();
  await expect(responseRow).toContainText('"name": "Highest"');
});
