import { Input } from './types';

type InputKey = typeof INPUT_KEYS[number]
const INPUT_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'] as const;

const keyDownStates = {
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

export const getLocalInput = (): Input => ({
  x: (Number(keyDownStates.ArrowLeft) * -1) + Number(keyDownStates.ArrowRight),
  y: (Number(keyDownStates.ArrowUp) * -1) + Number(keyDownStates.ArrowDown),
  isKicking: keyDownStates.Space,
});
