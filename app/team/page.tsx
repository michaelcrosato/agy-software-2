"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Users, UserPlus, Mail, Shield, CheckCircle2, AlertCircle } from "lucide-react";

interface Teammate {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export default function TeamManagement() {
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  
  // Status feedback states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function loadTeammates() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setTeammates(data);
      }
    } catch (err) {
      console.error("Failed to load teammates:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeammates();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, email: email.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Teammate ${data.name || email} invited successfully!`);
        setName("");
        setEmail("");
        await loadTeammates();
      } else {
        setErrorMsg(data.message || "Failed to invite teammate.");
      }
    } catch (err) {
      console.error("Invite error:", err);
      setErrorMsg("An unexpected server error occurred.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 selection:bg-indigo-500/30">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900/40 to-slate-950 p-8 sm:p-10 backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/10 to-sky-500/10 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-4">
              <Shield className="h-3.5 w-3.5" /> Workspace Members
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Team Collaboration
            </h1>
            <p className="mt-3 text-base text-slate-400 leading-relaxed font-sans">
              Invite subject-matter experts, security officers, and proposal reviewers. Assigned technical questions are routed instantly to the right team member for validation.
            </p>
          </div>
        </div>

        {/* Form and List Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Column: Invite Form */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/5 bg-[#0f111a] p-6 shadow-xl sticky top-24">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <UserPlus className="h-5 w-5 text-indigo-400" /> Invite Teammate
              </h2>
              
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Teammate Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Robert Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-[#07080e] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. robert@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/5 bg-[#07080e] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  </div>
                </div>

                {successMsg && (
                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs text-emerald-400 flex items-start gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-3 text-xs text-rose-400 flex items-start gap-2 animate-in fade-in duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={inviting || !email}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {inviting ? "Sending Invitation..." : "Send Invitation"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Columns: Teammates List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-400" /> Workspace Team ({teammates.length})
            </h2>

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-[#0f111a]">
                <span className="text-sm text-slate-400 animate-pulse">Loading teammates...</span>
              </div>
            ) : teammates.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-[#0f111a] text-slate-400">
                No teammates registered yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {teammates.map((member) => (
                  <div
                    key={member.id}
                    className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f111a] p-5 hover:border-white/10 hover:shadow-2xl transition-all group flex items-center gap-4"
                  >
                    {member.avatarUrl ? (
                      <img
                        className="h-12 w-12 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform shrink-0"
                        src={member.avatarUrl}
                        alt={member.name || member.email}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl border border-white/10 bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                        {(member.name || member.email)[0].toUpperCase()}
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate">
                        {member.name || "Pending User"}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">{member.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-semibold text-indigo-400 border border-indigo-500/20">
                          Active Member
                        </span>
                        <span className="text-[9px] text-slate-500 font-sans">
                          Joined {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
