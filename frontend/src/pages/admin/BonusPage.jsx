import React, { useState } from "react";

const coupons = [
  {
    code: "CBROFA",
    type: "Bonus Type",
    value: "$200.00",
    usage: "0",
    expiry: "Oct 27 GMT",
    status: "Active",
  },
  {
    code: "CBROFB",
    type: "Bonus Type",
    value: "$500.00",
    usage: "0",
    expiry: "Oct 27 GMT",
    status: "Active",
  },
  {
    code: "DPREAC",
    type: "Bonus Type",
    value: "$150.00",
    usage: "0",
    expiry: "Oct 27 GMT",
    status: "Inactive",
  },
  {
    code: "#PERGS",
    type: "Bonus Type",
    value: "$75.50",
    usage: "175",
    expiry: "Oct 27 GMT",
    status: "Inactive",
  },
];

const referrals = [
  ["BingoStar99", "LucyLy", "BingoStar99", "Oct 27, 2023, 11:15 GMT", "Paid"],
  ["LuckyDip22", "LuckyDip22", "LucyLy", "Oct 27, 2023, 11:20 GMT", "Approved"],
];

const statusStyles = {
  Active: "bg-emerald-500/15 text-emerald-300",
  Inactive: "bg-rose-500/15 text-rose-300",
  Paid: "bg-amber-500/15 text-amber-300",
  Approved: "bg-emerald-500/15 text-emerald-300",
};

const Panel = ({ title, action, children, className = "" }) => (
  <section
    className={`overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg shadow-slate-950/20 ${className}`}
  >
    <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
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
  const [activeCoupons, setActiveCoupons] = useState(coupons);

  const show = (name) => section === "all" || section === name;

  return (
    <div className="space-y-5 text-slate-100">
      {section === "all" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg shadow-slate-950/20"
            >
              <div>
                <div className="text-xs text-slate-400">{label}</div>
                <div className="mt-1 text-2xl font-semibold">{value}</div>
              </div>
              <div
                className={`grid h-10 w-10 place-items-center rounded-full ${iconColor} ${textColor}`}
              >
                $
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`grid gap-4 ${section === "all" ? "xl:grid-cols-2" : "xl:grid-cols-1"}`}
      >
        {show("coupons") && (
          <Panel title="Coupon Code Management" action="Create New Coupon">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500">
                  <tr>
                    {[
                      "Code",
                      "Bonus Type",
                      "Value",
                      "Usage",
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
                    <tr key={coupon.code} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-medium">{coupon.code}</td>
                      <td className="px-3 py-2.5">{coupon.type}</td>
                      <td className="px-3 py-2.5">{coupon.value}</td>
                      <td className="px-3 py-2.5">{coupon.usage}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {coupon.expiry}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] ${statusStyles[coupon.status]}`}
                        >
                          {coupon.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button className="mr-1 rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            setActiveCoupons((items) =>
                              items.map((item) =>
                                item.code === coupon.code
                                  ? {
                                      ...item,
                                      status:
                                        item.status === "Active"
                                          ? "Inactive"
                                          : "Active",
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300"
                        >
                          {coupon.status === "Active"
                            ? "Deactivate"
                            : "Activate"}
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
          <Panel title="Referral Bonus Rules" action="Edit Rules">
            <div className="grid gap-x-8 gap-y-3 p-4 text-xs sm:grid-cols-2">
              <div className="space-y-3">
                {[
                  ["Referrer Bonus Amount", "5%"],
                  ["Referee Bonus Amount", "2%"],
                  ["Min. Spend to Qualify", "$10"],
                ].map(([label, value]) => (
                  <label
                    key={label}
                    className="flex items-center justify-between gap-3 text-slate-400"
                  >
                    {label}
                    <input
                      defaultValue={value}
                      className="h-8 w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 text-right text-slate-100"
                    />
                  </label>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  ["Wagering Requirement (x)", "3"],
                  ["Validity Period (Days)", "30"],
                  ["Max Cashout Amount", "$500"],
                ].map(([label, value]) => (
                  <label
                    key={label}
                    className="flex items-center justify-between gap-3 text-slate-400"
                  >
                    {label}
                    <input
                      defaultValue={value}
                      className="h-8 w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 text-right text-slate-100"
                    />
                  </label>
                ))}
              </div>
            </div>
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
          <Panel title="Registration Bonus Rules" action="Edit Rules">
            <div className="grid gap-4 p-4 text-xs sm:grid-cols-2">
              {[
                ["Welcome Bonus Amount", "$25.00"],
                ["Minimum Deposit", "$10.00"],
                ["Wagering Requirement (x)", "3"],
                ["Validity Period (Days)", "30"],
              ].map(([label, value]) => (
                <label
                  key={label}
                  className="flex items-center justify-between gap-3 text-slate-400"
                >
                  {label}
                  <input
                    defaultValue={value}
                    className="h-8 w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 text-right text-slate-100"
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs">
              <span className="text-slate-400">
                Registration bonus is currently active
              </span>
              <button className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">
                Active
              </button>
            </div>
          </Panel>
        )}

        {show("withdrawFee") && (
          <Panel title="Withdraw Fee Schedule" action="Create New Fee Rule">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-500">
                <tr>
                  {[
                    "Payment Method",
                    "Fee Type",
                    "Fee Amount",
                    "Min/Max Amount",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} className="px-3 py-2.5">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  ["PayPal", "Fixed", "$1.00", "$1.00 - $100"],
                  ["Bank Transfer", "Fixed", "2%", "$1.00 - $500"],
                  ["Crypto", "Percentage", "$1.00", "$1.00"],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((value) => (
                      <td key={value} className="px-3 py-3">
                        {value}
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      <button className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
                        Edit Fee
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {show("commission") && (
          <Panel
            title="Game Round Commission (Bingo)"
            action="Edit Commission Rules"
          >
            <div className="space-y-3 p-4 text-xs">
              {[
                ["Commission Percentage (e.g. 5%)", "5%"],
                ["Tier 1 (<$10 pot: 4%)", "4%"],
                ["Tier 2 (>$10 pot: 6%)", "6%"],
              ].map(([label, value]) => (
                <label
                  key={label}
                  className="flex items-center justify-between gap-3 text-slate-400"
                >
                  {label}
                  <input
                    defaultValue={value}
                    className="h-8 w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 text-slate-100"
                  />
                </label>
              ))}
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
                    <th>Commission Earned</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-800">
                    <td className="py-2">365026489</td>
                    <td>Pot Size</td>
                    <td>$2.50</td>
                    <td>Oct 27, 2023, 11:30</td>
                  </tr>
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
