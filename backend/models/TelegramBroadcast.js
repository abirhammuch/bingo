import mongoose from "mongoose";

const telegramBroadcastSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["sending", "sent", "deleting", "deleted"],
      default: "sending",
    },
    deliveries: [
      {
        telegramId: { type: String, required: true },
        messageId: { type: Number, required: true },
        deleted: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
);

const TelegramBroadcast =
  mongoose.models.TelegramBroadcast ||
  mongoose.model("TelegramBroadcast", telegramBroadcastSchema);

export default TelegramBroadcast;
