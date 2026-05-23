"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, ChevronDown, ChevronUp, ThumbsUp, Calendar, Send, Sparkles } from "lucide-react";

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface FeedbackPostWithDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  votes: { userId: string }[];
  comments: Comment[];
}

export default function FeedbackCard({
  post,
  onVoteToggled,
  onCommentAdded
}: {
  post: FeedbackPostWithDetails;
  onVoteToggled: () => void;
  onCommentAdded: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Sync user state and voted status
  const syncUserState = () => {
    const savedUserId = localStorage.getItem("feedflow_user_id");
    setCurrentUserId(savedUserId);
    if (savedUserId && post.votes) {
      setHasVoted(post.votes.some(v => v.userId === savedUserId));
    }
  };

  useEffect(() => {
    syncUserState();
    
    // Listen for mock user switcher changes
    window.addEventListener("feedflow_user_changed", syncUserState);
    return () => window.removeEventListener("feedflow_user_changed", syncUserState);
  }, [post.votes]);

  const handleVoteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;

    try {
      const res = await fetch("/api/feedback/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          userId: currentUserId
        })
      });
      if (res.ok) {
        onVoteToggled();
      }
    } catch (err) {
      console.error("Upvote error:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    try {
      setCommentSubmitting(true);
      const res = await fetch("/api/feedback/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          userId: currentUserId,
          content: newComment
        })
      });
      if (res.ok) {
        setNewComment("");
        onCommentAdded();
      }
    } catch (err) {
      console.error("Comment submission error:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "planned": return "badge-planned";
      case "in progress": return "badge-in-progress";
      case "completed": return "badge-completed";
      case "closed": return "badge-closed";
      default: return "badge-under-review";
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "bug": return "🐛";
      case "improvement": return "⚡";
      default: return "🚀";
    }
  };

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      className="glass-panel p-5 rounded-2xl flex flex-col gap-4 hover-lift cursor-pointer transition-all border border-white/5 bg-[#11131f]/35 select-none"
    >
      <div className="flex items-start gap-4">
        {/* Upvote Column */}
        <button
          onClick={handleVoteClick}
          className={`flex flex-col items-center justify-center gap-1.5 h-14 w-12 rounded-xl border transition-all ${
            hasVoted 
              ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 font-bold scale-105" 
              : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:border-white/10"
          }`}
        >
          <ThumbsUp className={`h-4 w-4 ${hasVoted ? "fill-indigo-500/20" : ""}`} />
          <span className="text-xs leading-none">{post.votes?.length ?? 0}</span>
        </button>

        {/* Post Summary Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusClass(post.status)}`}>
              {post.status}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/5 text-slate-300">
              {getCategoryEmoji(post.category)} {post.category}
            </span>
          </div>

          <h4 className="text-base font-bold text-white tracking-tight leading-snug truncate group-hover:text-indigo-300 transition-colors">
            {post.title}
          </h4>

          <p className={`text-xs text-slate-400 leading-relaxed mt-2 ${expanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
            {post.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] text-slate-500 font-medium border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5">
              <img 
                src={post.author.avatarUrl || "https://avatars.githubusercontent.com/u/99?v=4"} 
                alt={post.author.name || "User"}
                className="h-4.5 w-4.5 rounded-md object-cover border border-white/10"
              />
              <span className="text-slate-400 font-semibold">{post.author.name || "Anonymous"}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>

            <div className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {post.comments?.length ?? 0} Comments
            </div>

            <div className="ml-auto flex items-center gap-1 text-indigo-400">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "Collapse details" : "Expand thread"}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Comments & Comment Submission Section */}
      {expanded && (
        <div className="border-t border-white/5 pt-4 mt-1 space-y-4 animate-in slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-3.5">
            <h5 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-1">Discussion</h5>
            
            {post.comments?.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 pl-3 border-l-2 border-white/5">
                No comments shared yet. Start the conversation below!
              </div>
            ) : (
              <div className="space-y-3 pl-3 border-l-2 border-white/5">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 text-xs bg-[#0c0d14]/40 p-3 rounded-xl border border-white/5">
                    <img 
                      src={comment.user.avatarUrl || "https://avatars.githubusercontent.com/u/99?v=4"} 
                      alt={comment.user.name || "User"}
                      className="h-6 w-6 rounded-md object-cover border border-white/10 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-semibold text-slate-300 text-[10px] mb-1">
                        <span>{comment.user.name}</span>
                        <span className="text-slate-500 font-medium">
                          {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed leading-normal">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment input form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2.5 items-center mt-3 pt-2">
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a constructive reply..."
              required
              className="flex-1 rounded-xl px-3.5 py-2 text-xs glass-input placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={commentSubmitting || !newComment.trim()}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-50 disabled:scale-100"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
