import puppeteer, { Browser } from 'puppeteer';

const url = 'http://localhost:5173';
// const url = 'https://jransome.github.io/sudoball/';

const browsers = [
  // these position args don't really work properly but it works for now
  { size: [1200, 800], position: [0, 0, 0] }, // for some reason a 3rd number forces it to open on the second monitor, but only when you're on that screen
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
  { size: [400, 300], position: [0, 0] },
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

    const [host, ...clients] = await Promise.all(browserInstances.map(async (b) => {
      const page = await b.newPage();
      await page.goto(url);
      return page;
    }));

    await host.click('#create-game');
    const hostId = await host.$eval('#host-id', input => input.getAttribute('value')) as string;
    await waitForMs(2000);

    await Promise.all(clients.map(async (client) => {
      await client.focus('#host-id');
      await client.keyboard.type(hostId);
      await client.click('#join-game');
    }));

    await waitForMs(15000);

    await [host, ...clients].reduce((acc, player) => {
      acc = acc.then(async () => {
        await player.keyboard.down('ArrowRight');
        await waitForMs(1000);
        await player.keyboard.up('ArrowRight');
      });
      return acc;
    }, Promise.resolve());
    
    await waitForMs(10000);
  });
});
