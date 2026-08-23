import React, { useEffect, useMemo, useState } from "react";
import {
  fetchUsers,
  adminSetBalance,
  toggleUserActive,
  toggleUserBlock,
} from "../../services/userService";

const statusClasses = {
  Active: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  Blocked: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  Inactive: "border-slate-500/30 bg-slate-500/15 text-slate-300",
};

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [actionError, setActionError] = useState("");
  const [editingBalanceId, setEditingBalanceId] = useState(null);
  const [balanceInput, setBalanceInput] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const response = await fetchUsers();
        const databaseUsers = (response.users || []).map((user) => ({
          id: user._id,
          name: [user.firstName, user.lastName].filter(Boolean).join(" "),
          username: user.username ? `@${user.username.replace(/^@/, "")}` : "",
          phone: user.phoneNumber || "Not provided",
          wallet: Number(user.balance) || 0,
          status: user.isBlocked
            ? "Blocked"
            : user.isActive === false
              ? "Inactive"
              : "Active",
          role: "Player",
          joined: user.createdAt
            ? new Date(user.createdAt).toISOString().slice(0, 10)
            : "Unknown",
          telegramId: user.telegramId,
        }));

        if (isMounted) setUsers(databaseUsers);
      } catch (error) {
        if (isMounted) setLoadError(error.message || "Failed to load users");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
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
  }, [query, statusFilter, users]);

  const totalWallet = users.reduce((total, user) => total + user.wallet, 0);
  const activeUsers = users.filter((user) => user.status === "Active").length;

  const updateUserStatus = async (user, action) => {
    setActionError("");
    try {
      const response =
        action === "block"
          ? await toggleUserBlock(user.telegramId)
          : await toggleUserActive(user.telegramId);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) => {
          if (currentUser.id !== user.id) return currentUser;
          if (action === "block") {
            return {
              ...currentUser,
              status: response.isBlocked
                ? "Blocked"
                : response.isActive
                  ? "Active"
                  : "Inactive",
            };
          }
          return {
            ...currentUser,
            status: response.isActive ? "Active" : "Inactive",
          };
        }),
      );
    } catch (error) {
      setActionError(error.message || "Failed to update user status");
    }
  };

  const saveUserBalance = async (user) => {
    setActionError("");
    const nextBalance = Number(balanceInput);
    if (!Number.isFinite(nextBalance) || nextBalance < 0) {
      setActionError("Enter a valid non-negative wallet balance.");
      return;
    }

    try {
      const response = await adminSetBalance({
        telegramId: user.telegramId,
        balance: nextBalance,
        reason: "Admin wallet edit",
      });
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, wallet: Number(response.newBalance) }
            : currentUser,
        ),
      );
      setEditingBalanceId(null);
    } catch (error) {
      setActionError(error.message || "Failed to update wallet balance");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-375 px-1 py-3 sm:px-2 sm:py-5 lg:px-4 lg:py-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl shadow-slate-950/40 sm:rounded-3xl sm:p-4 lg:rounded-4xl lg:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Users
              </div>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl lg:mt-2 lg:text-4xl">
                User Management
              </h1>
            </div>

            <button className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 sm:px-4 sm:py-2 sm:text-sm">
              + Add User
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3 md:grid-cols-3 lg:mt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:rounded-3xl sm:p-4 lg:p-5">
            <div className="text-sm text-slate-400">Total Users</div>
            <div className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-3xl">
              {users.length}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:rounded-3xl sm:p-4 lg:p-5">
            <div className="text-sm text-slate-400">Active Users</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-300 sm:mt-3 sm:text-3xl">
              {activeUsers}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:rounded-3xl sm:p-4 lg:p-5">
            <div className="text-sm text-slate-400">Wallet Balance</div>
            <div className="mt-2 text-2xl font-semibold text-violet-300 sm:mt-3 sm:text-3xl">
              {totalWallet.toFixed(2)} ETB
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl shadow-slate-950/40 sm:mt-4 sm:rounded-3xl sm:p-4 lg:mt-6 lg:rounded-4xl lg:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users by name, username, phone, role, telegram id..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Active", "Inactive", "Blocked"].map((option) => (
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

          {isLoading && (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-400">
              Loading users from the database...
            </div>
          )}

          {loadError && (
            <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-300">
              Unable to load users: {loadError}
            </div>
          )}

          {actionError && (
            <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
              {actionError}
            </div>
          )}

          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 sm:mt-4 sm:rounded-3xl lg:mt-6">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium sm:px-4 sm:py-3">
                    User
                  </th>
                  <th className="px-3 py-2 font-medium sm:px-4 sm:py-3">
                    Telegram
                  </th>
                  <th className="px-3 py-2 font-medium sm:px-4 sm:py-3">
                    Role
                  </th>
                  <th className="px-3 py-2 font-medium sm:px-4 sm:py-3">
                    Phone
                  </th>
                  <th className="px-3 py-2 font-medium sm:px-4 sm:py-3">
                    Wallet
                  </th>
                  <th className="px-3 py-2 font-medium sm:px-4 sm:py-3">
                    Status
                  </th>
                  <th className="px-3 py-2 font-medium sm:px-4 sm:py-3">
                    Joined
                  </th>
                  <th className="px-3 py-2 font-medium sm:px-4 sm:py-3">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-slate-800">
                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <div>
                        <div className="font-semibold text-slate-100">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.username || "Telegram user"}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-slate-300 sm:px-4 sm:py-4">
                      <div className="font-medium text-sky-300">
                        #{user.telegramId}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-300 sm:px-4 sm:py-4">
                      {user.role}
                    </td>
                    <td className="px-3 py-3 text-slate-300 sm:px-4 sm:py-4">
                      {user.phone}
                    </td>
                    <td className="px-3 py-3 text-slate-100 font-medium sm:px-4 sm:py-4">
                      {editingBalanceId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={balanceInput}
                            onChange={(event) =>
                              setBalanceInput(event.target.value)
                            }
                            className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                          />
                          <button
                            onClick={() => saveUserBalance(user)}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingBalanceId(null)}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{user.wallet.toFixed(2)} ETB</span>
                          <button
                            onClick={() => {
                              setEditingBalanceId(user.id);
                              setBalanceInput(String(user.wallet));
                            }}
                            className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-300"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses[user.status]}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-300 sm:px-4 sm:py-4">
                      {user.joined}
                    </td>
                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateUserStatus(user, "active")}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20"
                        >
                          {user.status === "Inactive"
                            ? "Activate"
                            : "Deactivate"}
                        </button>
                        <button
                          onClick={() => updateUserStatus(user, "block")}
                          className="rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                        >
                          {user.status === "Blocked" ? "Unblock" : "Block"}
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
