import React, { useState } from "react";
import { sendAdminTelegramBroadcast } from "../../services/userService";

const TelegramBroadcastPage = () => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    setSending(true);
    try {
      const response = await sendAdminTelegramBroadcast(message);
      setStatus(
        `Message sent to ${response.sent} users. Failed: ${response.failed}.`,
      );
      setMessage("");
    } catch (requestError) {
      setError(requestError.message || "Failed to send Telegram message");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20">
      <h1 className="text-xl font-semibold">Telegram Broadcast</h1>
      <p className="mt-1 text-sm text-slate-400">
        Send a message to all registered users.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}
        {status && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {status}
          </div>
        )}
        <textarea
          required
          minLength="1"
          maxLength="4096"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write your Telegram message..."
          rows="8"
          className="block w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send to all registered users"}
        </button>
      </form>
    </section>
  );
};

export default TelegramBroadcastPage;
