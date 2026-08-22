const getBingoColumn = (number) => {
  if (number <= 15) return "B";
  if (number <= 30) return "I";
  if (number <= 45) return "N";
  if (number <= 60) return "G";
  return "O";
};

const getAudioPath = (number) =>
  `/audio/amharic/${getBingoColumn(number)}-${number}.mp3`;

const speakWithBrowserVoice = (number) => {
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

export const speakCalledNumber = (number) => {
  if (!Number.isInteger(number) || typeof window === "undefined") return;

  const audio = new Audio(getAudioPath(number));
  audio.volume = 1;
  audio.play().catch(() => speakWithBrowserVoice(number));
};
