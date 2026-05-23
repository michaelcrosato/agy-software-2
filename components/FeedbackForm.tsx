"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, AlertCircle, ThumbsUp, Sparkles } from "lucide-react";

export interface DuplicatePost {
  id: string;
  title: string;
  votesCount: number;
  status: string;
}

export default function FeedbackForm({
  boardId,
  onSuccess
}: {
  boardId: string;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Feature");
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicatePost[]>([]);
  const [checking, setChecking] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced duplicate detection
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (title.trim().length < 5) {
      setDuplicates([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        setChecking(true);
        const res = await fetch(`/api/feedback/check-duplicates?title=${encodeURIComponent(title)}&boardId=${boardId}`);
        if (res.ok) {
          const data = await res.json();
          setDuplicates(data);
        }
      } catch (e) {
        console.error("Error checking duplicates:", e);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [title, boardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      const authorId = localStorage.getItem("feedflow_user_id") || "";
      
      const res = await fetch("/api/feedback/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          boardId,
          authorId
        })
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setCategory("Feature");
        setDuplicates([]);
        onSuccess();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to submit feedback.");
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickUpvote = async (postId: string) => {
    try {
      const userId = localStorage.getItem("feedflow_user_id") || "";
      const res = await fetch("/api/feedback/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId })
      });
      if (res.ok) {
        // Clear forms and reload board list
        setTitle("");
        setDescription("");
        setDuplicates([]);
        onSuccess();
      }
    } catch (e) {
      console.error("Quick upvote error:", e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl space-y-5 sticky top-24">
      <div className="border-b border-white/5 pb-3">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <PlusCircle className="h-4.5 w-4.5 text-indigo-400" />
          Submit Feedback
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          Have an idea or spotted a bug? Let us know!
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Add support for Google SSO..."
          required
          className="w-full rounded-xl px-3.5 py-2.5 text-sm glass-input placeholder:text-slate-600"
        />
      </div>

      {/* Duplicate Warning Panel */}
      {duplicates.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-yellow-300">
            <AlertCircle className="h-4 w-4" />
            Is your idea already listed?
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            We found similar requests! Upvote them to give them higher priority rather than making a duplicate:
          </p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {duplicates.map((dup) => (
              <div key={dup.id} className="flex items-center justify-between gap-3 bg-[#0c0d14]/60 p-2 rounded-lg border border-white/5">
                <div className="text-[11px] text-slate-200 truncate font-medium">{dup.title}</div>
                <button
                  type="button"
                  onClick={() => handleQuickUpvote(dup.id)}
                  className="flex items-center gap-1.5 rounded-md bg-yellow-500/10 px-2 py-1 text-[10px] font-bold text-yellow-400 hover:bg-yellow-500/20 active:scale-95 transition-all"
                >
                  <ThumbsUp className="h-3 w-3" />
                  {dup.votesCount}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#0c0d14] border border-white/8 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="Feature">🚀 Feature Request</option>
          <option value="Bug">🐛 Bug Report</option>
          <option value="Improvement">⚡ Improvement</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Details</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please explain the problem or describe the feature request in detail..."
          required
          rows={4}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm glass-input placeholder:text-slate-600 resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || checking}
        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:brightness-110 active:scale-95 disabled:scale-100 disabled:brightness-75 transition-all w-full"
      >
        {submitting ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
