import { PeerId } from './types';

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const generateId = (): PeerId => Array
  .from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)])
  .join('');
