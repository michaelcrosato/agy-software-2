"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Calendar, BookOpen, CheckCircle, ArrowRight, PenTool } from "lucide-react";

export interface ChangelogItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  publishedAt: string | null;
}

export default function ChangelogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchChangelogs();
    }
  }, [isOpen]);

  const fetchChangelogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/changelog");
      if (res.ok) {
        const data = await res.json();
        setChangelogs(data);
      }
    } catch (e) {
      console.error("Error fetching changelogs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIChangelog = async () => {
    try {
      setDrafting(true);
      const res = await fetch("/api/changelog", {
        method: "POST",
      });
      if (res.ok) {
        const newLog = await res.json();
        setChangelogs([newLog, ...changelogs]);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to generate AI Changelog.");
      }
    } catch (e) {
      console.error("AI Generation error:", e);
    } finally {
      setDrafting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Sliding Panel */}
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#0c0d14] p-6 shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Product Changelogs</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* AI Action Panel for testing */}
        <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
            <Sparkles className="h-4 w-4 text-purple-400" />
            AI-POWERED CHANGELOG WRITER
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            Admins can synthesize completed features directly into release logs with one-click summarization.
          </p>
          <button
            onClick={handleGenerateAIChangelog}
            disabled={drafting}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:brightness-110 active:scale-95 disabled:scale-100 disabled:brightness-75 transition-all w-full"
          >
            {drafting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sifting & Summarizing Completed Features...
              </>
            ) : (
              <>
                <PenTool className="h-3.5 w-3.5" />
                Generate Release Log from Completed Items
              </>
            )}
          </button>
        </div>

        {/* Scrollable list */}
        <div className="mt-6 flex-1 overflow-y-auto pr-1 space-y-6">
          {loading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <span className="text-xs">Loading timeline...</span>
            </div>
          ) : changelogs.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-xl text-slate-400">
              <BookOpen className="h-8 w-8 text-slate-600 mb-3" />
              <div className="font-semibold text-sm text-slate-300">No release logs published yet</div>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Completed boards will generate beautiful changelog items here once released.
              </p>
            </div>
          ) : (
            <div className="relative border-l border-white/5 ml-3 pl-6 space-y-8">
              {changelogs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Glowing bullet indicator */}
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0c0d14] border border-indigo-500/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform" />
                  </span>
                  
                  <div className="flex items-center gap-2 text-[10px] font-medium text-indigo-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(log.publishedAt || log.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </div>
                  
                  <h3 className="mt-1 text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {log.title}
                  </h3>
                  
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {log.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
