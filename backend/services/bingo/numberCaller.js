/**
 * Bingo number caller utilities.
 */
export const generateNumberPool = () => Array.from({ length: 75 }, (_, i) => i + 1);

export const getRemainingNumbers = (calledNumbers = []) => {
  const pool = generateNumberPool();
  return pool.filter((n) => !calledNumbers.includes(n));
};

export const drawNumber = (calledNumbers = []) => {
  const remaining = getRemainingNumbers(calledNumbers);
  if (remaining.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * remaining.length);
  return remaining[index];
};

export const isNumberCalled = (calledNumbers = [], number) =>
  calledNumbers.includes(number);
