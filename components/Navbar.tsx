"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Users, Award, BookOpen, Layers, Cpu } from "lucide-react";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: "alex-johnson-id-seeded", // Matches seed DB IDs if possible, or we will query them in API
    name: "Alex Johnson",
    email: "alex@example.com",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  },
  {
    id: "sarah-miller-id-seeded",
    name: "Sarah Miller",
    email: "sarah@example.com",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
  },
  {
    id: "michael-crosato-id-seeded",
    name: "Michael Crosato",
    email: "michael@example.com",
    avatarUrl: "https://avatars.githubusercontent.com/u/58404198?v=4",
  }
];

export default function Navbar({ onOpenChangelog }: { onOpenChangelog?: () => void }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Load or initialize active user
    const savedUserId = localStorage.getItem("feedflow_user_id");
    const foundUser = MOCK_USERS.find(u => u.id === savedUserId) || MOCK_USERS[0];
    setCurrentUser(foundUser);
    localStorage.setItem("feedflow_user_id", foundUser.id);
    localStorage.setItem("feedflow_user_name", foundUser.name);
    localStorage.setItem("feedflow_user_email", foundUser.email);
    
    // Dispatch custom event to notify all other client components to reload user details
    window.dispatchEvent(new Event("feedflow_user_changed"));
  }, []);

  const switchUser = (user: MockUser) => {
    setCurrentUser(user);
    localStorage.setItem("feedflow_user_id", user.id);
    localStorage.setItem("feedflow_user_name", user.name);
    localStorage.setItem("feedflow_user_email", user.email);
    setDropdownOpen(false);
    
    // Dispatch custom event to notify all other client components to reload user details
    window.dispatchEvent(new Event("feedflow_user_changed"));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#090A0F]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 shadow-lg group-hover:scale-105 transition-all">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent tracking-tight">
            FeedFlow
          </span>
          <span className="hidden sm:inline-block rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
            AI-Native
          </span>
        </Link>

        {/* Navigation Elements */}
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-400" />
            Boards
          </Link>
          
          {onOpenChangelog ? (
            <button 
              onClick={onOpenChangelog}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="h-4 w-4 text-purple-400" />
              Changelogs
            </button>
          ) : (
            <Link href="/changelog" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-purple-400" />
              Changelogs
            </Link>
          )}

          <Link href="/admin" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-emerald-400" />
            Admin
          </Link>

          {/* User Switcher Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-1.5 pr-3 hover:bg-white/[0.06] transition-colors focus:outline-none"
                id="user-menu-button"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <img
                  className="h-7 w-7 rounded-lg object-cover border border-white/10"
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 leading-none">Testing Role</div>
                </div>
                <Users className="h-3.5 w-3.5 text-slate-400 ml-1" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-white/10 bg-[#11131f] p-1.5 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                    <p className="text-xs font-medium text-slate-400">Pair Program & Switch Tester</p>
                    <p className="text-[10px] text-indigo-400 font-medium">Verify multi-user upvotes instantly</p>
                  </div>
                  <div className="space-y-1">
                    {MOCK_USERS.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => switchUser(user)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          currentUser.id === user.id
                            ? "bg-indigo-500/10 text-white border border-indigo-500/20"
                            : "text-slate-300 hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        <img
                          className="h-8 w-8 rounded-md object-cover"
                          src={user.avatarUrl}
                          alt={user.name}
                        />
                        <div>
                          <div className="font-medium text-xs text-white">{user.name}</div>
                          <div className="text-[10px] text-slate-400">{user.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
