"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeedbackCard from "@/components/FeedbackCard";
import FeedbackForm from "@/components/FeedbackForm";
import ChangelogModal from "@/components/ChangelogModal";
import { ArrowLeft, MessageSquare, Layers, Calendar, Filter, Sparkles } from "lucide-react";

export default function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  // Unwrap the params promise using React.use (Standard in Next.js 16)
  const { boardId: boardSlug } = use(params);

  const [board, setBoard] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("votes"); // "votes" | "new"
  const [filter, setFilter] = useState("all"); // "all" | "Under Review" | "Planned" | "In Progress" | "Completed"
  const [changelogOpen, setChangelogOpen] = useState(false);

  useEffect(() => {
    loadBoardData();
  }, [boardSlug, sort, filter]);

  const loadBoardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/feedback/posts?boardSlug=${boardSlug}&sort=${sort}&filter=${filter}`
      );
      if (res.ok) {
        const data = await res.json();
        setBoard(data.board);
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Error loading board data:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenChangelog={() => setChangelogOpen(true)} />
      
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Boards
        </Link>

        {board && (
          <div className="border-b border-white/5 pb-6 mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              {board.name}
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              {board.description}
            </p>
          </div>
        )}

        {/* Responsive Feed Layout Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filters and Sorters Panel */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#11131f]/20 border border-white/5 p-3 rounded-2xl">
              
              {/* Status Filters */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "All", value: "all" },
                  { label: "Review", value: "Under Review" },
                  { label: "Planned", value: "Planned" },
                  { label: "In Progress", value: "In Progress" },
                  { label: "Completed", value: "Completed" }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                      filter === item.value
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Sorting Rules */}
              <div className="flex gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-xl">
                <button
                  onClick={() => setSort("votes")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    sort === "votes"
                      ? "bg-white/[0.05] text-indigo-400 font-extrabold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Most Upvotes
                </button>
                <button
                  onClick={() => setSort("new")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    sort === "new"
                      ? "bg-white/[0.05] text-indigo-400 font-extrabold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Newest
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-panel h-36 rounded-2xl animate-pulse bg-white/[0.01]" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-2xl text-slate-400">
                <Layers className="h-9 w-9 text-slate-600 mb-3" />
                <div className="font-semibold text-sm text-slate-300">No requests found</div>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  Be the first to submit a suggestion or try changing the filters above to find existing entries.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <FeedbackCard
                    key={post.id}
                    post={post}
                    onVoteToggled={loadBoardData}
                    onCommentAdded={loadBoardData}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Form Column */}
          {board && (
            <div className="lg:col-span-1">
              <FeedbackForm
                boardId={board.id}
                onSuccess={loadBoardData}
              />
            </div>
          )}
        </div>
      </main>

      <ChangelogModal isOpen={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  );
}
