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
  // If user is not present or not registered, prompt contact sharing
  // but do not block navigation — allow the app to open pages.
  if (!authUser || authUser.isRegistered === false) {
    promptTelegramShareContact();
    return true;
  }

  return true;
};
