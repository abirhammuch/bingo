import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    passwordHash: { type: String, default: "" },
    passwordSalt: { type: String, default: "" },
  },
  { timestamps: true },
);

const AdminSettings =
  mongoose.models.AdminSettings ||
  mongoose.model("AdminSettings", adminSettingsSchema);

export default AdminSettings;
