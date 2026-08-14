import React, { useMemo, useState } from "react";

const seedUsers = [
  {
    id: 1,
    name: "Abebe Bekele",
    username: "@abebe_b",
    phone: "+251912345678",
    wallet: 12840,
    status: "Active",
    role: "Player",
    joined: "2026-08-01",
    telegramId: 101,
  },
  {
    id: 2,
    name: "Selam Desta",
    username: "@selam_d",
    phone: "+251911223344",
    wallet: 25400,
    status: "Active",
    role: "Player",
    joined: "2026-08-03",
    telegramId: 102,
  },
  {
    id: 3,
    name: "Yared Tadesse",
    username: "@yared_t",
    phone: "+251922334455",
    wallet: 540,
    status: "Pending",
    role: "Player",
    joined: "2026-08-08",
    telegramId: 103,
  },
  {
    id: 4,
    name: "Mihret Assefa",
    username: "@mihr",
    phone: "+251933445566",
    wallet: 9820,
    status: "Blocked",
    role: "VIP",
    joined: "2026-07-26",
    telegramId: 104,
  },
  {
    id: 5,
    name: "Daniel Tesfaye",
    username: "@daniel_t",
    phone: "+251944556677",
    wallet: 37500,
    status: "Active",
    role: "Affiliate",
    joined: "2026-08-09",
    telegramId: 105,
  },
  {
    id: 6,
    name: "Lidya Hailu",
    username: "@lidya_h",
    phone: "+251955667788",
    wallet: 6940,
    status: "Active",
    role: "Player",
    joined: "2026-08-10",
    telegramId: 106,
  },
];

const statusClasses = {
  Active: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  Pending: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  Blocked: "border-rose-500/30 bg-rose-500/15 text-rose-300",
};

const UserPage = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredUsers = useMemo(() => {
    return seedUsers.filter((user) => {
      const matchesQuery =
        query.trim() === "" ||
        [user.name, user.username, user.phone, user.role, user.telegramId]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  const totalWallet = seedUsers.reduce((total, user) => total + user.wallet, 0);
  const activeUsers = seedUsers.filter(
    (user) => user.status === "Active",
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1500px] mx-auto px-4 py-8">
        <div className="rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Users
              </div>
              <h1 className="mt-2 text-4xl font-semibold">User Management</h1>
            </div>

            <button className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20">
              + Add User
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Total Users</div>
            <div className="mt-4 text-3xl font-semibold">
              {seedUsers.length}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Active Users</div>
            <div className="mt-4 text-3xl font-semibold text-emerald-300">
              {activeUsers}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Wallet Balance</div>
            <div className="mt-4 text-3xl font-semibold text-violet-300">
              {totalWallet.toLocaleString()} ETB
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-4xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users by name, username, phone, role, telegram id..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Active", "Pending", "Blocked"].map((option) => (
                <button
                  key={option}
                  onClick={() => setStatusFilter(option)}
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    statusFilter === option
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "border border-slate-700 bg-slate-950/70 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Telegram</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Wallet</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-slate-800">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-slate-100">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.username || "Telegram user"}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      <div className="font-medium text-sky-300">#{user.telegramId}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{user.role}</td>
                    <td className="px-4 py-4 text-slate-300">{user.phone}</td>
                    <td className="px-4 py-4 text-slate-100 font-medium">
                      {user.wallet.toLocaleString()} ETB
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses[user.status]}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{user.joined}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20">
                          Edit
                        </button>
                        <button className="rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20">
                          Block
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-slate-400">
              No users match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPage;
