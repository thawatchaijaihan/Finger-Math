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
    lesson5: Boolean(document.querySelector('#lesson5')),
    lesson10: Boolean(document.querySelector('#lesson10')),
    hundredsHidden: getComputedStyle(document.querySelector('#hundredsUnit')).display === 'none',
    background: getComputedStyle(document.querySelector('#hundredsBox')).backgroundImage,
  }));
  expectEqual(initial.steps, false, 'steps panel is removed');
  expectEqual(initial.practice, true, 'practice section exists');
  expectEqual(initial.lesson5, false, 'lesson 5 section is removed');
  expectEqual(initial.lesson10, false, 'lesson 10 section is removed');
  expectEqual(initial.hundredsHidden, true, 'hundreds starts hidden');
  expectEqual(JSON.stringify(initial.navLinks.slice(0, 3)), JSON.stringify([
    { text: 'การนับเลข', href: '#display' },
    { text: 'แบบฝึก', href: '#practice' },
    { text: 'ติดต่อแอดมิน', href: '#' },
  ]), 'navbar links');
  expectEqual(initial.background, 'none', 'hundreds box uses local CSS');

  const speechDebug = await page.evaluate(() => ({
    exists: Boolean(window.speechDebug),
    oldHelper: Boolean(window['au' + 'dioDebug']),
    problem13Plus21: window.speechDebug.problem(13, '+', 21),
    units3Plus1: window.speechDebug.units(3, '+', 1),
    tens1Plus2: window.speechDebug.tens(1, '+', 2),
    answer34: window.speechDebug.answer(34),
    number999: window.speechDebug.number(999),
    allNumbersOk: Array.from({ length: 1000 }, (_, number) => window.speechDebug.number(number))
      .every(entry => entry.ok),
  }));
  expectEqual(speechDebug.exists, true, 'speech debug helper exists');
  expectEqual(speechDebug.oldHelper, false, 'legacy debug helper is removed');
  expectEqual(speechDebug.problem13Plus21.text, 'สิบสาม บวก ยี่สิบเอ็ด', 'speech debug 13 + 21 phrase');
  expectEqual(speechDebug.problem13Plus21.ok, true, 'speech debug 13 + 21 is valid');
  expectEqual(speechDebug.units3Plus1.text, 'หลักหน่วย สาม บวก หนึ่ง', 'speech debug units phrase');
  expectEqual(speechDebug.tens1Plus2.text, 'หลักสิบ หนึ่ง บวก สอง', 'speech debug tens phrase');
  expectEqual(speechDebug.answer34.text, 'ตอบ สามสิบสี่', 'speech debug answer phrase');
  expectEqual(speechDebug.number999.text, 'เก้าร้อยเก้าสิบเก้า', 'speech debug 999 phrase');
  expectEqual(speechDebug.allNumbersOk, true, 'speech debug all 0-999 phrases exist');

  const strictSpeechOrder = await page.evaluate(async () => {
    const events = [];
    const originalSpeak = window.speechSynthesis.speak;
    const originalCancel = window.speechSynthesis.cancel;

    window.speechSynthesis.cancel = () => {};
    window.speechSynthesis.speak = utterance => {
      events.push(`speak:${utterance.text}`);
      setTimeout(() => {
        events.push(`end:${utterance.text}`);
        utterance.onend?.(new Event('end'));
      }, 0);
    };

    try {
      await window.speakProblem(13, '+', 21);
    } finally {
      window.speechSynthesis.speak = originalSpeak;
      window.speechSynthesis.cancel = originalCancel;
    }

    return events;
  });
  expectEqual(JSON.stringify(strictSpeechOrder), JSON.stringify([
    'speak:สิบสาม บวก ยี่สิบเอ็ด',
    'end:สิบสาม บวก ยี่สิบเอ็ด',
  ]), 'speech playback waits for utterance end');

  await page.evaluate(() => window.toggleSound());

  await page.getByRole('link', { name: 'แบบฝึก' }).click();
  await page.waitForTimeout(50);
  const practiceScroll = await page.evaluate(() => {
    const navBottom = document.querySelector('.navbar').getBoundingClientRect().bottom;
    const practiceTop = document.querySelector('#practice').getBoundingClientRect().top;
    return { navBottom, practiceTop };
  });
  expectCondition(practiceScroll.practiceTop >= practiceScroll.navBottom, 'practice link clears sticky nav');

  await page.locator('#numberInput').fill('27');
  await page.locator('#numberInput').press('Tab');
  await page.waitForTimeout(50);

  const after27 = await page.evaluate(() => ({
    number: document.querySelector('#numberInput').value,
    hundreds: document.querySelector('#hundredsDisplay').textContent,
    hundredsHidden: getComputedStyle(document.querySelector('#hundredsUnit')).display === 'none',
    left: document.querySelector('#leftHandImage').getAttribute('src'),
    right: document.querySelector('#rightHandImage').getAttribute('src'),
  }));
  expectEqual(after27.number, '27', 'number input');
  expectEqual(after27.hundreds, '0', 'hundreds display');
  expectEqual(after27.hundredsHidden, true, 'hundreds stays hidden under 100');
  expectEqual(after27.left, 'images/left/20.png', 'left hand');
  expectEqual(after27.right, 'images/right/7.png', 'right hand');

  await page.locator('#numberInput').fill('123');
  await page.locator('#numberInput').press('Tab');
  await page.waitForTimeout(50);
  const after123 = await page.evaluate(() => ({
    hundreds: document.querySelector('#hundredsDisplay').textContent,
    hundredsHidden: getComputedStyle(document.querySelector('#hundredsUnit')).display === 'none',
    hundredsInNumberHero: document.querySelector('#hundredsUnit').parentElement.id === 'input',
    hundredsRight: document.querySelector('#hundredsUnit').getBoundingClientRect().right,
    numberLeft: document.querySelector('.number-entry').getBoundingClientRect().left,
  }));
  expectEqual(after123.hundreds, '100', 'hundreds display over 99');
  expectEqual(after123.hundredsHidden, false, 'hundreds appears over 99');
  expectEqual(after123.hundredsInNumberHero, true, 'hundreds is beside number input');
  expectCondition(after123.hundredsRight <= after123.numberLeft, 'hundreds sits left of number input');

  await page.locator('#numberInput').fill('999');
  await page.locator('#numberInput').press('Tab');
  await page.locator('#addInput').fill('1');
  await page.getByRole('button', { name: '+ บวก' }).click();
  await page.waitForTimeout(50);
  expectEqual(await page.locator('#numberInput').inputValue(), '999', 'addition clamps at 999');

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
