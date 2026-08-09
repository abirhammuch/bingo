export const setupCommands = async (bot) => {
  try {
    await bot.telegram.setMyCommands([
      { command: "start", description: "Begin registration or login" },
      { command: "login", description: "Start the login flow" },
      { command: "help", description: "Get help with the bot" },
    ]);
    console.log("Telegram commands configured successfully.");
  } catch (error) {
    console.error("Failed to configure Telegram commands:", error);
  }
};
