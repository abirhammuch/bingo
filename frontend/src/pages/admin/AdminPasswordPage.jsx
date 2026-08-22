import React, { useState } from "react";
import { changeAdminPassword } from "../../services/userService";

const AdminPasswordPage = () => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await changeAdminPassword(form.currentPassword, form.newPassword);
      setMessage("Admin password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (requestError) {
      setError(requestError.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-xl rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20">
      <h1 className="text-xl font-semibold">Change Admin Password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {message}
          </p>
        )}
        {[
          ["Current password", "currentPassword"],
          ["New password", "newPassword"],
          ["Confirm new password", "confirmPassword"],
        ].map(([label, field]) => (
          <label key={field} className="block text-sm text-slate-300">
            {label}
            <input
              required
              minLength={8}
              type="password"
              value={form[field]}
              onChange={(event) =>
                setForm({ ...form, [field]: event.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
        ))}
        <button
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Change password"}
        </button>
      </form>
    </section>
  );
};

export default AdminPasswordPage;
