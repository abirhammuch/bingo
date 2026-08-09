import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export const verifyTelegramInitData = (initData) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("Telegram bot token is not configured");
  }

  let params;
  if (typeof initData === "string") {
    params = Object.fromEntries(new URLSearchParams(initData));
  } else if (typeof initData === "object" && initData !== null) {
    params = initData;
  } else {
    throw new Error("Invalid Telegram initData format");
  }

  const hash = params.hash;
  if (!hash) {
    throw new Error("Telegram initData is missing hash");
  }

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const dataCheckString = Object.keys(params)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("\n");

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    throw new Error("Telegram initData verification failed");
  }

  return params;
};
