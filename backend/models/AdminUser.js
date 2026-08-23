import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: { type: String, enum: ["admin", "super-admin"], default: "admin" },
    isActive: { type: Boolean, default: true },
    bootstrapKey: { type: String, sparse: true, unique: true },
  },
  { timestamps: true },
);

const AdminUser =
  mongoose.models.AdminUser || mongoose.model("AdminUser", adminUserSchema);

export default AdminUser;
