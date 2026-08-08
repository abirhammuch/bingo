/**
 * Simple Telegram keyboard helpers for chat commands.
 */
export const mainMenuKeyboard = () => ({
  reply_markup: {
    keyboard: [
      [{ text: "Play Bingo" }, { text: "My Balance" }],
      [{ text: "Promo Code" }, { text: "Support" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
});

export const bingoMenuKeyboard = () => ({
  reply_markup: {
    keyboard: [
      [{ text: "Join Game" }, { text: "Create Game" }],
      [{ text: "View Card" }, { text: "Claim Bingo" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
});

export const buildInlineKeyboard = (buttons = []) => ({
  reply_markup: {
    inline_keyboard: buttons.map((row) => row.map((button) => ({ text: button.text, callback_data: button.callbackData }))),
  },
});
