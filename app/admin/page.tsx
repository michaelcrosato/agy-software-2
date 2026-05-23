"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Sparkles, 
  ArrowLeft, 
  Layers, 
  ThumbsUp, 
  MessageSquare, 
  Layout, 
  Cpu, 
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface Epic {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  posts: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    votes: Array<{ id: string }>;
    author: {
      name: string;
      avatarUrl: string;
    };
  }>;
}

interface Stats {
  totalPosts: number;
  totalVotes: number;
  totalComments: number;
  totalBoards: number;
}

export default function AdminDashboardPage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    totalVotes: 0,
    totalComments: 0,
    totalBoards: 0
  });
  const [loading, setLoading] = useState(true);
  const [clustering, setClustering] = useState(false);
  const [clusterResult, setClusterResult] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/cluster-epics");
      if (res.ok) {
        const data = await res.json();
        setEpics(data.epics);
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Error loading admin dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClusterFeedback = async () => {
    try {
      setClustering(true);
      setClusterResult(null);
      const res = await fetch("/api/admin/cluster-epics", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setClusterResult(data.message);
        fetchAdminData();
      } else {
        alert(data.message || "Failed to cluster feedback.");
      }
    } catch (e) {
      console.error("Clustering error:", e);
    } finally {
      setClustering(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category.toLowerCase()) {
      case "bug": return "🐛";
      case "improvement": return "⚡";
      default: return "🚀";
    }
  };

  // Compute severity/impact score for an Epic based on the sum of all votes of its posts
  const computeEpicScore = (epic: Epic) => {
    return epic.posts.reduce((acc, post) => acc + post.votes.length, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07080d]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mb-2 group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Cpu className="h-8 w-8 text-indigo-400" />
              Admin Center
              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/20">
                AI Sprints
              </span>
            </h1>
          </div>

          {/* Epic Generator Trigger Button */}
          <button
            onClick={handleClusterFeedback}
            disabled={clustering}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all font-semibold"
          >
            <Sparkles className={`h-4 w-4 ${clustering ? "animate-spin" : ""}`} />
            {clustering ? "Synthesizing clusters..." : "Trigger AI Epics Clustering"}
          </button>
        </div>

        {/* Dynamic Success Alert banner */}
        {clusterResult && (
          <div className="mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-start gap-3 animate-in fade-in duration-200">
            <TrendingUp className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-indigo-300">AI Clustering Synthesis Complete</div>
              <p className="text-xs text-slate-400 mt-1 leading-normal">{clusterResult}</p>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#11131f]/25">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Boards</span>
              <Layout className="h-4.5 w-4.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalBoards}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-1">Configured feedback categories</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#11131f]/25">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Total Posts</span>
              <MessageSquare className="h-4.5 w-4.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalPosts}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-1">Unique customer requests</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#11131f]/25">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Community Votes</span>
              <ThumbsUp className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalVotes}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-1">Total prioritization weight</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#11131f]/25">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Active Epics</span>
              <Layers className="h-4.5 w-4.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{epics.length}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-1">Synthesized product epics</div>
          </div>
        </div>

        {/* Main Content Dashboard Area */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Epics Listing Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                Synthesized Product Epics
              </h2>
              <span className="text-xs text-slate-500 font-medium">Auto-clustered themes</span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="glass-panel h-48 rounded-2xl animate-pulse bg-white/[0.01]" />
                ))}
              </div>
            ) : epics.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-2xl text-slate-400">
                <Layers className="h-9 w-9 text-slate-600 mb-3" />
                <div className="font-semibold text-sm text-slate-300">No Epics Synthesized Yet</div>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  Trigger the AI Epics Clustering above to scan unorganized community posts and group them into logical themes automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {epics.map((epic) => {
                  const score = computeEpicScore(epic);
                  return (
                    <div 
                      key={epic.id} 
                      className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#11131f]/15 space-y-4 hover:border-indigo-500/20 transition-all"
                    >
                      {/* Epic Header Block */}
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-3">
                        <div className="space-y-1">
                          <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                            {epic.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">{epic.description}</p>
                        </div>
                        
                        {/* Priority Score badge */}
                        <div className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-400">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Priority: {score}
                        </div>
                      </div>

                      {/* Associated Tickets */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Clustered Feedback Tickets</h4>
                        
                        {epic.posts.length === 0 ? (
                          <p className="text-xs text-slate-600 pl-2">No active tickets mapped to this epic.</p>
                        ) : (
                          <div className="space-y-2">
                            {epic.posts.map((post) => (
                              <div 
                                key={post.id} 
                                className="flex items-center justify-between gap-4 bg-[#0c0d14]/40 border border-white/5 p-3 rounded-xl text-xs hover:bg-[#0c0d14]/70 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm flex-shrink-0">{getCategoryEmoji(post.category)}</span>
                                  <div className="font-semibold text-white truncate max-w-sm">{post.title}</div>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span className="text-[10px] font-semibold text-slate-500 rounded bg-white/[0.02] border border-white/5 px-2 py-0.5">
                                    {post.status}
                                  </span>
                                  <div className="flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                                    <ThumbsUp className="h-3 w-3" />
                                    {post.votes.length}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Tips/Help Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#11131f]/20 space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-indigo-400" />
                  AI Clustering Tips
                </h3>
              </div>
              
              <ul className="space-y-3.5 text-xs text-slate-400 leading-relaxed font-medium">
                <li className="flex gap-2">
                  <ChevronRight className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Semantic analysis:</strong> The algorithm tokenizes feedback tickets, ignores common words, and finds overlapping requirements to group matching posts automatically.
                  </span>
                </li>
                <li className="flex gap-2">
                  <ChevronRight className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Priority values:</strong> Sprints can be planned around high-impact Epics by ranking them according to total customer vote counts.
                  </span>
                </li>
                <li className="flex gap-2">
                  <ChevronRight className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Sandbox ready:</strong> Seed new feedback posts or upvote ticket entries in the boards to trigger clustering and test dashboard functionality.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
