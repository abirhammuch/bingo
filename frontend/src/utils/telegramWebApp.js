export const promptTelegramShareContact = () => {
  const webApp = window?.Telegram?.WebApp;
  if (!webApp || typeof webApp.sendData !== "function") {
    return false;
  }

  try {
    webApp.sendData(
      JSON.stringify({
        type: "share_contact_prompt",
        message:
          "Please share your contact with the Marshal Game bot to complete registration.",
      }),
    );
    return true;
  } catch (error) {
    console.error(
      "Failed to send share contact prompt to Telegram bot:",
      error,
    );
    return false;
  }
};

export const ensureTelegramRegistration = (authUser) => {
  if (!authUser) {
    promptTelegramShareContact();
    return false;
  }

  if (authUser.isRegistered === false) {
    promptTelegramShareContact();
    return false;
  }

  return true;
};
