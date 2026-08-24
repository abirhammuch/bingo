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

const announcementQueue = [];
let isPlayingAnnouncement = false;

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

  announcementQueue.push({ type: "number", number });
  playNextAnnouncement();
};

export const speakWinner = () => {
  if (typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    announcementQueue.push({ type: "winner", resolve });
    playNextAnnouncement();
  });
};

const playNextAnnouncement = () => {
  if (isPlayingAnnouncement || announcementQueue.length === 0) return;

  const announcement = announcementQueue.shift();
  isPlayingAnnouncement = true;

  if (announcement.type === "winner") {
    const winnerAudio = new Audio("/Bingo.mp3");
    winnerAudio.volume = 1;
    winnerAudio.addEventListener(
      "ended",
      () => finishAnnouncement(announcement.resolve),
      { once: true },
    );
    winnerAudio.play().catch(() => {
      speakBrowserWinner();
      finishAnnouncement(announcement.resolve);
    });
    return;
  }

  const numberAudio = new Audio(getNumberAudioPath(announcement.number));
  const letterAudio = new Audio(getLetterAudioPath(announcement.number));
  numberAudio.volume = 1;
  letterAudio.volume = 1;

  letterAudio.addEventListener(
    "ended",
    () => {
      numberAudio.addEventListener("ended", finishAnnouncement, { once: true });
      numberAudio.play().catch(() => {
        speakWithBrowserVoice(announcement.number);
        finishAnnouncement();
      });
    },
    { once: true },
  );

  letterAudio.play().catch(() => {
    numberAudio.addEventListener("ended", finishAnnouncement, { once: true });
    numberAudio.play().catch(() => {
      speakWithBrowserVoice(announcement.number);
      finishAnnouncement();
    });
  });
};

const finishAnnouncement = (onComplete) => {
  onComplete?.();
  isPlayingAnnouncement = false;
  playNextAnnouncement();
};

const speakBrowserWinner = () => {
  if (
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance("Bingo");
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
};
