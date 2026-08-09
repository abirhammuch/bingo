import dotenv from "dotenv";
import { Telegraf, Markup } from "telegraf";
import User from "../../models/User.js";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const telegramWebAppUrl = process.env.TELEGRAM_WEBAPP_URL || "";

const playGameButton = () => {
  if (!telegramWebAppUrl) {
    return null;
  }

  return Markup.inlineKeyboard([
    [Markup.button.webApp("🎮 Play Game", telegramWebAppUrl)],
  ]).resize();
};

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

export default bot;
