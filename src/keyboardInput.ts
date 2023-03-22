import { Vector2 } from './types';

const MOVEMENT_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const FIRE_KEY = 'Space';

const keyDownStates = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
};

document.addEventListener('keydown', (event) => {
  if (![...MOVEMENT_KEYS, FIRE_KEY].includes(event.key)) return;

  event.preventDefault();
  if (event.key === FIRE_KEY) {
    // do something
    return;
  }

  keyDownStates[event.key] = true;
});

document.addEventListener('keyup', (event) => {
  if (!MOVEMENT_KEYS.includes(event.key)) return;

  event.preventDefault();
  keyDownStates[event.key] = false;
});

export const getPlayerInput = (): Vector2 => ({
  x: (Number(keyDownStates.ArrowLeft) * -1) + Number(keyDownStates.ArrowRight),
  y: (Number(keyDownStates.ArrowUp) * -1) + Number(keyDownStates.ArrowDown),
});
