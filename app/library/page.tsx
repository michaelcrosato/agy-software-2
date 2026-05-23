"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Library, Search, Plus, Award, Tag, Sparkles, AlertCircle } from "lucide-react";

interface ApprovedAnswer {
  id: string;
  canonicalQuestion: string;
  answerText: string;
  category: string;
  tags: string | null;
  usageCount: number;
  lastUsedAt: string | null;
}

export default function ReusableLibrary() {
  const [answers, setAnswers] = useState<ApprovedAnswer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New Canonical Answer Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [category, setCategory] = useState("Security");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const res = await fetch(`/api/library?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setAnswers(data);
      } catch (err) {
        console.error("Load library error:", err);
      } finally {
        setLoading(false);
      }
    }
    const delayDebounceFn = setTimeout(() => {
      loadLibrary();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleAddAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answerText) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalQuestion: question, answerText, category, tags })
      });

      if (res.ok) {
        const newAns = await res.json();
        setAnswers([newAns, ...answers]);
        setShowAddForm(false);
        setQuestion("");
        setAnswerText("");
        setTags("");
      } else {
        console.error("Failed to add library answer");
      }
    } catch (err) {
      console.error("Add library answer error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Approved Reusable Q&A Library</h1>
            <p className="text-xs text-slate-400 mt-1">Review canonical company responses that are automatically matched against recurring questionnaire items</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 self-start sm:self-center"
          >
            <Plus className="h-4.5 w-4.5" /> Add Canonical Q&A
          </button>
        </div>

        {/* Add Canonical Answer Form */}
        {showAddForm && (
          <div className="relative mb-8 rounded-2xl border border-white/5 bg-[#0f111a] p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
            <h2 className="text-base font-bold text-white mb-4">Add Canonical Approved Answer</h2>
            <form onSubmit={handleAddAnswer} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Canonical Question</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Do you support Multi-Factor Authentication (MFA)?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-[#121420] px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="Security">Security</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Compliance">Compliance</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. MFA, Security, Policy"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex items-center">
                  <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3 text-[11px] text-indigo-300 flex items-start gap-2 w-full">
                    <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
                    <span>Canonical entries are indexed by the local search engine and prioritized over raw policy docs for auto-drafting.</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Approved Canonical Answer</label>
                <textarea
                  placeholder="Provide the exact approved response text here..."
                  rows={4}
                  required
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Add to Library"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search approved answers by keyword, question, or category tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-white/[0.02] pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
          />
        </div>

        {/* Library Items List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-28 rounded-2xl border border-white/5 bg-[#0f111a] animate-pulse" />
            ))}
          </div>
        ) : answers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-white/5 bg-[#0f111a] p-8 text-center">
            <AlertCircle className="h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-sm font-bold text-white">No Canonical Answers Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try another search or add a canonical approved Q&A above.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {answers.map((ans) => (
              <div 
                key={ans.id}
                className="rounded-2xl border border-white/5 bg-[#0f111a] p-6 hover:border-white/10 hover:shadow-2xl transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-semibold text-indigo-400 border border-indigo-500/20">
                        {ans.category}
                      </span>
                      {ans.tags && ans.tags.split(",").map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-white/5 px-2 py-0.5 rounded">
                          <Tag className="h-2.5 w-2.5" /> {tag.trim()}
                        </span>
                      ))}
                    </div>
                    
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      Q: {ans.canonicalQuestion}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-semibold self-start sm:self-center bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-3 py-1 font-sans">
                    <Award className="h-3.5 w-3.5" /> Used {ans.usageCount} times
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white/[0.01] border border-white/5 p-4">
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                    A: {ans.answerText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
