const getTelegramAccountId = () => {
  const telegramUser = window?.Telegram?.WebApp?.initDataUnsafe?.user;
  return telegramUser?.id ? String(telegramUser.id) : "";
};

export const getAuthStorageKey = (key) => {
  const telegramAccountId = getTelegramAccountId();
  return telegramAccountId ? `${key}:${telegramAccountId}` : key;
};
