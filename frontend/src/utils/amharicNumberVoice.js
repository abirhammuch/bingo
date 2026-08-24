const getBingoColumn = (number) => {
  if (number <= 15) return "B";
  if (number <= 30) return "I";
  if (number <= 45) return "N";
  if (number <= 60) return "G";
  return "O";
};

const getNumberAudioPath = (number) =>
  number === 1
    ? "/audio/numbers/01.mp3.wav"
    : `/audio/numbers/${String(number).padStart(2, "0")}.mp3`;

const getLetterAudioPath = (number) =>
  `/audio/letters/${
    getBingoColumn(number) === "B" ? "B" : getBingoColumn(number).toLowerCase()
  }.mp3`;

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
  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 75 ||
    typeof window === "undefined"
  ) {
    return;
  }

  const numberAudio = new Audio(getNumberAudioPath(number));
  const letterAudio = new Audio(getLetterAudioPath(number));
  numberAudio.volume = 1;
  letterAudio.volume = 1;

  numberAudio.addEventListener("ended", () => {
    letterAudio.play().catch(() => speakWithBrowserVoice(number));
  });

  numberAudio.play().catch(() => speakWithBrowserVoice(number));
};
