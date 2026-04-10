const path = require('path');
const { chromium } = require('playwright');

const appUrl = `file://${path.resolve(__dirname, '..', 'index.html')}`;

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function expectCondition(condition, label) {
  if (!condition) {
    throw new Error(label);
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
    practice: Boolean(document.querySelector('#practice')),
    navLinks: Array.from(document.querySelectorAll('.nav-links a')).map(link => ({
      text: link.textContent.trim(),
      href: link.getAttribute('href'),
    })),
    practiceAfterLesson10: Boolean(
      document.querySelector('#lesson10').compareDocumentPosition(document.querySelector('#practice')) &
      Node.DOCUMENT_POSITION_FOLLOWING
    ),
    background: getComputedStyle(document.querySelector('#hundredsBox')).backgroundImage,
  }));
  expectEqual(initial.steps, false, 'steps panel is removed');
  expectEqual(initial.practice, true, 'practice section exists');
  expectEqual(initial.practiceAfterLesson10, true, 'practice follows lesson 10');
  expectEqual(JSON.stringify(initial.navLinks.slice(0, 3)), JSON.stringify([
    { text: 'การนับเลข', href: '#display' },
    { text: 'เทคนิค', href: '#lesson5' },
    { text: 'แบบฝึก', href: '#practice' },
  ]), 'navbar links');
  expectEqual(initial.background, 'none', 'hundreds box uses local CSS');

  await page.getByRole('link', { name: 'เทคนิค' }).click();
  await page.waitForTimeout(50);
  const lesson5Scroll = await page.evaluate(() => {
    const navBottom = document.querySelector('.navbar').getBoundingClientRect().bottom;
    const lessonTop = document.querySelector('#lesson5').getBoundingClientRect().top;
    return { navBottom, lessonTop };
  });
  expectCondition(lesson5Scroll.lessonTop >= lesson5Scroll.navBottom, 'technique link clears sticky nav');

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
  await page.getByRole('button', { name: '+ บวก' }).click();
  await page.waitForTimeout(50);
  expectEqual(await page.locator('#numberInput').inputValue(), '999', 'addition clamps at 999');

  await page.setViewportSize({ width: 1000, height: 900 });
  await page.locator('#lesson10').scrollIntoViewIfNeeded();
  const lesson10ColumnCount = await page.evaluate(() =>
    getComputedStyle(document.querySelector('#lesson10 .lesson-example'))
      .gridTemplateColumns
      .split(' ')
      .filter(Boolean)
      .length
  );
  expectEqual(lesson10ColumnCount, 2, 'lesson 10 example columns');
  await page.locator('button').filter({ hasText: 'แสดงตัวอย่าง' }).nth(4).click();
  await page.waitForTimeout(50);

  const lesson10 = await page.evaluate(() => ({
    left: document.querySelector('#counting-hand-10-left').getAttribute('src'),
    right: document.querySelector('#counting-hand-10-right').getAttribute('src'),
  }));
  expectEqual(lesson10.left, 'images/left/10.png', 'lesson 10 left hand');
  expectEqual(lesson10.right, 'images/right/0.png', 'lesson 10 right hand');

  for (const type of ['add-no-carry', 'add-carry', 'subtract-no-borrow', 'subtract-borrow']) {
    const problem = await page.evaluate(problemType => window.newPracticeProblem(problemType), type);
    const unitA = problem.a % 10;
    const unitB = problem.b % 10;
    const selectedButton = await page.evaluate(problemType => {
      const buttons = Array.from(document.querySelectorAll('[data-practice-type]'));
      const active = buttons.filter(button => button.classList.contains('is-selected'));
      return {
        activeTypes: active.map(button => button.dataset.practiceType),
        pressed: buttons.map(button => [button.dataset.practiceType, button.getAttribute('aria-pressed')]),
      };
    }, type);
    expectEqual(JSON.stringify(selectedButton.activeTypes), JSON.stringify([type]), `${type} selected button`);
    expectCondition(selectedButton.pressed.every(([buttonType, value]) => value === (buttonType === type ? 'true' : 'false')), `${type} aria pressed`);

    if (type === 'add-no-carry') {
      expectCondition(problem.operator === '+' && unitA + unitB <= 9, 'addition without carry');
    }
    if (type === 'add-carry') {
      expectCondition(problem.operator === '+' && unitA + unitB > 9, 'addition with carry');
    }
    if (type === 'subtract-no-borrow') {
      expectCondition(problem.operator === '-' && unitA >= unitB, 'subtraction without borrow');
    }
    if (type === 'subtract-borrow') {
      expectCondition(problem.operator === '-' && unitA < unitB, 'subtraction with borrow');
    }

    const revealed = await page.evaluate(() => window.revealPracticeAnswer());
    expectEqual(await page.locator('#numberInput').inputValue(), String(revealed.result), `${type} answer display`);
    expectCondition((await page.locator('#practiceAnswer').textContent()).includes(String(revealed.result)), `${type} answer text`);
  }

  await browser.close();

  if (errors.length) {
    throw new Error(`Browser errors:\n${errors.join('\n')}`);
  }
})();
