const getBingoColumn = (number) => {
  if (number <= 15) return "B";
  if (number <= 30) return "I";
  if (number <= 45) return "N";
  if (number <= 60) return "G";
  return "O";
};

export const speakCalledNumber = (number) => {
  if (!Number.isInteger(number) || typeof window === "undefined") return;
  if (
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(
    `${getBingoColumn(number)} ${number}`,
  );
  utterance.lang = "am-ET";
  utterance.rate = 0.8;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
};
