import { test, expect } from '@playwright/test';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:43127';

test('creator makes multiple links and recipient opens an envelope', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(baseUrl);

  await expect(page.getByRole('heading', { name: '서프라이즈 편지 만들기' })).toBeVisible();
  await expect(page.locator('#recipient-view')).toBeHidden();
  await expect(page.locator('#error-view')).toBeHidden();
  await page.getByLabel('받는 사람').fill('하윤');
  await page.getByLabel('보내는 사람').fill('제권');
  await page.getByLabel('편지 내용').fill('오늘도 고마워.\n앞으로도 함께하자!');
  await page.getByRole('button', { name: '편지 링크 만들기' }).click();

  const link = await page.locator('#share-link').inputValue();
  expect(link).toContain('#letter=');
  await expect(page.locator('#history-list li')).toHaveCount(1);

  await page.getByLabel('받는 사람').fill('엄마');
  await page.getByLabel('편지 내용').fill('늘 고마워요!');
  await page.getByRole('button', { name: '편지 링크 만들기' }).click();
  await expect(page.locator('#history-list li')).toHaveCount(2);

  const recipient = await context.newPage();
  await recipient.goto(link);
  await expect(recipient.locator('#creator-view')).toBeHidden();
  await expect(recipient.locator('#error-view')).toBeHidden();
  await expect(recipient.getByRole('button', { name: '편지봉투 열기' })).toBeVisible();
  await expect(recipient.locator('#letter-sheet')).toBeHidden();
  await recipient.getByRole('button', { name: '편지봉투 열기' }).click();
  await expect(recipient.locator('#letter-sheet')).toBeVisible();
  await expect(recipient.locator('#letter-sheet')).toContainText('하윤에게');
  await expect(recipient.locator('#letter-sheet')).toContainText('오늘도 고마워.');
  await expect(recipient.locator('#letter-sheet')).toContainText('제권');
  await expect(recipient.locator('#envelope')).toHaveClass(/opened/);
  await context.close();
});

test('invalid letter link shows a safe recovery path', async ({ page }) => {
  await page.goto(`${baseUrl}/#letter=broken`);
  await expect(page.locator('#creator-view')).toBeHidden();
  await expect(page.locator('#recipient-view')).toBeHidden();
  await expect(page.getByRole('heading', { name: '편지를 열 수 없어요' })).toBeVisible();
  await expect(page.getByRole('link', { name: '새 편지 만들기' })).toBeVisible();
});
