const path = require('path');
const { chromium } = require('playwright');

const appUrl = `file://${path.resolve(__dirname, '..', 'index.html')}`;

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];

  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(appUrl, { waitUntil: 'load' });
  await page.evaluate(() => {
    window.sleep = () => Promise.resolve();
  });

  const initial = await page.evaluate(() => ({
    steps: Boolean(document.querySelector('#steps')),
    background: getComputedStyle(document.querySelector('#hundredsBox')).backgroundImage,
  }));
  expectEqual(initial.steps, true, 'steps panel exists');
  expectEqual(initial.background, 'none', 'hundreds box uses local CSS');

  await page.locator('#numberInput').fill('27');
  await page.locator('#numberInput').press('Tab');
  await page.waitForTimeout(50);

  const after27 = await page.evaluate(() => ({
    number: document.querySelector('#numberInput').value,
    hundreds: document.querySelector('#hundredsDisplay').textContent,
    left: document.querySelector('#leftHandImage').getAttribute('src'),
    right: document.querySelector('#rightHandImage').getAttribute('src'),
  }));
  expectEqual(after27.number, '27', 'number input');
  expectEqual(after27.hundreds, '0', 'hundreds display');
  expectEqual(after27.left, 'images/left/20.png', 'left hand');
  expectEqual(after27.right, 'images/right/7.png', 'right hand');

  await page.locator('#numberInput').fill('999');
  await page.locator('#numberInput').press('Tab');
  await page.locator('#addInput').fill('1');
  await page.locator('button.btn-add').click();
  await page.waitForTimeout(50);
  expectEqual(await page.locator('#numberInput').inputValue(), '999', 'addition clamps at 999');

  await page.locator('#lesson10').scrollIntoViewIfNeeded();
  await page.locator('button').filter({ hasText: 'แสดงตัวอย่าง' }).nth(4).click();
  await page.waitForTimeout(50);

  const lesson10 = await page.evaluate(() => ({
    left: document.querySelector('#counting-hand-10-left').getAttribute('src'),
    right: document.querySelector('#counting-hand-10-right').getAttribute('src'),
  }));
  expectEqual(lesson10.left, 'images/left/10.png', 'lesson 10 left hand');
  expectEqual(lesson10.right, 'images/right/0.png', 'lesson 10 right hand');

  await browser.close();

  if (errors.length) {
    throw new Error(`Browser errors:\n${errors.join('\n')}`);
  }
})();

