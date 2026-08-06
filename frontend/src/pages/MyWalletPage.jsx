import React, { useState } from "react";
import BalanceInfo from "../components/BalanceInfo";
import History from "../components/History";
import PaymentMethod from "../components/PaymentMethod";
import PaymentCheck from "../components/PaymentCheck";
import Responsible from "../components/Responsible";

const MyWalletPage = () => {
  const [activeMode, setActiveMode] = useState("default");

  return (
    <div>
      <BalanceInfo
        activeMode={activeMode}
        onWithdraw={() => setActiveMode("withdraw")}
        onDeposit={() => setActiveMode("default")}
        onHistory={() => setActiveMode("history")}
        onClose={() => setActiveMode("default")}
      />

      {activeMode === "default" && <PaymentMethod />}
      {activeMode === "default" && <PaymentCheck />}
      {activeMode === "history" && (
        <History onClose={() => setActiveMode("default")} />
      )}
      <Responsible />
    </div>
  );
};

export default MyWalletPage;
