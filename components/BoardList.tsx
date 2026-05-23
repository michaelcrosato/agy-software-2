"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, ArrowRight, Lightbulb, Bug, HelpCircle, Layers } from "lucide-react";

export interface BoardWithCounts {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  _count?: {
    posts: number;
  };
}

export default function BoardList({ boards }: { boards: BoardWithCounts[] }) {
  const getIcon = (slug: string) => {
    if (slug.includes("bug")) {
      return <Bug className="h-6 w-6 text-red-400" />;
    }
    if (slug.includes("feature") || slug.includes("core")) {
      return <Lightbulb className="h-6 w-6 text-yellow-400" />;
    }
    if (slug.includes("help") || slug.includes("faq")) {
      return <HelpCircle className="h-6 w-6 text-blue-400" />;
    }
    return <Layers className="h-6 w-6 text-indigo-400" />;
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
      {boards.map((board) => (
        <Link
          key={board.id}
          href={`/boards/${board.slug}`}
          className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-[#11131f]/40 p-6 sm:p-8 hover:bg-[#11131f]/75 hover:border-white/10 transition-all shadow-lg overflow-hidden"
        >
          {/* Subtle glowing card background */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
          
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 mb-5 group-hover:scale-105 transition-transform">
              {getIcon(board.slug)}
            </div>
            
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors tracking-tight flex items-center gap-2">
              {board.name}
            </h3>
            
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {board.description || "No description provided. Submit your feedback to this board directly."}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              <MessageSquare className="h-3.5 w-3.5" />
              {board._count?.posts ?? 0} Feedback Items
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-indigo-400 transition-colors">
              Open Board
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
