import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATE_EMAIL = 'candidate@demo.hiresense.local';
const RECRUITER_EMAIL = 'recruiter@demo.hiresense.local';
const PASSWORD = 'Password123!';
const DESKTOP_WIDTHS = [1024, 1280, 1440, 1600, 1920];

test.describe.configure({ mode: 'serial' });

function seedDemo() {
  const apiDir = path.resolve(__dirname, '../../api');
  const tsNodeBin = path.resolve(apiDir, 'node_modules/ts-node/dist/bin.js');
  const result = spawnSync(process.execPath, [tsNodeBin, '--transpile-only', 'prisma/seed.ts'], {
    cwd: apiDir,
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`Demo seed failed.\n${result.stdout}\n${result.stderr}`);
}

async function login(page: Page, email: string, expectedPath: string) {
  page.on('pageerror', (error) =>
    console.error(`[browser pageerror] ${error.stack ?? error.message}`),
  );
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().includes('Failed to load resource: the server responded with a status of 404')
    )
      console.error(`[browser console] ${message.text()}`);
  });
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => url.pathname === expectedPath);
}

async function expectDesktopLayout(page: Page) {
  await expect(page.locator('[data-slot="sidebar"]')).toBeVisible();
  await expect(page.locator('header').first()).toBeVisible();
  await expect(page.locator('main').first()).toBeVisible();
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const sidebar = document.querySelector('[data-slot="sidebar"]');
    const main = document.querySelector('main');
    const header = document.querySelector('header');
    const rect = (element: Element | null) =>
      element ? element.getBoundingClientRect().toJSON() : null;
    return {
      viewportWidth: window.innerWidth,
      rootClientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
      sidebar: rect(sidebar),
      main: rect(main),
      header: rect(header),
    };
  });
  expect(metrics.rootScrollWidth - metrics.rootClientWidth).toBeLessThanOrEqual(1);
  expect(metrics.bodyScrollWidth - metrics.viewportWidth).toBeLessThanOrEqual(1);
  expect(metrics.sidebar).not.toBeNull();
  expect(metrics.main).not.toBeNull();
  expect(metrics.header).not.toBeNull();
  expect(metrics.main.width).toBeGreaterThan(600);
  expect(metrics.header.width).toBeGreaterThan(600);
}

async function openCandidateApplication(page: Page) {
  await page.getByRole('link', { name: 'Applications' }).first().click();
  await page.waitForURL('/candidate/applications');
  const row = page.getByRole('row').filter({ hasText: 'Full-stack Engineer' }).last();
  await expect(row).toContainText('HireSense Demo Co');
  await row.getByRole('button', { name: 'View' }).click();
  await page.waitForURL(/\/candidate\/applications\/[^/]+$/);
}

async function openRecruiterApplication(page: Page) {
  await page.getByRole('link', { name: 'Companies' }).first().click();
  await page.waitForURL('/recruiter/companies');
  await page.getByRole('link', { name: /HireSense Demo Co/ }).click();
  await page.getByRole('link', { name: 'Jobs' }).first().click();
  const jobRow = page.getByRole('row').filter({ hasText: 'Full-stack Engineer' }).last();
  await jobRow.getByRole('button', { name: 'Manage' }).click();
  await page.getByRole('button', { name: 'View applicants' }).click();
  const applicantRow = page.getByRole('row').filter({ hasText: 'An Nguyen' }).last();
  await applicantRow.getByRole('button', { name: 'Review' }).click();
  await page.waitForURL(/\/recruiter\/companies\/[^/]+\/applications\/[^/]+$/);
}

test.beforeAll(() => seedDemo());

test('candidate happy path reaches seeded application before analysis', async ({ page }) => {
  await login(page, CANDIDATE_EMAIL, '/candidate');
  await expect(page.getByRole('heading', { name: 'Welcome, An Nguyen' })).toBeVisible();
  await expectDesktopLayout(page);
  await page.getByRole('link', { name: 'Jobs' }).first().click();
  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible();
  await page.getByRole('link', { name: /Full-stack Engineer/ }).click();
  await expect(page.getByRole('heading', { name: 'Full-stack Engineer' })).toBeVisible();
  await expect(page.getByText('Demo CV · v1')).toBeVisible();
  await page.getByRole('link', { name: 'Resumes' }).first().click();
  await expect(page.getByRole('heading', { name: 'Resumes' })).toBeVisible();
  await expect(page.getByText('Demo CV', { exact: true })).toBeVisible();
  await openCandidateApplication(page);
  await expect(page.getByText('Applied', { exact: true })).toBeVisible();
  await expect(page.getByText('No analysis result yet')).toBeVisible();
  await expectDesktopLayout(page);
});

test('recruiter happy path runs analysis and advances stage', async ({ page }) => {
  await login(page, RECRUITER_EMAIL, '/recruiter');
  await expect(page.getByRole('heading', { name: 'Welcome, Lan Recruiter' })).toBeVisible();
  await openRecruiterApplication(page);
  await expect(page.getByRole('heading', { name: 'An Nguyen' })).toBeVisible();
  await expect(page.getByText('Applied', { exact: true })).toBeVisible();
  await expectDesktopLayout(page);
  await page.getByRole('button', { name: 'Run analysis' }).first().click();
  await expect(page.getByText('Overall match')).toBeVisible();
  await expect(page.getByText('Requirement evidence')).toBeVisible();
  await expect(page.getByText('Analysis complete')).toBeVisible();
  await page.getByLabel('Next stage').click();
  await page.getByRole('option', { name: 'Screening' }).click();
  await page.getByRole('button', { name: 'Update stage' }).click();
  await expect(page.getByText('Stage updated')).toBeVisible();
  await expect(page.getByText('Screening', { exact: true }).first()).toBeVisible();
});

test('candidate sees recruiter-updated stage and explainable result', async ({ page }) => {
  await login(page, CANDIDATE_EMAIL, '/candidate');
  await openCandidateApplication(page);
  await expect(page.getByText('Screening', { exact: true })).toBeVisible();
  await expect(page.getByText('Overall match')).toBeVisible();
  await expect(page.getByText('Score breakdown')).toBeVisible();
  await expect(page.getByText('Requirement evidence')).toBeVisible();
  await expectDesktopLayout(page);
});

test('desktop sidebar collapse and keyboard shortcut preserve layout', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await login(page, CANDIDATE_EMAIL, '/candidate');
  const sidebar = page.locator('[data-slot="sidebar"]').first();
  await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await page.locator('header').getByRole('button', { name: 'Toggle Sidebar' }).click();
  await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  await expectDesktopLayout(page);
  await page.keyboard.press('Control+b');
  await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await expectDesktopLayout(page);
});

test('candidate dark theme checkpoint 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, CANDIDATE_EMAIL, '/candidate');
  await page.locator('[data-slot="sidebar-footer"]').getByRole('button').first().click();
  await page.getByRole('menuitem', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expectDesktopLayout(page);
  await expect(page).toHaveScreenshot('candidate-overview-dark-1440.png', {
    animations: 'disabled',
    fullPage: true,
  });
});

for (const width of DESKTOP_WIDTHS) {
  test(`candidate desktop checkpoint ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, CANDIDATE_EMAIL, '/candidate');
    await expectDesktopLayout(page);
    await expect(page).toHaveScreenshot(`candidate-overview-${width}.png`, {
      animations: 'disabled',
      fullPage: true,
    });
  });

  test(`recruiter desktop checkpoint ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, RECRUITER_EMAIL, '/recruiter');
    await expectDesktopLayout(page);
    await expect(page).toHaveScreenshot(`recruiter-overview-${width}.png`, {
      animations: 'disabled',
      fullPage: true,
    });
  });
}

test('matching detail visual checkpoint 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, CANDIDATE_EMAIL, '/candidate');
  await openCandidateApplication(page);
  await expectDesktopLayout(page);
  const completedCard = page
    .getByText('Completed', { exact: true })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  await expect(page).toHaveScreenshot('candidate-matching-1440.png', {
    animations: 'disabled',
    fullPage: true,
    mask: [completedCard],
  });
});
