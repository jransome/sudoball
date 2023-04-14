const received: Record<string, { highest: number; missing: Set<number>; }> = {};

setInterval(() => {
  console.log(received);
}, 10000);

export const receive = (id: string, receivedNumber: number) => {
  if (!received[id]) received[id] = { highest: -1, missing: new Set() };
  const { highest, missing } = received[id];

  if (receivedNumber === highest + 1) {
    received[id].highest = receivedNumber;
    return;
  }

  if (receivedNumber > highest + 1) {
    // missed one or more
    const missingNumbers = [...Array(receivedNumber - (highest + 1)).keys()].map(i => i + (highest + 1));
    console.error('missed', missingNumbers);
    missingNumbers.forEach(n => missing.add(n));
    received[id].highest = receivedNumber;
  }

  if (receivedNumber < highest) {
    // catchup
    missing.delete(receivedNumber);
    console.info('got late update', {
      receivedNumber, missing, stillMissing: missing.size,
    });
  }

  if (receivedNumber === highest) {
    console.error('received duplicate', id, receivedNumber);
  }
};
