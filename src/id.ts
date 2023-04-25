import { PeerId } from './types';

const animals = ['Dog', 'Donkey', 'Koala', 'Penguin', 'Bear', 'Zebra', 'Wolf', 'Gazelle', 'Hedgehog', 'Raccoon', 'Giraffe', 'Puma', 'Gorilla', 'Otter', 'Squirrel', 'Cat', 'Hyena', 'Panda', 'Monkey', 'Elephant', 'Rabbit', 'Fox', 'Kangaroo', 'Llama', 'Turtle', 'Sloth'];
const adjectives = ['Loyal', 'Crazy', 'Debonair', 'Vivacious', 'Dulcet', 'Loving', 'Brave', 'Thicc', 'Silly', 'Grumpy', 'Cranky', 'Noble', 'Smart', 'Polite', 'Regal', 'Funny', 'Jocund', 'Lolz', 'Insatiable', 'Clingy', 'Loquacious', 'Annoying', 'Quaint', 'Zestful', 'Drunk', 'Plastered', 'Magnificent', 'Flirtatious', 'Resplendent', 'Trollied', 'Witty', 'Wise', 'Presidential', 'Cunning', 'Shy', 'Enchanting', 'Stately', 'Curious', 'Strong', 'Tall', 'Graceful', 'Chatterbox', 'Sprightly', 'Playful', 'Melodic', 'Booming', 'Fat', 'Dapper', 'Gallant', 'Nimble', 'Wistful', 'Venerable'];

const getRandomInt = (max: number) => Math.floor(Math.random() * max);
const getRandomEntry = (arr: string[]) => arr[getRandomInt(arr.length)];

export const generateReadableId = (): PeerId => getRandomEntry(adjectives) + getRandomEntry(animals) + getRandomInt(1000);
