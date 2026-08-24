export const setupCommands = async (bot) => {
  try {
    await bot.telegram.setMyCommands([
      { command: "start", description: "Restart the bot" },
      { command: "login", description: "Start the login flow" },
      { command: "help", description: "Get help with the bot" },
    ]);
    await bot.telegram.setChatMenuButton({
      menu_button: { type: "commands" },
    });
    console.log("Telegram commands configured successfully.");
  } catch (error) {
    console.error("Failed to configure Telegram commands:", error);
  }
};
