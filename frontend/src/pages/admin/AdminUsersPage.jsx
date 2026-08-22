import React, { useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
} from "../../services/userService";

const AdminUsersPage = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState([]);

  const loadAdmins = async () => {
    try {
      const response = await fetchAdminUsers();
      setAdmins(response.admins || []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load admins");
    }
  };

  React.useEffect(() => {
    loadAdmins();
  }, []);

  const removeAdmin = async (admin) => {
    if (!window.confirm(`Delete admin ${admin.username}?`)) return;
    try {
      await deleteAdminUser(admin._id);
      setAdmins((items) => items.filter((item) => item._id !== admin._id));
      setMessage("Admin account deleted");
    } catch (requestError) {
      setError(requestError.message || "Failed to delete admin");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);
    try {
      await createAdminUser(form);
      setMessage("Admin account created");
      setForm({ username: "", password: "" });
    } catch (requestError) {
      setError(requestError.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-xl rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20">
      <h1 className="text-xl font-semibold">Create Admin Account</h1>
      <p className="mt-1 text-sm text-slate-400">
        This creates a lower-privilege admin.
      </p>
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
        <input
          required
          minLength={3}
          maxLength={30}
          placeholder="Username"
          value={form.username}
          onChange={(event) =>
            setForm({ ...form, username: event.target.value })
          }
          className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
        <input
          required
          minLength={8}
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
          className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
        />
        <button
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create admin"}
        </button>
      </form>
      <div className="mt-8 border-t border-slate-800 pt-5">
        <h2 className="font-semibold">Lower Admins</h2>
        <div className="mt-3 space-y-2">
          {admins.map((admin) => (
            <div
              key={admin._id}
              className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2 text-sm"
            >
              <span>{admin.username}</span>
              <button
                type="button"
                onClick={() => removeAdmin(admin)}
                className="rounded border border-rose-500/50 px-2 py-1 text-xs text-rose-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminUsersPage;
