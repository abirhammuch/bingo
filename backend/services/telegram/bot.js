import dotenv from "dotenv";
import { Telegraf, Markup } from "telegraf";
import User from "../../models/User.js";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_LAUNCH_DISABLED =
  String(process.env.TELEGRAM_BOT_LAUNCH_DISABLED || "")
    .trim()
    .toLowerCase() === "true";

const bot = new Telegraf(TELEGRAM_BOT_TOKEN || "");

if (!TELEGRAM_BOT_TOKEN) {
  console.warn(
    "⚠️ TELEGRAM_BOT_TOKEN is not set. Bot commands will not start.",
  );
}

const rawWebAppUrl =
  process.env.TELEGRAM_WEBAPP_URL ||
  process.env.FRONTEND_URL ||
  "https://bingo-zeta-livid.vercel.app";
const telegramWebAppUrl = rawWebAppUrl
  .replace(/\/login\/?$/, "")
  .replace(/\/$/, "");

const playGameButton = () => {
  if (!telegramWebAppUrl) {
    return null;
  }

  return Markup.inlineKeyboard([
    [Markup.button.webApp("🎮 Play Game", telegramWebAppUrl)],
  ]).resize();
};

const launchBot = async () => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn(
      "⚠️ Telegram bot startup skipped because no token is configured.",
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
    console.log(
      "🤖 Telegram bot is running",
      bot.botInfo?.username || "Telegram bot",
    );
    return true;
  } catch (error) {
    console.error("Telegram bot failed to launch:", error.message);
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
  const keyboard =
    playGameButton() ||
    Markup.keyboard([["🎮 Play Game"], ["👤 My Profile", "💰 Wallet"]])
      .resize()
      .oneTime();

  await ctx.reply(
    user && needsPhoneRegistration(user)
      ? "Your account is created but not fully registered yet. Please share your phone number or use Login once complete."
      : "Welcome back! Use the button below to login to Marshal Game.",
    keyboard,
  );
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

bot.hears("🎮 Play Game", async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ telegramId });

    if (!user) {
      return ctx.reply("Please start the bot first with /start.");
    }

    if (needsPhoneRegistration(user)) {
      return ctx.reply(
        "Your phone number is required to play games. Please share your contact now to complete registration.",
        registrationKeyboard(),
      );
    }

    if (!telegramWebAppUrl) {
      return ctx.reply(
        "Game is not configured yet. Please contact the admin or try again later.",
      );
    }

    await ctx.reply("Opening Marshal Game...", playGameButton());
  } catch (error) {
    console.error("Play Game error:", error);
    await ctx.reply("❌ Could not open the game. Please try again.");
  }
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
        `Balance: ${user.balance ?? 0}\n` +
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
        `Current balance: ${user.balance ?? 0} ETB\n` +
        `Phone: ${user.phoneNumber || "Not shared"}\n` +
        `Account registered: ${user.isRegistered ? "Yes" : "No"}`,
    );
  } catch (error) {
    console.error("Wallet error:", error);
    await ctx.reply("❌ Could not load your wallet. Please try again.");
  }
});

// /start
bot.start(async (ctx) => {
  try {
    const telegramUser = ctx.from;
    const telegramId = telegramUser.id.toString();

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.create({
        telegramId,
        username: telegramUser.username || "",
        firstName: telegramUser.first_name || "Player",
        lastName: telegramUser.last_name || "",
        balance: 100,
        lastLogin: new Date(),
        isRegistered: false,
      });

      await ctx.reply(
        `Welcome to Marshal Game 🎮\n\n` +
          `Hi ${telegramUser.first_name || "Player"}! Your account has been initialized.`,
      );
    } else {
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
      return;
    }

    const keyboard = playGameButton();
    const replyMarkup =
      keyboard ||
      Markup.keyboard([["🎮 Play Game"], ["👤 My Profile", "💰 Wallet"]])
        .resize()
        .oneTime();

    await ctx.reply(
      `You are all set! Use the button below to continue.`,
      replyMarkup,
    );
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
        balance: 100,
        lastLogin: new Date(),
        isRegistered: true,
      });
    } else {
      user.phoneNumber = contact.phone_number;
      user.isRegistered = true;
      user.lastLogin = new Date();
      await user.save();
    }

    const keyboard =
      playGameButton() ||
      Markup.keyboard([["🎮 Play Game"], ["👤 My Profile", "💰 Wallet"]])
        .resize()
        .oneTime();

    await ctx.reply(
      `🎉 Registration successful!\n\n` +
        `Welcome ${user.firstName}! Your account is now complete.`,
      keyboard,
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
