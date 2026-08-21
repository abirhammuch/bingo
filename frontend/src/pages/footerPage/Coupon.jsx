import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";

const Coupon = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage(
      code.trim()
        ? "Coupon redemption is not available yet."
        : "Enter a coupon code.",
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-16 text-slate-100">
      <main className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Coupon Code</h1>
              <p className="mt-1 text-sm text-slate-400">
                Redeem a promotional code
              </p>
            </div>
            <span className="text-3xl">🎟️</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                setMessage("");
              }}
              placeholder="Enter coupon code"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-500 px-4 py-3 font-bold text-slate-950 hover:bg-amber-400"
            >
              APPLY COUPON
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-sm text-amber-300">{message}</p>
          )}

          <button
            onClick={() => navigate("/profile")}
            className="mt-6 text-sm font-semibold text-slate-400 hover:text-white"
          >
            ← Back to profile
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Coupon;
