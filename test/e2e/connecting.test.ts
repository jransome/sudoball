import puppeteer, { Browser, KeyInput, Page } from 'puppeteer';

const url = 'http://localhost:5173';
// const url = 'https://jransome.github.io/sudoball/';

const browserSpacing = { x: 640, y: 540 };
const browserSize = [650, 600];
const browsers = [
  { size: browserSize, position: [browserSpacing.x * 0, -100] },
  { size: browserSize, position: [browserSpacing.x * 1, -100] },
  { size: browserSize, position: [browserSpacing.x * 2, -100] },

  { size: browserSize, position: [browserSpacing.x * 0, browserSpacing.y - 50] },
  { size: browserSize, position: [browserSpacing.x * 1, browserSpacing.y - 50] },
  { size: browserSize, position: [browserSpacing.x * 2, browserSpacing.y - 50] },
];

const movementInputKeys: KeyInput[] = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
];

const waitForMs = (ms: number) => new Promise(res => setTimeout(res, ms));
const getRandomInt = (max: number) => Math.floor(Math.random() * max);
const pressRandomMovementKey = (page: Page, durationMs: number) => pressInput(page, movementInputKeys[getRandomInt(movementInputKeys.length)], durationMs);
const pressInput = async (page: Page, keyName: KeyInput, durationMs: number) => {
  await page.keyboard.down(keyName);
  await waitForMs(durationMs);
  await page.keyboard.up(keyName);
};

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

    const [host, ...clients] = await Promise.all(browserInstances.map(async b => b.newPage()));

    await host.goto(url);
    await host.focus('#player-name');
    await host.keyboard.type('dohkerm');
    await host.click('#create-game');
    const joinLink: string = await host.$('#invite-link')
      .then(el => el!.getProperty('innerText'))
      .then(el => el!.jsonValue() as unknown as string);

    await Promise.all(clients.map(async (client, i) => {
      await client.goto(joinLink);
      await client.focus('#player-name');
      await client.keyboard.type('dohkerm' + i);
      await client.click('#join-game');
      await waitForMs(500);
    }));

    await Promise.all([host, ...clients].map(async (player, i) => {
      await Promise.all([
        player.waitForSelector('#join-red'),
        player.waitForSelector('#join-blue'),
      ]);
      await player.click(i % 2 === 0 ? '#join-red' : '#join-blue');
    }));

    await host.click('#start-game');
    await waitForMs(3000); // wait for kickoff countdown

    await Promise.all([host, ...clients].map(async (player, i) => {
      const isRedTeam = i % 2 === 0;

      let lastKick = Promise.resolve();
      const kickInterval = setInterval(() => {
        lastKick = pressInput(player, 'Space', 250);
      }, 500);

      if (isRedTeam) {
        await pressInput(player, 'ArrowUp', 1000); // move red out the way so blue can score
      } else {
        await pressInput(player, 'ArrowLeft', 2000);
      }
      
      await Promise.all([
        pressRandomMovementKey(player, getRandomInt(15000)),
        pressRandomMovementKey(player, getRandomInt(15000)),
        pressRandomMovementKey(player, getRandomInt(15000)),
        pressRandomMovementKey(player, getRandomInt(15000)),
        pressRandomMovementKey(player, getRandomInt(15000)),
        pressRandomMovementKey(player, getRandomInt(15000)),
      ]);

      clearInterval(kickInterval);
      await lastKick;
    }));
  });
});
