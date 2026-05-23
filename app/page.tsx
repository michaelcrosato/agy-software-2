"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BoardList, { BoardWithCounts } from "@/components/BoardList";
import ChangelogModal from "@/components/ChangelogModal";
import { Sparkles, MessageSquare, ArrowRight, Zap, Target } from "lucide-react";

export default function HomePage() {
  const [boards, setBoards] = useState<BoardWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [changelogOpen, setChangelogOpen] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/boards");
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
      }
    } catch (e) {
      console.error("Error loading boards:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenChangelog={() => setChangelogOpen(true)} />
      
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Glow Header Block */}
        <div className="relative text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="absolute -left-20 top-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-40 w-40 rounded-full bg-purple-500/5 blur-3xl" />
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Empowering Autonomous Engineering
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            The Modern <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Feedback Loop
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Collect customer requests, prioritize updates with community upvotes, and draft AI-synthesized changelogs in one premium, cohesive system.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid gap-6 sm:grid-cols-3 mb-16 sm:mb-20">
          <div className="glass-panel p-5 rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Anti-Duplicate UX</h4>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Real-time keyword overlapping alerts users to upvote existing items instead of submitting duplicate posts.
              </p>
            </div>
          </div>
          
          <div className="glass-panel p-5 rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">AI Release Writer</h4>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Synthesizes completed features and fixes into polished product changelogs with one click.
              </p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Predictable Value</h4>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Elegant flat-rate subscriptions designed for modern B2B SaaS builders, indie hackers, and open-source.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Boards Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
              Feedback Boards
            </h2>
            <span className="text-xs text-slate-500 font-medium">Select a board to submit or view requests</span>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="glass-panel h-52 rounded-2xl animate-pulse bg-white/[0.01]" />
              ))}
            </div>
          ) : (
            <BoardList boards={boards} />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-[#090A0F]/60 py-6 text-center text-xs text-slate-600 font-medium">
        <p>© 2026 FeedFlow SaaS Inc. All rights reserved. Active Sandbox.</p>
      </footer>

      {/* Changelog Timeline Sliding Modal Drawer */}
      <ChangelogModal isOpen={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  );
}
