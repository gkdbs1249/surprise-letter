import { test, expect } from '@playwright/test';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:43127';

test('creator selects alignment and recipient opens a centered envelope letter', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => {
    navigator.share = async payload => { window.__sharedLetter = payload; };
  });
  const page = await context.newPage();
  await page.goto(baseUrl);

  await expect(page.getByRole('heading', { name: '서프라이즈 편지 만들기' })).toBeVisible();
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', '도착한 비밀편지 열어보기');
  await expect(page.locator('#recipient-view')).toBeHidden();
  await expect(page.locator('#error-view')).toBeHidden();
  await page.getByLabel('받는 사람').fill('하윤');
  await page.getByLabel('보내는 사람').fill('제권');
  await page.getByLabel('편지 내용').fill('오늘도 고마워.\n앞으로도 함께하자!');
  await page.getByLabel('가운데 정렬').check();
  await page.getByRole('button', { name: '편지 링크 만들기' }).click();

  const link = await page.locator('#share-link').inputValue();
  expect(link).toContain('#letter=');
  await page.getByRole('button', { name: 'SNS로 공유하기' }).click();
  await expect.poll(() => page.evaluate(() => window.__sharedLetter)).toEqual({
    title: '도착한 비밀편지 열어보기',
    text: '도착한 비밀편지 열어보기',
    url: link,
  });
  await expect(page.locator('#history-list li')).toHaveCount(1);

  await page.getByLabel('받는 사람').fill('엄마');
  await page.getByLabel('편지 내용').fill('늘 고마워요!');
  await page.getByRole('button', { name: '편지 링크 만들기' }).click();
  await expect(page.locator('#history-list li')).toHaveCount(2);
  await page.getByRole('button', { name: '엄마에게 보낸 편지 삭제' }).click();
  await expect(page.locator('#history-list li')).toHaveCount(1);
  await expect(page.locator('#history-list')).toContainText('하윤에게 보낸 편지');
  await page.reload();
  await expect(page.locator('#history-list li')).toHaveCount(1);

  const recipient = await context.newPage();
  await recipient.goto(link);
  await expect(recipient.locator('#creator-view')).toBeHidden();
  await expect(recipient.locator('#error-view')).toBeHidden();
  await expect(recipient.getByRole('button', { name: '편지봉투 열기' })).toBeVisible();
  await expect(recipient.locator('#letter-sheet')).toBeHidden();
  const closedGap = await recipient.evaluate(() => {
    const label = document.querySelector('#delivery-label').getBoundingClientRect();
    const envelope = document.querySelector('#envelope').getBoundingClientRect();
    return envelope.top - label.bottom;
  });
  expect(closedGap).toBeLessThanOrEqual(45);

  await recipient.getByRole('button', { name: '편지봉투 열기' }).click();
  await expect(recipient.locator('#letter-sheet')).toBeVisible();
  await expect(recipient.locator('#letter-sheet')).toContainText('하윤에게');
  await expect(recipient.locator('#letter-sheet')).toContainText('오늘도 고마워.');
  await expect(recipient.locator('#letter-sheet')).toContainText('제권');
  await expect(recipient.locator('#letter-message')).toHaveCSS('text-align', 'center');
  await expect(recipient.locator('#envelope')).toHaveClass(/opened/);
  await recipient.waitForTimeout(1100);
  const openedLayout = await recipient.evaluate(() => {
    const letter = document.querySelector('#letter-sheet').getBoundingClientRect();
    const viewportCenter = innerHeight / 2;
    const letterCenter = letter.top + letter.height / 2;
    return { top: letter.top, bottom: letter.bottom, centerDelta: Math.abs(letterCenter - viewportCenter) };
  });
  expect(openedLayout.top).toBeGreaterThanOrEqual(16);
  expect(openedLayout.bottom).toBeLessThanOrEqual(844 - 16);
  expect(openedLayout.centerDelta).toBeLessThan(90);
  await context.close();
});

test('creator deletes one saved letter without removing the others', async ({ page }) => {
  await page.goto(baseUrl);
  for (const recipient of ['하윤', '엄마']) {
    await page.getByLabel('받는 사람').fill(recipient);
    await page.getByLabel('보내는 사람').fill('제권');
    await page.getByLabel('편지 내용').fill(`${recipient}에게 보내는 편지`);
    await page.getByRole('button', { name: '편지 링크 만들기' }).click();
  }
  await expect(page.locator('#history-list li')).toHaveCount(2);
  await page.getByRole('button', { name: '엄마에게 보낸 편지 삭제' }).click();
  await expect(page.locator('#history-list li')).toHaveCount(1);
  await expect(page.locator('#history-list')).toContainText('하윤에게 보낸 편지');
  await page.reload();
  await expect(page.locator('#history-list li')).toHaveCount(1);
});

test('invalid letter link shows a safe recovery path', async ({ page }) => {
  await page.goto(`${baseUrl}/#letter=broken`);
  await expect(page.locator('#creator-view')).toBeHidden();
  await expect(page.locator('#recipient-view')).toBeHidden();
  await expect(page.getByRole('heading', { name: '편지를 열 수 없어요' })).toBeVisible();
  await expect(page.getByRole('link', { name: '새 편지 만들기' })).toBeVisible();
});
