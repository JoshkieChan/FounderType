import { test, expect } from '@playwright/test';
import { installFixtures } from './fixtures.mjs';

async function screenshot(page, name) {
  if (process.env.CAPTURE_SCREENSHOTS === '1') {
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: false,
    });
  }
}
test('onboarding to diagnostic result and commitment form', async ({
  page,
}) => {
  await installFixtures(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByText('You Keep Starting. You Keep Stopping.')
  ).toBeVisible();
  await screenshot(page, '01-onboarding');
  for (let i = 0; i < 3; i++)
    await page.getByText('Next', { exact: true }).click();
  await page.getByText('Start Diagnostic', { exact: true }).click();
  await expect(page.getByText('Question 1 of 7')).toBeVisible();
  await screenshot(page, '02-diagnostic');
  for (let i = 1; i <= 7; i++) {
    await expect(page.getByText(`Question ${i} of 7`)).toBeVisible();
    // The question options are touchable divs following the question text.
    await page.locator('[data-testid="diagnostic-option-0"]').click();
  }
  await expect(page).toHaveURL(/results/, { timeout: 30000 });
  await expect(page.getByText('The Truth', { exact: true })).toBeVisible();
  await expect(page.getByText('No profile data available')).toHaveCount(0);
  await screenshot(page, '03-result');
  await page.getByText('Put My Commitment on Record', { exact: true }).click();
  await expect(
    page.getByText('Post Your Commitment', { exact: true })
  ).toBeVisible();
  await page
    .getByPlaceholder('I will...')
    .fill('I will publish a working garden planner in 30 days');
  await page
    .getByTestId('daily-action')
    .fill('Build and test one small feature');
  await screenshot(page, '04-commitment');
  expect(errors).toEqual([]);
});

async function fillCommitment(page) {
  await page.goto('/commitment');
  await page
    .getByPlaceholder('I will...')
    .fill('I will publish a working garden planner in 30 days');
  await page
    .getByTestId('daily-action')
    .fill('Build and test one small feature');
  await page.getByTestId('agree-public').click();
  await page.getByTestId('agree-edit-window').click();
  await page.getByText('Post My Commitment', { exact: true }).click();
}
test('failed commitment does not navigate to a fictional public record', async ({
  page,
}) => {
  await installFixtures(page, { failCreate: true });
  await fillCommitment(page);
  await expect(
    page.getByText(/Your commitment was not posted/).last()
  ).toBeVisible();
  await expect(page).toHaveURL(/commitment/);
});
test('synthetic commitment, check-in, receipt and public feed', async ({
  page,
}) => {
  const f = await installFixtures(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await fillCommitment(page);
  await expect(page).toHaveURL(/check-in/);
  await page.getByTestId('daily-check-in').click();
  await expect(page.getByText('Receipt logged', { exact: true })).toBeVisible();
  await screenshot(page, '05-check-in');
  await page.getByText('Log Weekly Receipt', { exact: true }).click();
  await expect(page.getByText('Receipt logged and synced.')).toBeVisible();
  await expect(
    page.getByText('Today: checked in', { exact: false })
  ).toBeVisible();
  await expect(page.getByTestId('daily-check-in')).toBeDisabled();
  await screenshot(page, '06-receipt');
  await page.goto('/feed');
  await expect(
    page.getByText('I will publish a working garden planner in 30 days', {
      exact: false,
    })
  ).toBeVisible();
  await screenshot(page, '07-public-feed');
  expect(
    f.requests.filter((r) => r.path.endsWith('record_check_in'))
  ).toHaveLength(1);
  expect(errors).toEqual([]);
});
test('failed check-in remains unrecorded', async ({ page }) => {
  await installFixtures(page, { failCheckIn: true });
  await fillCommitment(page);
  await expect(page).toHaveURL(/check-in/);
  const dialog = page.waitForEvent('dialog');
  await page.getByTestId('daily-check-in').click();
  const message = await dialog;
  expect(message.message()).toContain('was not saved');
  await message.dismiss();
  await expect(page.getByText('Receipt logged', { exact: true })).toHaveCount(
    0
  );
  await expect(page.getByTestId('daily-check-in')).toBeEnabled();
});
