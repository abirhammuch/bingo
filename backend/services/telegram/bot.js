import dotenv from "dotenv";
import { Telegraf, Markup } from "telegraf";
import User from "../../models/User.js";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

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
      });

      await ctx.reply(
        `Welcome to Marshal Game 🎮\n\n` +
          `Hi ${telegramUser.first_name || "Player"}! Your account has been created automatically using your Telegram profile.`,
      );
    } else {
      user.lastLogin = new Date();
      await user.save();

      await ctx.reply(
        `Welcome back, ${telegramUser.first_name || "Player"}! 🎮\n\nYour account is ready.`,
      );
    }

    if (!user.phoneNumber) {
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

    await ctx.reply(
      `You are all set! Use the buttons below to continue.`,
      Markup.keyboard([["🎮 Play Game"], ["👤 My Profile", "💰 Wallet"]])
        .resize()
        .oneTime(),
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
      });
    } else {
      user.phoneNumber = contact.phone_number;
      user.lastLogin = new Date();
      await user.save();
    }

    await ctx.reply(
      `🎉 Registration successful!\n\n` +
        `Welcome ${user.firstName}! Your account is now complete.`,
      Markup.keyboard([["🎮 Play Game"], ["👤 My Profile", "💰 Wallet"]])
        .resize()
        .oneTime(),
    );
  } catch (error) {
    console.error("Telegram registration error:", error);

    await ctx.reply(
      "❌ Something went wrong during registration. Please try again.",
    );
  }
});

export default bot;
