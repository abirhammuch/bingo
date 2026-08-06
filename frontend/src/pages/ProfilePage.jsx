import React from "react";
import EditProfile from "../components/EditProfile";
import BonnusAndHistory from "../components/BonnusAndHistory";
import AccountDetail from "../components/AccountDetail";
import Dangerzone from "../components/Dangerzone";
import Responsible from "../components/Responsible";

const ProfilePage = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-900/70 border border-slate-700 p-8 shadow-xl shadow-slate-950/20">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-slate-100">
            Profile & Settings
          </h1>
          <p className="text-sm text-slate-400">
            Manage your account information and preferences.
          </p>
        </div>
      </section>

      <EditProfile />
      <BonnusAndHistory />
      <AccountDetail />
      <Dangerzone />
      <Responsible />
    </div>
  );
};

export default ProfilePage;
