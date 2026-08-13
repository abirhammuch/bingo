import crypto from "crypto";


export const verifyTelegramInitData = (initData) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error(
      "❌ [TELEGRAM AUTH] Bot token is NOT configured in environment variables",
    );
    throw new Error("Telegram bot token is not configured");
  }

  console.log(
    "🔍 [TELEGRAM AUTH] Verifying initData with token length:",
    botToken.length,
  );

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
    console.error("❌ [TELEGRAM AUTH] No hash found in initData");
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

  console.log("🔍 [TELEGRAM AUTH] Hash comparison:", {
    receivedHash: hash.substring(0, 16) + "...",
    computedHash: computedHash.substring(0, 16) + "...",
    match: computedHash === hash,
  });

  if (computedHash !== hash) {
    console.error("❌ [TELEGRAM AUTH] Hash mismatch - verification failed");
    console.error("   This means either:");
    console.error("   1. TELEGRAM_BOT_TOKEN on Render is WRONG");
    console.error("   2. Or the initData was modified during transmission");
    throw new Error("Telegram initData verification failed");
  }

  console.log(
    "✅ [TELEGRAM AUTH] Verification successful for user:",
    params.id,
  );
  return params;
};
