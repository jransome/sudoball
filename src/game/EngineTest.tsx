import { detailedDiff, diff } from 'deep-object-diff';
import { Team } from '../config';
import { PredictiveGameEngine } from './PredictiveGameEngine';
import { InitPlayer, Input, RenderableGameState } from '../types';

export const EngineTest = () => <button onClick={() => runTest()}>run test</button>;

const waitForMs = (ms: number) => new Promise(res => setTimeout(res, ms));

type EngineState = RenderableGameState & {
  tickIndex: number;
};
const msPerFrame = 2;

const runTest = async () => {
  const moveFor = (vector, id: string, timeMs: number) => new Promise<void>(res => {
    inputs[id].movement = vector;
    setTimeout(() => {
      inputs[id].movement = { x: 0, y: 0 };
      res();
    }, timeMs);
  });

  const p0History: EngineState[] = [];
  const p1History: EngineState[] = [];

  const inputs: Record<string, Input> = {
    p0: { movement: { x: 0, y: 0 }, kick: false },
    p1: { movement: { x: 0, y: 0 }, kick: false },
  };
  const getInput = (playerId: string) => () => structuredClone(inputs[playerId]);

  const initPlayers: InitPlayer[] = [
    { peerId: 'p0', name: 'p0', team: Team.Blue },
    { peerId: 'p1', name: 'p1', team: Team.Red },
  ];

  const [p0, p1] = [
    new PredictiveGameEngine({ localPlayerId: 'p0', msPerFrame, pollLocalInput: getInput('p0') }),
    new PredictiveGameEngine({ localPlayerId: 'p1', msPerFrame, pollLocalInput: getInput('p1') }),
  ];

  const compare = (msg: string) => {
    console.log('Comparison:', msg);
    const lastCommon = Math.min(p0History.length, p1History.length) - 1;

    console.table({
      historyLengths: [p0History.length, p1History.length],
      ...['p0', 'p1'].reduce((acc, id) => {
        const positions = [p0History, p1History].map(h => JSON.stringify(h[lastCommon].players.find(p => p.id === id)?.position));
        return {
          ...acc,
          [id]: [...positions, positions.every(p => p === positions[0])],
        };
      }, {}),
    });

    console.table({
      ticks: [p0, p1].map(p => p.stats.ticks),
      throttles: [p0, p1].map(p => p.stats.throttles),
      replays: [p0, p1].map(p => p.stats.replays),
    });
    console.log('==='.repeat(40));
  };

  const p0IncomingMessageBuffer = [];
  const p1IncomingMessageBuffer = [];

  p0.on('update', (localInputSnapshot, renderableState) => {
    p0History.push({ tickIndex: localInputSnapshot.i, ...renderableState });
    p1IncomingMessageBuffer.push(() => p1.reconcileInputUpdate({ id: 'p0', ...localInputSnapshot }));
  });

  p1.on('update', (localInputSnapshot, renderableState) => {
    p1History.push({ tickIndex: localInputSnapshot.i, ...renderableState });
    p0IncomingMessageBuffer.push(() => p0.reconcileInputUpdate({ id: 'p1', ...localInputSnapshot }));
  });

  p0.start(initPlayers);
  p1.start(initPlayers);

  let p0IncomingLatency = 1;
  const sendToP0 = () => {
    const next = p0IncomingMessageBuffer.shift();
    next && next();
    setTimeout(sendToP0, p0IncomingLatency);
  };
  sendToP0();

  let p1IncomingLatency = 1;
  const sendToP1 = () => {
    const next = p1IncomingMessageBuffer.shift();
    next && next();
    setTimeout(sendToP1, p1IncomingLatency);
  };
  sendToP1();

  await waitForMs(200);
  compare('after idle');

  await moveFor({ x: 1, y: 0 }, 'p1', 10);
  compare('after p1 move x');

  moveFor({ x: 1, y: 0 }, 'p0', 10);
  // compare('after p0 move x');

  // p0IncomingLatency = 100;
  moveFor({ x: -1, y: 1 }, 'p1', 10);
  // compare('after p1 move x');
  // p0IncomingLatency = 1;

  await waitForMs(1000);
  compare('after idle');

  p0.shutdown();
  p1.shutdown();
  console.log('test complete');
};

// runTest();
