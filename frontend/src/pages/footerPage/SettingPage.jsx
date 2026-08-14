import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import { useAppContext } from "../../context/AppContext";

const SettingPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useAppContext();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nightMode, setNightMode] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [expandedRules, setExpandedRules] = useState(null);

  const languages = [
    { id: "english", name: "English", flag: "🇬🇧" },
    { id: "amharic", name: "አማርኛ", flag: "🇪🇹" },
    { id: "tigrinya", name: "ትግርኛ", flag: "🇪🇹" },
    { id: "afaan", name: "Afaan Oromoo", flag: "🇪🇹" },
    { id: "somali", name: "Soomaali", flag: "🇪🇹" },
  ];

  const gameRules = [
    {
      id: "card-selection",
      title: "Card Selection",
      content:
        "Select your bingo card at the start of each game round. You can choose from available cards displayed on the screen.",
    },
    {
      id: "gameplay",
      title: "Gameplay",
      content:
        "Numbers are called randomly. Your card is marked automatically when numbers match. The game continues until someone wins.",
    },
    {
      id: "win-conditions",
      title: "Win Conditions",
      content:
        "Win by completing a line (horizontal, vertical, or diagonal) or a full house (all numbers marked). Be the first to complete the pattern.",
    },
    {
      id: "claiming-prize",
      title: "Claiming Prize",
      content:
        "When you win, your prize is automatically credited to your wallet. Check your transaction history for details.",
    },
    {
      id: "penalty",
      title: "Penalty",
      content:
        "Leaving the game before completion may result in penalties or disqualification. Always complete the game round.",
    },
  ];

  const toggleRules = (ruleId) => {
    setExpandedRules(expandedRules === ruleId ? null : ruleId);
  };

  return (
    <div className="pb-16 min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Page Header */}
      <div className="bg-slate-900/60 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">SETTINGS</h1>
          <p className="text-slate-400 text-sm">Customise your experience</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* PREFERENCES Section */}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">
              PREFERENCES
            </h2>

            <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
              {/* Sound Toggle */}
              <div className="p-4 flex items-center justify-between border-b border-slate-700/50 hover:bg-slate-800/20 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                    <span className="text-lg">🔊</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Sound</h3>
                    <p className="text-xs text-slate-400">
                      {soundEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    soundEnabled ? "bg-purple-500" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                      soundEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  ></div>
                </button>
              </div>

              {/* Night Mode Toggle */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                    <span className="text-lg">🌙</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Night Mode</h3>
                    <p className="text-xs text-slate-400">Dark</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => setNightMode(!nightMode)}
                  className={`relative w-12 h-6 rounded-full transition ${nightMode ? "bg-purple-500" : "bg-slate-700"}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                      nightMode ? "translate-x-6" : "translate-x-0"
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>

          {/* LANGUAGE Section */}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">
              LANGUAGE
            </h2>

            <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
              {languages.map((lang, index) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`w-full p-4 flex items-center justify-between transition ${
                    index !== languages.length - 1
                      ? "border-b border-slate-700/50"
                      : ""
                  } ${selectedLanguage === lang.id ? "bg-slate-800/60" : "hover:bg-slate-800/20"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span
                      className={`font-semibold ${selectedLanguage === lang.id ? "text-white" : "text-slate-300"}`}
                    >
                      {lang.name}
                    </span>
                  </div>

                  {selectedLanguage === lang.id && (
                    <div className="w-6 h-6 rounded-full border-2 border-purple-500 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* INFORMATION Section */}
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">
              INFORMATION
            </h2>

            <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
              {/* Game Rules Header */}
              <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <span>🏆</span>
                </div>
                <h3 className="font-bold text-white">Game Rules</h3>
              </div>

              {/* Expandable Rules */}
              <div>
                {gameRules.map((rule, index) => (
                  <div key={rule.id}>
                    <button
                      onClick={() => toggleRules(rule.id)}
                      className={`w-full p-4 flex items-center justify-between hover:bg-slate-800/20 transition ${
                        index !== gameRules.length - 1
                          ? "border-b border-slate-700/50"
                          : ""
                      }`}
                    >
                      <span className="text-slate-300 font-semibold">
                        {rule.title}
                      </span>
                      <span
                        className={`text-slate-500 transition transform ${
                          expandedRules === rule.id ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>

                    {/* Expanded Content */}
                    {expandedRules === rule.id && (
                      <div className="px-4 py-3 bg-slate-800/10 border-t border-slate-700/50 text-sm text-slate-400">
                        {rule.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Version */}
      <div className="text-center py-6 border-t border-slate-700/50">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          AGAFARI BINGO · V2.0.4
        </p>
      </div>

      {/* Footer Navigation */}
      <Footer />
    </div>
  );
};

export default SettingPage;
