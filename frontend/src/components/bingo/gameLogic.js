const COLUMN_RANGES = [
  { start: 1, end: 15 },
  { start: 16, end: 30 },
  { start: 31, end: 45 },
  { start: 46, end: 60 },
  { start: 61, end: 75 },
];

const shuffle = (values) => {
  const nextValues = [...values];

  for (let index = nextValues.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));

    [nextValues[index], nextValues[swapIndex]] = [
      nextValues[swapIndex],
      nextValues[index],
    ];
  }

  return nextValues;
};

export const createBingoCard = (selectedNumbers = []) => {
  const card = Array.from({ length: 5 }, () => Array(5).fill(null));

  const selectedSet = new Set(
    selectedNumbers.map(Number).filter((number) => number >= 1 && number <= 75),
  );

  /*
   * Generate normal BINGO columns.
   */
  COLUMN_RANGES.forEach((range, columnIndex) => {
    const numbers = Array.from(
      {
        length: range.end - range.start + 1,
      },
      (_, index) => range.start + index,
    );

    const values = shuffle(numbers).slice(0, 5);

    values.forEach((value, rowIndex) => {
      card[rowIndex][columnIndex] = {
        value,
        marked: false,
      };
    });
  });

  /*
   * Force selected lucky numbers onto card.
   */
  selectedSet.forEach((number) => {
    const columnIndex = Math.floor((number - 1) / 15);

    const existing = card.some((row) =>
      row.some((cell) => cell?.value === number),
    );

    if (existing) {
      return;
    }

    const possibleRows = [0, 1, 2, 3, 4].filter(
      (row) => !(row === 2 && columnIndex === 2),
    );

    const row = possibleRows[Math.floor(Math.random() * possibleRows.length)];

    card[row][columnIndex] = {
      value: number,
      marked: false,
    };
  });

  /*
   * FREE center.
   */
  card[2][2] = {
    value: "FREE",
    marked: true,
  };

  return card;
};

export const markNumberOnCard = (card, number) => {
  if (!card) {
    return card;
  }

  return card.map((row) =>
    row.map((cell) => {
      if (cell?.value === number) {
        return {
          ...cell,
          marked: true,
        };
      }

      return cell;
    }),
  );
};

export const hasBingo = (card) => {
  if (!Array.isArray(card) || card.length !== 5) {
    return false;
  }

  const isMarked = (cell) =>
    Boolean(cell && (cell.marked || cell.value === "FREE" || cell.value === 0));

  /*
   * Rows
   */
  for (let row = 0; row < 5; row++) {
    if (card[row].every(isMarked)) {
      return true;
    }
  }

  /*
   * Columns
   */
  for (let column = 0; column < 5; column++) {
    const values = card.map((row) => row[column]);

    if (values.every(isMarked)) {
      return true;
    }
  }

  /*
   * Diagonal \
   */
  const diagonalOne = card.map((row, index) => row[index]);

  if (diagonalOne.every(isMarked)) {
    return true;
  }

  /*
   * Diagonal /
   */
  const diagonalTwo = card.map((row, index) => row[4 - index]);

  return diagonalTwo.every(isMarked);
};

export const createNumberPool = () => {
  return shuffle(Array.from({ length: 75 }, (_, index) => index + 1));
};
