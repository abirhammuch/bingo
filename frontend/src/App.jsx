import React, { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

const App = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => setCollapsed((s) => !s);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Header onToggleSidebar={toggle} isSidebarCollapsed={collapsed} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        <div className="hidden md:block">
          <Sidebar collapsed={collapsed} />
        </div>

        <main className="flex-1">
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-6 min-h-[60vh]">
            <h2 className="text-xl font-semibold">Main content</h2>
            <p className="text-slate-400 mt-2">
              Placeholder area for the app pages.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
