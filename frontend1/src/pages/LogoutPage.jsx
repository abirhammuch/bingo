import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const LogoutPage = () => {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/30 text-center">
        <h1 className="text-3xl font-semibold mb-4">Logging out...</h1>
        <p className="text-slate-400">Please wait while we sign you out.</p>
      </div>
    </div>
  );
};

export default LogoutPage;
