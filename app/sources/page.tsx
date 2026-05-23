"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Database, Plus, CheckCircle, ShieldCheck, Tag, FileCode, FileText } from "lucide-react";

interface SourceDoc {
  id: string;
  title: string;
  fileType: string;
  processingStatus: string;
  approvalStatus: string;
  tags: string | null;
  createdAt: string;
  _count?: { chunks: number };
}

export default function Sources() {
  const [sources, setSources] = useState<SourceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Source Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch("/api/sources");
        const data = await res.json();
        setSources(data);
      } catch (err) {
        console.error("Load sources error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSources();
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !text) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, fileType, text, tags })
      });
      
      if (res.ok) {
        const newDoc = await res.json();
        setSources([newDoc, ...sources]);
        setShowAddForm(false);
        setTitle("");
        setText("");
        setTags("");
      } else {
        console.error("Failed to add source");
      }
    } catch (err) {
      console.error("Add source error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Company Knowledge Base</h1>
            <p className="text-xs text-slate-400 mt-1">Upload technical guidelines, security policies, sales collaterals, and checklists as RAG targets</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Plus className="h-4.5 w-4.5" /> Upload Knowledge Document
          </button>
        </div>

        {/* Add Source Form Section */}
        {showAddForm && (
          <div className="relative mb-8 rounded-2xl border border-white/5 bg-[#0f111a] p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
            <h2 className="text-base font-bold text-white mb-4">Ingest New Knowledge Source</h2>
            <form onSubmit={handleAddSource} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Incident Response and Breach Notification Plan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">File Format</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-[#121420] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="docx">Word Document (.docx)</option>
                    <option value="txt">Text File (.txt)</option>
                    <option value="csv">Data Sheet (.csv)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Topic Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Security, Infrastructure, Incident Response"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
                <div className="flex items-center">
                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-[11px] text-emerald-300 flex items-start gap-2 w-full">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Your document will be automatically parsed and split into chunks to allow granular semantic-matching and source citations in generated drafts.</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Document Text Contents</label>
                <textarea
                  placeholder="Paste document text paragraphs here. Use double newlines to separate sections/chunks."
                  rows={6}
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
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
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submitting ? "Uploading & Chunking..." : "Parse & Chunk Document"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sources List Grid */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-20 rounded-2xl border border-white/5 bg-[#0f111a] animate-pulse" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-white/5 bg-[#0f111a] p-8 text-center">
            <Database className="h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-sm font-bold text-white">Knowledge Base Empty</h3>
            <p className="text-xs text-slate-400 mt-1">Upload technical guidelines or policies to ground AI answers.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((src) => (
              <div 
                key={src.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#0f111a] p-5 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                    {src.fileType === "pdf" ? (
                      <FileText className="h-5.5 w-5.5 text-emerald-400" />
                    ) : (
                      <FileCode className="h-5.5 w-5.5 text-purple-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate" title={src.title}>{src.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{src.fileType} source</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400">{new Date(src.createdAt).toLocaleDateString()}</span>
                      {src.tags && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <Tag className="h-3 w-3" /> {src.tags}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-white">{src._count?.chunks || 0} Chunks</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end font-medium">
                      <CheckCircle className="h-3.5 w-3.5" /> Ingested Successfully
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
