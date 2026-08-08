/**
 * Bingo winner checker utilities.
 */
export const isBingoLine = (cells = [], markedSet) =>
  cells.every((value) => value === 0 || markedSet.has(value));

export const hasBingo = (card = [], markedNumbers = []) => {
  const markedSet = new Set(markedNumbers);

  for (let row = 0; row < 5; row += 1) {
    if (isBingoLine(card[row], markedSet)) {
      return true;
    }
  }

  for (let col = 0; col < 5; col += 1) {
    const column = card.map((row) => row[col]);
    if (isBingoLine(column, markedSet)) {
      return true;
    }
  }

  const diagonal1 = [0, 1, 2, 3, 4].map((index) => card[index][index]);
  if (isBingoLine(diagonal1, markedSet)) {
    return true;
  }

  const diagonal2 = [0, 1, 2, 3, 4].map((index) => card[index][4 - index]);
  if (isBingoLine(diagonal2, markedSet)) {
    return true;
  }

  return false;
};

export const getWinningPatterns = (card = [], markedNumbers = []) => {
  const markedSet = new Set(markedNumbers);
  const patterns = [];

  for (let row = 0; row < 5; row += 1) {
    const line = card[row];
    if (isBingoLine(line, markedSet)) {
      patterns.push({ type: "row", index: row, cells: line });
    }
  }

  for (let col = 0; col < 5; col += 1) {
    const column = card.map((row) => row[col]);
    if (isBingoLine(column, markedSet)) {
      patterns.push({ type: "column", index: col, cells: column });
    }
  }

  const diagonal1 = [0, 1, 2, 3, 4].map((index) => card[index][index]);
  if (isBingoLine(diagonal1, markedSet)) {
    patterns.push({ type: "diagonal", direction: "top-left to bottom-right", cells: diagonal1 });
  }

  const diagonal2 = [0, 1, 2, 3, 4].map((index) => card[index][4 - index]);
  if (isBingoLine(diagonal2, markedSet)) {
    patterns.push({ type: "diagonal", direction: "top-right to bottom-left", cells: diagonal2 });
  }

  return patterns;
};
