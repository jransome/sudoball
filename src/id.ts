import { PeerId } from './types';

const animals = ['Dog', 'Deer', 'Koala', 'Penguin', 'Bear', 'Zebra', 'Wolf', 'Gazelle', 'Hedgehog', 'Raccoon', 'Giraffe', 'Puma', 'Gorilla', 'Otter', 'Squirrel', 'Cat', 'Hyena', 'Panda', 'Monkey', 'Elephant', 'Rabbit', 'Fox', 'Kangaroo', 'Llama', 'Turtle', 'Sloth'];
const adjectives = ['Loyal', 'Gentle', 'Debonair', 'Vivacious', 'Dulcet', 'Loving', 'Brave', 'Tiny', 'Silly', 'Pristine', 'Wondrous', 'Noble', 'Smart', 'Polite', 'Regal', 'Funny', 'Jocund', 'Friendly', 'Energetic', 'Quick', 'Loquacious', 'Helpful', 'Quaint', 'Zestful', 'Honest', 'Serene', 'Magnificent', 'Flirtatious', 'Resplendent', 'Happy', 'Witty', 'Wise', 'Radiant', 'Clever', 'Shy', 'Enchanting', 'Stately', 'Curious', 'Strong', 'Tall', 'Graceful', 'Flaxen', 'Sprightly', 'Playful', 'Melodic', 'Quiet', 'Halcyon', 'Dapper', 'Gallant', 'Nimble', 'Wistful', 'Venerable'];

const getRandomInt = (max: number) => Math.floor(Math.random() * max);
const getRandomEntry = (arr: string[]) => arr[getRandomInt(arr.length)];

export const generateReadableId = (): PeerId => getRandomEntry(adjectives) + getRandomEntry(animals) + getRandomInt(1000);
