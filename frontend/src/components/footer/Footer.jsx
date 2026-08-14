import React from "react";
import Game from "./Game";
import Deposite from "./Deposite";
import Profile from "./Profile";
import Setting from "./Setting";
import History from "./History";

const Footer = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700 backdrop-blur-sm">
      <div className="w-full px-2 py-2">
        <div className="flex justify-around items-center gap-1">
          <div className="flex-1 min-w-0">
            <Game />
          </div>
          <div className="w-px h-6 bg-slate-700/50"></div>
          <div className="flex-1 min-w-0">
            <History />
          </div>
          <div className="w-px h-6 bg-slate-700/50"></div>
          <div className="flex-1 min-w-0">
            <Deposite />
          </div>
          <div className="w-px h-6 bg-slate-700/50"></div>
          <div className="flex-1 min-w-0">
            <Profile />
          </div>
          <div className="w-px h-6 bg-slate-700/50"></div>
          <div className="flex-1 min-w-0">
            <Setting />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
