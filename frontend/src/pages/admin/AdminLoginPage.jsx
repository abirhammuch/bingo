import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/apiClient";

const AdminLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await api.post("/api/admin/login", { username, password });

      localStorage.setItem("adminToken", data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username (empty for super admin)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white"
          />
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-emerald-500 text-slate-950 font-bold p-3 rounded-xl"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
