import React, { useState } from "react";

const EditProfile = () => {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "A",
    lastName: "M User",
    phone: "+251973769266",
  });
  const [draft, setDraft] = useState(profile);

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  const saveChanges = () => {
    setProfile(draft);
    setEditing(false);
  };

  return (
    <div className="rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-2xl font-bold uppercase tracking-[0.18em] text-emerald-300 border border-emerald-500/20">
            AU
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Logged in as
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-100">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="text-sm text-slate-500">{profile.phone}</div>
          </div>
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-500 hover:text-emerald-100"
          >
            Edit
          </button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-rose-500 hover:text-rose-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveChanges}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
            >
              Save changes
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">
              First Name
            </div>
            <input
              type="text"
              value={draft.firstName}
              onChange={(e) =>
                setDraft({ ...draft, firstName: e.target.value })
              }
              className="w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="block">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">
              Last Name
            </div>
            <input
              type="text"
              value={draft.lastName}
              onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="block sm:col-span-3">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">
              Phone Number
            </div>
            <input
              type="text"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default EditProfile;
