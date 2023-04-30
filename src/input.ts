import { Input } from './types';

type InputKey = typeof INPUT_KEYS[number]
const INPUT_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'] as const;

const keyDownStates: Record<InputKey, boolean> = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  Space: false,
};

document.addEventListener('keydown', (event) => {
  if (!INPUT_KEYS.includes(event.code as InputKey)) return;
  event.preventDefault();
  keyDownStates[event.code as InputKey] = true;
});

document.addEventListener('keyup', (event) => {
  if (!INPUT_KEYS.includes(event.code as InputKey)) return;
  event.preventDefault();
  keyDownStates[event.code as InputKey] = false;
});

export const getLocalInput = (): Input => [
  (Number(keyDownStates.ArrowLeft) * -1) + Number(keyDownStates.ArrowRight),
  (Number(keyDownStates.ArrowUp) * -1) + Number(keyDownStates.ArrowDown),
  keyDownStates.Space,
];

export const getNullInput = (): Input => [
  0,
  0,
  false,
];
