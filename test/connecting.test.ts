import puppeteer, { Browser } from 'puppeteer';

const localhost = 'http://localhost:5174';
const browsers = [
  // these position args don't really work properly but it works for now
  { size: [1200, 800], position: [0, 0, 0] }, // for some reason a 3rd number forces it to open on the second monitor, but only when you're on that screen
  { size: [900, 700], position: [1920, 800] },
  { size: [900, 700], position: [0, 0] },
];

const waitForMs = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('Connecting multiple players', () => {
  let browserInstances: Browser[] = [];

  afterEach(async () => {
    await Promise.all(browserInstances.map(b => b.close()));
  });

  it('multiple players can join', async () => {
    browserInstances = await Promise.all(
      browsers.map(b => puppeteer.launch({
        headless: false,
        // slowMo: 20,
        args: [
          `--window-size=${b.size.join(',')}`,
          `--window-position=${b.position.join(',')}`,
        ],
      })),
    );

    const [player1, player2, player3] = await Promise.all(browserInstances.map(async (b) => {
      const page = await b.newPage();
      await page.goto(localhost);
      return page;
    }));

    await player1.click('#create-game');
    const hostId = await player1.$eval('#host-id', input => input.getAttribute('value')) as string;
    await waitForMs(2000);

    await player2.focus('#host-id');
    await player2.keyboard.type(hostId);
    await player2.click('#join-game');

    await player3.focus('#host-id');
    await player3.keyboard.type(hostId);
    await player3.click('#join-game');

    await waitForMs(15000);

    await player1.keyboard.down('ArrowRight');
    await waitForMs(1000);
    await player1.keyboard.up('ArrowRight');

    await player2.keyboard.down('ArrowRight');
    await waitForMs(1000);
    await player2.keyboard.up('ArrowRight');

    await player3.keyboard.down('ArrowRight');
    await waitForMs(1000);
    await player3.keyboard.up('ArrowRight');
    
    await waitForMs(10000);
  });
});
