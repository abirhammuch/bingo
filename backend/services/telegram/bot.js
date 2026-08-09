import dotenv from "dotenv";
import { Telegraf, Markup } from "telegraf";
import User from "../../models/User.js";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// /start
bot.start(async (ctx) => {
  try {
    const telegramUser = ctx.from;

    let user = await User.findOne({
      telegramId: telegramUser.id.toString(),
    });

    // Existing user
    if (user) {
      await ctx.reply(
        `Welcome back, ${telegramUser.first_name}! 🎮\n\nYour account already exists.`,
        Markup.keyboard([["🎮 Play Game"], ["👤 My Profile", "💰 Wallet"]])
          .resize()
          .oneTime(),
      );

      return;
    }

    // New user
    await ctx.reply(
      `Welcome to Marshal Game 🎮\n\n` +
        `Hello ${telegramUser.first_name}!\n\n` +
        `Please share your phone number to create your account.`,
      Markup.keyboard([[Markup.button.contactRequest("📱 Share Phone Number")]])
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

    // Make sure the contact belongs to this Telegram account
    if (contact.user_id && contact.user_id !== telegramUser.id) {
      return ctx.reply("❌ Please share your own Telegram phone number.");
    }

    let user = await User.findOne({
      telegramId: telegramUser.id.toString(),
    });

    // Create user
    if (!user) {
      user = await User.create({
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username || "",
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || "",
        phoneNumber: contact.phone_number,
      });
    }

    await ctx.reply(
      `🎉 Registration successful!\n\n` +
        `Welcome ${user.firstName}!\n\n` +
        `Your Marshal Game account is ready.`,
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
