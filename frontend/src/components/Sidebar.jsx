import React from "react";
import {
  FaGamepad,
  FaTrophy,
  FaGift,
  FaTicketAlt,
  FaBullseye,
  FaUserFriends,
  FaGem,
  FaWallet,
  FaBolt,
  FaCloudShowersHeavy,
  FaUser,
} from "react-icons/fa";

const Item = ({ icon, title, subtitle, active }) => (
  <div
    className={`flex items-center justify-between p-3 rounded-xl mb-3 cursor-pointer ${
      active
        ? "bg-emerald-700/20 border-emerald-700"
        : "bg-slate-800/50 border-slate-700"
    } border`}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-slate-900/40 flex items-center justify-center text-xl">
        {icon}
      </div>
      <div>
        <div className="font-medium text-slate-100">{title}</div>
        {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
      </div>
    </div>
    <div className="text-slate-300">&gt;</div>
  </div>
);

const Sidebar = ({ collapsed }) => {
  const items = [
    { icon: <FaGamepad />, title: "Lobby" },
    { icon: <FaTrophy />, title: "Tournament" },
    { icon: <FaGift />, title: "Promotions" },
    { icon: <FaTicketAlt />, title: "Promo Codes" },
    { icon: <FaBullseye />, title: "Prediction Pool" },
    { icon: <FaUserFriends />, title: "Referral Tournament", active: true },
    { icon: <FaGem />, title: "VIP Rewards" },
    { icon: <FaWallet />, title: "Daily Cashback" },
    { icon: <FaBolt />, title: "Happy Hour History" },
    { icon: <FaCloudShowersHeavy />, title: "Free Cash Rain" },
  ];

  if (collapsed) {
    return (
      <aside className="w-16">
        <div className="flex flex-col items-center gap-3">
          {items.map((it) => (
            <div
              key={it.title}
              className={`w-12 h-12 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700 ${
                it.active ? "ring-2 ring-emerald-600" : ""
              }`}
              title={it.title}
            >
              <span>{it.icon}</span>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-slate-800/70 to-slate-900/50 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Logged in as</div>
              <div className="font-semibold text-slate-100">Marshal</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center">
              <FaUser className="text-slate-200" />
            </div>
          </div>
        </div>

        <nav>
          {items.map((it) => (
            <Item
              key={it.title}
              icon={it.icon}
              title={it.title}
              subtitle={it.subtitle}
              active={it.active}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
