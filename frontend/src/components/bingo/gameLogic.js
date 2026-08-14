const COLUMN_RANGES = [
  { start: 1, end: 15 },
  { start: 16, end: 30 },
  { start: 31, end: 45 },
  { start: 46, end: 60 },
  { start: 61, end: 75 },
  
];

const shuffle = (values) => {
  const nextValues = [...values];
  for (let index = nextValues.length - 1; index > 0; index -= 1) {
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
    selectedNumbers.filter((value) => value >= 1 && value <= 75),
  );

  const availablePositions = shuffle(
    card
      .flatMap((row, rowIndex) =>
        row.map((_, columnIndex) => [rowIndex, columnIndex]),
      )
      .filter(
        ([rowIndex, columnIndex]) => !(rowIndex === 2 && columnIndex === 2),
      ),
  );

  COLUMN_RANGES.forEach((range, columnIndex) => {
    const values = shuffle(
      Array.from(
        { length: range.end - range.start + 1 },
        (_, index) => range.start + index,
      ),
    ).slice(0, 5);

    values.forEach((value, rowIndex) => {
      card[rowIndex][columnIndex] = { value, marked: false };
    });
  });

  selectedSet.forEach((value) => {
    if (value === 0) {
      return;
    }

    const alreadyPresent = card.some((row) =>
      row.some((cell) => cell?.value === value),
    );
    if (alreadyPresent) {
      return;
    }

    const nextPosition = availablePositions.pop();
    if (!nextPosition) {
      return;
    }

    const [rowIndex, columnIndex] = nextPosition;
    card[rowIndex][columnIndex] = { value, marked: false };
  });

  card[2][2] = { value: "FREE", marked: true };

  return card;
};

export const markNumberOnCard = (card, number) => {
  if (!card) {
    return card;
  }

  return card.map((row) =>
    row.map((cell) => {
      if (cell?.value === number) {
        return { ...cell, marked: true };
      }

      return cell;
    }),
  );
};

export const hasBingo = (card) => {
  if (!card || !Array.isArray(card) || card.length !== 5) {
    return false;
  }

  const isMarked = (cell) =>
    Boolean(cell && (cell.marked || cell.value === "FREE" || cell.value === 0));

  const hasLine = (line) =>
    Array.isArray(line) && line.length === 5 && line.every(isMarked);

  const rows = card.some((row) => hasLine(row));
  if (rows) return true;

  const columns = Array.from({ length: 5 }, (_, columnIndex) =>
    hasLine(card.map((row) => row[columnIndex])),
  ).some(Boolean);
  if (columns) return true;

  const diagonalOne = hasLine(card.map((row, index) => row[index]));
  if (diagonalOne) return true;

  const diagonalTwo = hasLine(card.map((row, index) => row[4 - index]));
  return diagonalTwo;
};

export const createNumberPool = () =>
  shuffle(Array.from({ length: 75 }, (_, index) => index + 1));
