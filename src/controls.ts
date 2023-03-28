import { Vector2 } from './types';

type MovementKey = typeof MOVEMENT_KEYS[number]

const MOVEMENT_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const;
const FIRE_KEY = 'Space';

const keyDownStates = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
};

document.addEventListener('keydown', (event) => {
  if (![...MOVEMENT_KEYS, FIRE_KEY].includes(event.key)) {
    return;
  }

  event.preventDefault();
  if (event.key === FIRE_KEY) {
    // do something
    return;
  }

  keyDownStates[event.key as MovementKey] = true;
});

document.addEventListener('keyup', (event) => {
  if (!MOVEMENT_KEYS.includes(event.key as MovementKey)) {
    return;
  }

  event.preventDefault();
  keyDownStates[event.key as MovementKey] = false;
});

export const getLocalMovementInput = (): Vector2 => ({
  x: (Number(keyDownStates.ArrowLeft) * -1) + Number(keyDownStates.ArrowRight),
  y: (Number(keyDownStates.ArrowUp) * -1) + Number(keyDownStates.ArrowDown),
});
