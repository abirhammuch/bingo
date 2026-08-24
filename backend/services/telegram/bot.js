import dotenv from "dotenv";
import { Telegraf, Markup } from "telegraf";
import User from "../../models/User.js";
import { creditRegistrationBonus } from "../wallet/bonusService.js";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_LAUNCH_DISABLED =
  String(process.env.TELEGRAM_BOT_LAUNCH_DISABLED || "")
    .trim()
    .toLowerCase() === "true";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN || "");
const getReferralCode = (telegramId) =>
  `REF${String(telegramId).slice(-8).toUpperCase()}`;

const findReferrer = async (value, telegramId) => {
  const code = String(value || "")
    .replace(/^ref_/i, "")
    .trim()
    .toUpperCase();
  if (!code) return null;
  const direct = await User.findOne({ referralCode: code });
  if (direct && String(direct.telegramId) !== String(telegramId)) return direct;
  if (!code.startsWith("REF")) return null;
  return User.findOne({
    telegramId: { $regex: `${code.slice(3)}$`, $ne: String(telegramId) },
  });
};
const telegramTokenLooksValid =
  !!TELEGRAM_BOT_TOKEN &&
  /^\d+:[A-Za-z0-9_-]+$/.test(String(TELEGRAM_BOT_TOKEN).trim());

if (!TELEGRAM_BOT_TOKEN) {
  console.warn(
    "⚠️ TELEGRAM_BOT_TOKEN is not set. Bot commands will not start.",
  );
} else if (!telegramTokenLooksValid) {
  console.warn(
    "⚠️ TELEGRAM_BOT_TOKEN is present but not in the expected Telegram format. Bot startup will likely fail.",
  );
}

const rawWebAppUrl =
  process.env.TELEGRAM_WEBAPP_URL ||
  process.env.FRONTEND_URL ||
  "https://bingo-zeta-livid.vercel.app";
const telegramWebAppBaseUrl = rawWebAppUrl
  .replace(/\/login\/?$/, "")
  .replace(/\/$/, "");
const telegramWebAppUrl = telegramWebAppBaseUrl;
const telegramDepositUrl = `${telegramWebAppBaseUrl}/deposit`;
const telegramWithdrawUrl = `${telegramWebAppBaseUrl}/withdraw`;
const telegramBotUsername =
  process.env.TELEGRAM_BOT_USERNAME || "casinabingo_bot";
const telegramSupportUrl =
  process.env.TELEGRAM_SUPPORT_URL || "https://t.me/casina_bingo_support";

const accountKeyboard = () =>
  Markup.keyboard([
    ["🎮 Play Game", "🔗 Referral Link"],
    ["👤 My Profile", "💰 Wallet"],
    ["💳 Deposit", "🏦 Withdraw"],
    ["🆘 Support"],
  ])
    .resize()
    .persistent();

const getReferralLink = (user) =>
  `https://t.me/${telegramBotUsername}?start=ref_${user.referralCode || getReferralCode(user.telegramId)}`;

const openGameKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.webApp("🎮 Open Casina Bingo", telegramWebAppUrl)],
  ]);

const launchBot = async () => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn(
      "⚠️ Telegram bot startup skipped because no token is configured.",
    );
    return false;
  }

  if (!telegramTokenLooksValid) {
    console.warn(
      "⚠️ Telegram bot startup skipped because the token format is invalid.",
    );
    return false;
  }

  if (TELEGRAM_BOT_LAUNCH_DISABLED) {
    console.warn(
      "⚠️ Telegram bot startup disabled via TELEGRAM_BOT_LAUNCH_DISABLED=true",
    );
    return false;
  }

  if (globalThis.__telegramBotStarted) {
    console.warn("⚠️ Telegram bot startup already attempted in this process.");
    return false;
  }

  globalThis.__telegramBotStarted = true;

  try {
    await bot.launch({ dropPendingUpdates: true });
    const botInfo = await bot.telegram.getMe();
    console.log("🤖 Telegram bot is running as @" + botInfo.username);
    return true;
  } catch (error) {
    console.error("Telegram bot failed to launch:", error.message || error);
    return false;
  }
};

const registrationKeyboard = () =>
  Markup.keyboard([
    [Markup.button.contactRequest("📱 Share Phone Number")],
    ["🔑 Login"],
  ])
    .resize()
    .oneTime();

const needsPhoneRegistration = (user) => {
  return !user?.phoneNumber || !user?.isRegistered;
};

const sendLoginPrompt = async (ctx, user) => {
  const message =
    user && needsPhoneRegistration(user)
      ? "Your account is created but not fully registered yet. Please share your phone number or use Login once complete."
      : "Welcome back! Use the button below to login to Casina Bingo.";

  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎮 Open Game", web_app: { url: telegramWebAppUrl } }],
      ],
    },
  });

  await ctx.reply("You can also use the buttons below.", accountKeyboard());
};

bot.command("login", async (ctx) => {
  try {
    const telegramUser = ctx.from;
    const telegramId = telegramUser.id.toString();
    const user = await User.findOne({ telegramId });

    if (!user) {
      await ctx.reply(
        "No Telegram account found. Please start the bot with /start.",
        registrationKeyboard(),
      );
      return;
    }

    if (needsPhoneRegistration(user)) {
      await ctx.reply(
        "Your account is not fully registered yet. Please share your phone number first.",
        registrationKeyboard(),
      );
      return;
    }

    await sendLoginPrompt(ctx, user);
  } catch (error) {
    console.error("Telegram /login error:", error);
    await ctx.reply("❌ Something went wrong. Please try again.");
  }
});

bot.hears(/🔑 Login|Login/i, async (ctx) => {
  await ctx.reply("Processing your login request...");
  return bot.handleUpdate({
    message: { text: "/login", chat: ctx.chat, from: ctx.from },
  });
});

bot.hears("👤 My Profile", async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ telegramId });

    if (!user) {
      return ctx.reply("Please start the bot first with /start.");
    }

    if (needsPhoneRegistration(user)) {
      return ctx.reply(
        "Please share your phone number to complete registration before viewing your profile.",
        registrationKeyboard(),
      );
    }

    await ctx.reply(
      `👤 Profile\n` +
        `Name: ${user.firstName} ${user.lastName}\n` +
        `Username: ${user.username ? `@${user.username}` : "(none)"}\n` +
        `Phone: ${user.phoneNumber || "Not shared"}\n` +
        `Balance: ${Number(user.balance ?? 0).toFixed(2)} ETB\n` +
        `Referrals: ${user.referralCount ?? 0}\n` +
        `Referral link: ${getReferralLink(user)}\n` +
        `Registered: ${user.isRegistered ? "Yes" : "No"}`,
    );
  } catch (error) {
    console.error("Profile error:", error);
    await ctx.reply("❌ Could not load your profile. Please try again.");
  }
});

bot.hears("💰 Wallet", async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ telegramId });

    if (!user) {
      return ctx.reply("Please start the bot first with /start.");
    }

    if (needsPhoneRegistration(user)) {
      return ctx.reply(
        "Please share your phone number to complete registration before viewing your wallet.",
        registrationKeyboard(),
      );
    }

    await ctx.reply(
      `💰 Wallet\n` +
        `Current balance: ${Number(user.balance ?? 0).toFixed(2)} ETB\n` +
        `Phone: ${user.phoneNumber || "Not shared"}\n` +
        `Account registered: ${user.isRegistered ? "Yes" : "No"}`,
    );
  } catch (error) {
    console.error("Wallet error:", error);
    await ctx.reply("❌ Could not load your wallet. Please try again.");
  }
});

bot.hears("🎮 Play Game", async (ctx) => {
  await ctx.reply("🎮 Open the game and start playing.", openGameKeyboard());
});

const openWalletPage = async (ctx, label, url) => {
  const user = await User.findOne({ telegramId: String(ctx.from.id) });
  if (!user) return ctx.reply("Please start the bot first with /start.");
  if (needsPhoneRegistration(user)) {
    return ctx.reply(
      "Please share your phone number to use wallet services.",
      registrationKeyboard(),
    );
  }
  return ctx.reply(`Open ${label} in Casina Bingo.`, {
    reply_markup: {
      inline_keyboard: [[Markup.button.webApp(label, url)]],
    },
  });
};

bot.hears("💳 Deposit", (ctx) =>
  openWalletPage(ctx, "💳 Deposit", telegramDepositUrl),
);

bot.hears("🏦 Withdraw", (ctx) =>
  openWalletPage(ctx, "🏦 Withdraw", telegramWithdrawUrl),
);

bot.hears("🆘 Support", async (ctx) => {
  await ctx.reply(`🆘 Support: ${telegramSupportUrl}`);
});

bot.hears("🔗 Referral Link", async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = await User.findOne({ telegramId });
  if (!user) return ctx.reply("Please start the bot first with /start.");
  const code = user.referralCode || getReferralCode(telegramId);
  if (!user.referralCode) {
    user.referralCode = code;
    await user.save();
  }
  await ctx.reply(
    `🔗 Your referral link:\nhttps://t.me/${telegramBotUsername}?start=ref_${code}`,
  );
});

// /start
bot.start(async (ctx) => {
  try {
    const telegramUser = ctx.from;
    const telegramId = telegramUser.id.toString();
    const referrer = await findReferrer(ctx.startPayload, telegramId);

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.create({
        telegramId,
        username: telegramUser.username || "",
        firstName: telegramUser.first_name || "Player",
        lastName: telegramUser.last_name || "",
        referralCode: getReferralCode(telegramId),
        referredBy: referrer?.telegramId || null,
        balance: 0,
        lastLogin: new Date(),
        isRegistered: false,
      });

      await ctx.reply(
        `Welcome to Casina Bingo 🎮\n\n` +
          `Hi ${telegramUser.first_name || "Player"}! Your account has been initialized.`,
      );
      if (referrer) {
        await User.updateOne(
          { _id: referrer._id },
          { $inc: { referralCount: 1 } },
        );
      }
    } else {
      if (!user.referredBy && referrer) {
        user.referredBy = referrer.telegramId;
        await User.updateOne(
          { _id: referrer._id },
          { $inc: { referralCount: 1 } },
        );
      }
      user.referralCode ||= getReferralCode(telegramId);
      user.lastLogin = new Date();
      await user.save();

      await ctx.reply(
        `Welcome back, ${telegramUser.first_name || "Player"}! 🎮\n\nYour account is ready.`,
      );
    }

    if (!user.phoneNumber || !user.isRegistered) {
      await ctx.reply(
        `To complete your profile, please share your phone number.`,
        Markup.keyboard([
          [Markup.button.contactRequest("📱 Share Phone Number")],
        ])
          .resize()
          .oneTime(),
      );
      await ctx.reply(
        "You can open the game now, or share your contact first to unlock account features.",
        openGameKeyboard(),
      );
      return;
    }

    await ctx.reply(
      `You are all set! Use the button below to continue.`,
      accountKeyboard(),
    );

    await ctx.reply("🎮 Start the game in Telegram.", openGameKeyboard());
  } catch (error) {
    console.error("Telegram /start error:", error);

    await ctx.reply("❌ Something went wrong. Please try again.");
  }
});

// Phone number
bot.on("contact", async (ctx) => {
  try {
    const contact = ctx.message.contact;
    const telegramUser = ctx.from;
    const telegramId = telegramUser.id.toString();

    if (contact.user_id && contact.user_id !== telegramUser.id) {
      return ctx.reply("❌ Please share your own Telegram phone number.");
    }

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.create({
        telegramId,
        username: telegramUser.username || "",
        firstName: telegramUser.first_name || "Player",
        lastName: telegramUser.last_name || "",
        phoneNumber: contact.phone_number,
        balance: 0,
        lastLogin: new Date(),
        isRegistered: true,
      });
      await creditRegistrationBonus(telegramId);
    } else {
      const wasRegistered = user.isRegistered;
      user.phoneNumber = contact.phone_number;
      user.isRegistered = true;
      user.lastLogin = new Date();
      await user.save();
      if (!wasRegistered) await creditRegistrationBonus(telegramId);
    }

    const keyboard = Markup.keyboard([["👤 My Profile", "💰 Wallet"]])
      .resize()
      .oneTime();

    await ctx.reply(
      `🎉 Registration successful!\n\n` +
        `Welcome ${user.firstName}! Your account is now complete.`,
      keyboard,
    );

    await ctx.reply(
      "🎮 Tap below to open the game in Telegram.",
      openGameKeyboard(),
    );
  } catch (error) {
    console.error("Telegram registration error:", error);

    await ctx.reply(
      "❌ Something went wrong during registration. Please try again.",
    );
  }
});

export { launchBot };
export default bot;
