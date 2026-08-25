import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
  createAdminCoupon,
  deleteAdminCommissionRound,
  deleteCommissionSettings,
  fetchAdminCoupons,
  fetchAdminWithdrawalSettings,
  fetchCommissionData,
  fetchAdminReferralSettings,
  fetchAdminBonusSettings,
  toggleAdminCoupon,
  updateAdminWithdrawalSettings,
  updateCommissionSettings,
  updateAdminReferralSettings,
  updateAdminBonusSettings,
  updateAdminCoupon,
} from "../../services/userService";

const referrals = [
  ["BingoStar99", "LucyLy", "BingoStar99", "Oct 27, 2023, 11:15 GMT", "Paid"],
];

const statusStyles = {
  Active: "bg-emerald-500/15 text-emerald-300",
  Inactive: "bg-rose-500/15 text-rose-300",
  Paid: "bg-amber-500/15 text-amber-300",
  Approved: "bg-emerald-500/15 text-emerald-300",
};

const Panel = ({ title, action, children, className = "" }) => (
  <section
    className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg shadow-slate-950/20 sm:rounded-2xl ${className}`}
  >
    <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
      <h2 className="font-semibold">{title}</h2>
      {action && (
        <button className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500">
          {action}
        </button>
      )}
    </div>
    {children}
  </section>
);

const BonusPage = ({ section = "all" }) => {
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [couponError, setCouponError] = useState("");
  const [couponForm, setCouponForm] = useState(null);
  const [commissionData, setCommissionData] = useState(null);
  const [commissionForm, setCommissionForm] = useState({
    below100Percentage: 20,
    between100And1000Percentage: 25,
    above1000Percentage: 30,
  });
  const [commissionError, setCommissionError] = useState("");
  const [referralForm, setReferralForm] = useState({
    depositPercentage: 5,
    wagerPercentage: 1,
  });
  const [referralError, setReferralError] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [bonusForm, setBonusForm] = useState({
    registrationBonus: 100,
    firstDepositBonus: 50,
    depositBonusPercentage: 5,
  });
  const [bonusError, setBonusError] = useState("");
  const [bonusMessage, setBonusMessage] = useState("");
  const [withdrawFeeForm, setWithdrawFeeForm] = useState({
    feeType: "fixed",
    feeAmount: 0,
    minAmount: 50,
    maxAmount: 100000,
  });
  const [withdrawFeeError, setWithdrawFeeError] = useState("");
  const [withdrawFeeMessage, setWithdrawFeeMessage] = useState("");

  useEffect(() => {
    if (section !== "coupons" && section !== "all") return;
    fetchAdminCoupons()
      .then((response) => setActiveCoupons(response.coupons || []))
      .catch((error) =>
        setCouponError(error.message || "Failed to load coupons"),
      );
  }, [section]);

  useEffect(() => {
    if (section !== "referral" && section !== "all") return;
    fetchAdminReferralSettings()
      .then((response) => setReferralForm(response.settings))
      .catch((error) =>
        setReferralError(error.message || "Failed to load referral settings"),
      );
  }, [section]);

  const saveReferralSettings = async (event) => {
    event.preventDefault();
    setReferralError("");
    setReferralMessage("");
    try {
      const response = await updateAdminReferralSettings({
        depositPercentage: Number(referralForm.depositPercentage),
        wagerPercentage: Number(referralForm.wagerPercentage),
      });
      setReferralForm(response.settings);
      setReferralMessage("Referral rules saved");
    } catch (error) {
      setReferralError(error.message || "Failed to save referral settings");
    }
  };

  useEffect(() => {
    if (section !== "registration" && section !== "all") return;
    fetchAdminBonusSettings()
      .then((response) => setBonusForm(response.settings))
      .catch((error) =>
        setBonusError(error.message || "Failed to load bonus settings"),
      );
  }, [section]);

  const saveBonusSettings = async (event) => {
    event.preventDefault();
    setBonusError("");
    setBonusMessage("");
    try {
      const response = await updateAdminBonusSettings({
        registrationBonus: Number(bonusForm.registrationBonus),
        firstDepositBonus: Number(bonusForm.firstDepositBonus),
        depositBonusPercentage: Number(bonusForm.depositBonusPercentage),
      });
      setBonusForm(response.settings);
      setBonusMessage("Bonus rules saved");
    } catch (error) {
      setBonusError(error.message || "Failed to save bonus settings");
    }
  };

  useEffect(() => {
    if (section !== "withdrawFee" && section !== "all") return;
    fetchAdminWithdrawalSettings()
      .then((response) => setWithdrawFeeForm(response.settings))
      .catch((error) =>
        setWithdrawFeeError(error.message || "Failed to load withdrawal fee"),
      );
  }, [section]);

  const saveWithdrawFee = async (event) => {
    event.preventDefault();
    setWithdrawFeeError("");
    setWithdrawFeeMessage("");
    try {
      const response = await updateAdminWithdrawalSettings({
        ...withdrawFeeForm,
        feeAmount: Number(withdrawFeeForm.feeAmount),
        minAmount: Number(withdrawFeeForm.minAmount),
        maxAmount: Number(withdrawFeeForm.maxAmount),
      });
      setWithdrawFeeForm(response.settings);
      setWithdrawFeeMessage("Withdrawal fee settings saved");
    } catch (error) {
      setWithdrawFeeError(error.message || "Failed to save withdrawal fee");
    }
  };

  useEffect(() => {
    if (section !== "commission" && section !== "all") return;
    fetchCommissionData()
      .then((response) => {
        setCommissionData(response);
        setCommissionForm(response.settings);
      })
      .catch((error) =>
        setCommissionError(error.message || "Failed to load commission data"),
      );
  }, [section]);

  const saveCommission = async (event) => {
    event.preventDefault();
    setCommissionError("");
    try {
      const response = await updateCommissionSettings(commissionForm);
      setCommissionForm(response.settings);
      setCommissionData((current) => ({
        ...current,
        settings: response.settings,
      }));
    } catch (error) {
      setCommissionError(error.message || "Failed to save commission settings");
    }
  };

  const removeCommission = async () => {
    if (
      !window.confirm("Delete saved commission rules and restore defaults?")
    ) {
      return;
    }
    setCommissionError("");
    try {
      const response = await deleteCommissionSettings();
      setCommissionForm(response.settings);
      setCommissionData((current) => ({
        ...current,
        settings: response.settings,
      }));
    } catch (error) {
      setCommissionError(error.message || "Failed to delete commission rules");
    }
  };

  const removeCommissionRound = async (round) => {
    if (!window.confirm("Delete this game commission log?")) return;
    setCommissionError("");
    try {
      await deleteAdminCommissionRound(round._id);
      setCommissionData((current) => ({
        ...current,
        rounds: (current?.rounds || []).filter(
          (item) => item._id !== round._id,
        ),
      }));
    } catch (error) {
      setCommissionError(error.message || "Failed to delete commission log");
    }
  };

  const editCommission = () => {
    if (commissionData?.settings) {
      setCommissionForm({ ...commissionData.settings });
    }
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    setCouponError("");
    try {
      const response = couponForm._id
        ? await updateAdminCoupon(couponForm._id, couponForm)
        : await createAdminCoupon(couponForm);
      setActiveCoupons((items) =>
        couponForm._id
          ? items.map((item) =>
              item._id === response.coupon._id ? response.coupon : item,
            )
          : [response.coupon, ...items],
      );
      setCouponForm(null);
    } catch (error) {
      setCouponError(error.message || "Failed to save coupon");
    }
  };

  const toggleCoupon = async (coupon) => {
    try {
      const response = await toggleAdminCoupon(coupon._id);
      setActiveCoupons((items) =>
        items.map((item) =>
          item._id === response.coupon._id ? response.coupon : item,
        ),
      );
    } catch (error) {
      setCouponError(error.message || "Failed to update coupon");
    }
  };

  const show = (name) => section === "all" || section === name;

  return (
    <div className="space-y-5 text-slate-100">
      {section === "all" && (
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {[
            ["Active Coupons", "12", "text-sky-300", "bg-sky-500/15"],
            [
              "Referral Payouts (MTD)",
              "$3,450.00",
              "text-teal-300",
              "bg-teal-500/15",
            ],
            [
              "Registration Bonuses (MTD)",
              "$7,890.00",
              "text-rose-300",
              "bg-rose-500/15",
            ],
            [
              "Withdraw Fee Revenue (MTD)",
              "$1,120.00",
              "text-slate-300",
              "bg-slate-500/15",
            ],
          ].map(([label, value, textColor, iconColor]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-3 shadow-lg shadow-slate-950/20 sm:rounded-2xl sm:p-4"
            >
              <div>
                <div className="text-xs text-slate-400">{label}</div>
                <div className="mt-1 text-2xl font-semibold">{value}</div>
              </div>
              <div
                className={`grid h-8 w-8 place-items-center rounded-full text-sm ${iconColor} ${textColor} sm:h-10 sm:w-10`}
              >
                $
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`grid gap-3 sm:gap-4 ${section === "all" ? "xl:grid-cols-2" : "xl:grid-cols-1"}`}
      >
        {show("coupons") && (
          <Panel title="Coupon Code Management">
            <div className="flex justify-end border-b border-slate-800 px-4 py-3">
              <button
                onClick={() =>
                  setCouponForm({
                    code: "",
                    type: "Bonus Type",
                    value: "",
                    expiry: "",
                    perUserLimit: 1,
                  })
                }
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500"
              >
                Create New Coupon
              </button>
            </div>
            {couponError && (
              <div className="mx-4 mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {couponError}
              </div>
            )}
            {couponForm && (
              <form
                onSubmit={saveCoupon}
                className="grid gap-3 border-b border-slate-800 p-4 sm:grid-cols-4"
              >
                <input
                  required
                  placeholder="Coupon code"
                  value={couponForm.code}
                  onChange={(event) =>
                    setCouponForm({ ...couponForm, code: event.target.value })
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <input
                  placeholder="Bonus type"
                  value={couponForm.type}
                  onChange={(event) =>
                    setCouponForm({ ...couponForm, type: event.target.value })
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  placeholder="Value"
                  value={couponForm.value}
                  onChange={(event) =>
                    setCouponForm({ ...couponForm, value: event.target.value })
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={
                    couponForm.expiry
                      ? String(couponForm.expiry).slice(0, 10)
                      : ""
                  }
                  onChange={(event) =>
                    setCouponForm({ ...couponForm, expiry: event.target.value })
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <input
                  required
                  min="1"
                  step="1"
                  type="number"
                  placeholder="Uses per user"
                  value={couponForm.perUserLimit ?? 1}
                  onChange={(event) =>
                    setCouponForm({
                      ...couponForm,
                      perUserLimit: event.target.value,
                    })
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <div className="flex gap-2 sm:col-span-4">
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white"
                  >
                    Save Coupon
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponForm(null)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500">
                  <tr>
                    {[
                      "Code",
                      "Bonus Type",
                      "Value",
                      "Usage",
                      "Per User",
                      "Expiry",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} className="px-3 py-2.5">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {activeCoupons.map((coupon) => (
                    <tr key={coupon._id} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-medium">{coupon.code}</td>
                      <td className="px-3 py-2.5">{coupon.type}</td>
                      <td className="px-3 py-2.5">
                        ${Number(coupon.value).toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5">{coupon.usage}</td>
                      <td className="px-3 py-2.5">
                        {coupon.perUserLimit || 1}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {coupon.expiry
                          ? new Date(coupon.expiry).toLocaleDateString()
                          : "No expiry"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] ${statusStyles[coupon.isActive ? "Active" : "Inactive"]}`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() =>
                            setCouponForm({
                              ...coupon,
                              value: String(coupon.value),
                              perUserLimit: coupon.perUserLimit || 1,
                            })
                          }
                          className="mr-1 rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleCoupon(coupon)}
                          className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300"
                        >
                          {coupon.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 border-t border-slate-800 px-3 py-3 text-xs">
              <span className="text-slate-400">Bulk Actions</span>
              <button className="rounded border border-slate-700 px-2 py-1 text-slate-300">
                Approve Selected
              </button>
              <button className="rounded border border-slate-700 px-2 py-1 text-slate-300">
                Deny Selected
              </button>
            </div>
          </Panel>
        )}

        {show("referral") && (
          <Panel title="Referral Bonus Rules">
            <form
              onSubmit={saveReferralSettings}
              className="border-b border-slate-800"
            >
              <div className="grid gap-x-8 gap-y-3 p-4 text-xs sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="flex items-center justify-between gap-3 text-slate-400">
                    Deposit reward for inviter (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={referralForm.depositPercentage}
                      onChange={(event) =>
                        setReferralForm({
                          ...referralForm,
                          depositPercentage: event.target.value,
                        })
                      }
                      className="h-8 w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 text-right text-slate-100"
                    />
                  </label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center justify-between gap-3 text-slate-400">
                    Wager reward for inviter (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={referralForm.wagerPercentage}
                      onChange={(event) =>
                        setReferralForm({
                          ...referralForm,
                          wagerPercentage: event.target.value,
                        })
                      }
                      className="h-8 w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 text-right text-slate-100"
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 pb-4">
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500"
                >
                  Save Rules
                </button>
                {referralMessage && (
                  <span className="text-xs text-emerald-300">
                    {referralMessage}
                  </span>
                )}
                {referralError && (
                  <span className="text-xs text-rose-300">{referralError}</span>
                )}
              </div>
            </form>
            <div className="border-t border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500">
                  <tr>
                    {[
                      "Referrer",
                      "Referee",
                      "Referred",
                      "Date",
                      "Payout Status",
                    ].map((heading) => (
                      <th key={heading} className="px-3 py-2">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {referrals.map((referral) => (
                    <tr key={referral.join("-")}>
                      <td className="px-3 py-2">{referral[0]}</td>
                      <td className="px-3 py-2">{referral[1]}</td>
                      <td className="px-3 py-2">{referral[2]}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {referral[3]}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] ${statusStyles[referral[4]]}`}
                        >
                          {referral[4]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {show("registration") && (
          <Panel title="Registration & Deposit Bonuses">
            <form
              onSubmit={saveBonusSettings}
              className="grid gap-4 p-4 sm:grid-cols-3"
            >
              {bonusError && (
                <div className="sm:col-span-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {bonusError}
                </div>
              )}
              {bonusMessage && (
                <div className="sm:col-span-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  {bonusMessage}
                </div>
              )}
              {[
                ["Registration bonus (ETB)", "registrationBonus"],
                ["First deposit bonus (ETB)", "firstDepositBonus"],
                ["Deposit bonus (%)", "depositBonusPercentage"],
              ].map(([label, field]) => (
                <label key={field} className="text-xs text-slate-400">
                  {label}
                  <input
                    type="number"
                    min="0"
                    max={field === "depositBonusPercentage" ? "100" : undefined}
                    step="0.01"
                    value={bonusForm[field]}
                    onChange={(event) =>
                      setBonusForm({
                        ...bonusForm,
                        [field]: event.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  />
                </label>
              ))}
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-500 sm:col-span-3"
              >
                Save Bonus Rules
              </button>
            </form>
          </Panel>
        )}

        {show("withdrawFee") && (
          <Panel title="Withdraw Fee Settings">
            <form
              onSubmit={saveWithdrawFee}
              className="grid gap-4 p-4 sm:grid-cols-2"
            >
              {withdrawFeeError && (
                <div className="sm:col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {withdrawFeeError}
                </div>
              )}
              {withdrawFeeMessage && (
                <div className="sm:col-span-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  {withdrawFeeMessage}
                </div>
              )}
              <label className="text-xs text-slate-400">
                Fee type
                <select
                  value={withdrawFeeForm.feeType}
                  onChange={(event) =>
                    setWithdrawFeeForm({
                      ...withdrawFeeForm,
                      feeType: event.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                >
                  <option value="fixed">Fixed ETB</option>
                  <option value="percentage">Percentage</option>
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Fee amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={withdrawFeeForm.feeAmount}
                  onChange={(event) =>
                    setWithdrawFeeForm({
                      ...withdrawFeeForm,
                      feeAmount: event.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Minimum withdrawal
                <input
                  type="number"
                  min="0"
                  value={withdrawFeeForm.minAmount}
                  onChange={(event) =>
                    setWithdrawFeeForm({
                      ...withdrawFeeForm,
                      minAmount: event.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Maximum withdrawal
                <input
                  type="number"
                  min="0"
                  value={withdrawFeeForm.maxAmount}
                  onChange={(event) =>
                    setWithdrawFeeForm({
                      ...withdrawFeeForm,
                      maxAmount: event.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
              </label>
              <button className="sm:col-span-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
                Save withdrawal settings
              </button>
            </form>
          </Panel>
        )}

        {show("commission") && (
          <Panel title="Game Round Commission (Bingo)">
            {commissionError && (
              <div className="m-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {commissionError}
              </div>
            )}
            <form onSubmit={saveCommission} className="space-y-3 p-4 text-xs">
              {[
                ["below100Percentage", "Total below 100 ETB"],
                ["between100And1000Percentage", "Total 100-1000 ETB"],
                ["above1000Percentage", "Total greater than 1000 ETB"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center justify-between gap-3 text-slate-400"
                >
                  {label}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={commissionForm[field]}
                    onChange={(event) =>
                      setCommissionForm({
                        ...commissionForm,
                        [field]: event.target.value,
                      })
                    }
                    className="h-8 w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 text-slate-100"
                  />
                </label>
              ))}
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-medium text-white"
              >
                Save Commission Rules
              </button>
            </form>
            <div className="border-t border-slate-800 px-4 py-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-slate-300">
                  Saved Commission Rules
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] text-emerald-300">
                  Stored in database
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Total Range</th>
                      <th className="px-3 py-2">Commission</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      ["Below 100 ETB", commissionForm.below100Percentage],
                      [
                        "100 - 1000 ETB",
                        commissionForm.between100And1000Percentage,
                      ],
                      [
                        "Greater than 1000 ETB",
                        commissionForm.above1000Percentage,
                      ],
                    ].map(([range, percentage]) => (
                      <tr key={range}>
                        <td className="px-3 py-2.5">{range}</td>
                        <td className="px-3 py-2.5 font-semibold text-teal-300">
                          {Number(percentage || 0).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={editCommission}
                            title="Edit commission rules"
                            aria-label="Edit commission rules"
                            className="mr-2 inline-grid h-7 w-7 place-items-center rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            <FaEdit aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={removeCommission}
                            title="Delete commission rules"
                            aria-label="Delete commission rules"
                            className="inline-grid h-7 w-7 place-items-center rounded border border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                          >
                            <FaTrash aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid gap-3 border-t border-slate-800 p-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-950 p-3">
                <div className="text-xs text-slate-500">
                  Total round balance
                </div>
                <div className="mt-1 text-xl font-semibold">
                  {Number(commissionData?.totals?.totalBalance || 0).toFixed(2)}{" "}
                  ETB
                </div>
              </div>
              <div className="rounded-lg bg-slate-950 p-3">
                <div className="text-xs text-slate-500">Commission earned</div>
                <div className="mt-1 text-xl font-semibold text-teal-300">
                  {Number(commissionData?.totals?.totalCommission || 0).toFixed(
                    2,
                  )}{" "}
                  ETB
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 px-4 py-3">
              <div className="mb-2 text-xs text-slate-400">
                Recent Game Commission Logs
              </div>
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Game ID</th>
                    <th>Pot Size</th>
                    <th>Rate</th>
                    <th>Commission Earned</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(commissionData?.rounds || []).map((round) => (
                    <tr key={round._id} className="border-t border-slate-800">
                      <td className="py-2">{round.gameId}</td>
                      <td>
                        {Number(
                          round.roundSummary?.totalBetAmount || 0,
                        ).toFixed(2)}{" "}
                        ETB
                      </td>
                      <td>
                        {Number(
                          round.roundSummary?.commissionPercentage || 0,
                        ).toFixed(2)}
                        %
                      </td>
                      <td className="text-teal-300">
                        {Number(
                          round.roundSummary?.commissionAmount || 0,
                        ).toFixed(2)}{" "}
                        ETB
                      </td>
                      <td>
                        {round.roundEndedAt
                          ? new Date(round.roundEndedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeCommissionRound(round)}
                          title="Delete commission log"
                          aria-label={`Delete commission log ${round.gameId}`}
                          className="inline-grid h-7 w-7 place-items-center rounded border border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                        >
                          <FaTrash aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
};

export default BonusPage;
