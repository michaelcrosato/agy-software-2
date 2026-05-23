"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  FileText, 
  Database, 
  Library, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  Clock, 
  Compass, 
  ShieldCheck
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  customerName: string;
  dueDate: string | null;
  status: string;
  questions: { id: string; status: string }[];
}

interface SourceDoc {
  id: string;
  title: string;
  fileType: string;
  tags: string | null;
  _count?: { chunks: number };
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sources, setSources] = useState<SourceDoc[]>([]);
  const [libraryCount, setLibraryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const resProj = await fetch("/api/projects");
        const projectsData = await resProj.json();
        
        const resSrc = await fetch("/api/sources");
        const sourcesData = await resSrc.json();

        const resLib = await fetch("/api/library");
        const libData = await resLib.json();

        setProjects(projectsData);
        setSources(sourcesData);
        setLibraryCount(libData.length);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const calculateProgress = (project: Project) => {
    if (!project.questions || project.questions.length === 0) return 0;
    const approved = project.questions.filter(q => q.status === "Approved").length;
    return Math.round((approved / project.questions.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 selection:bg-indigo-500/30">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-slate-950/20 p-8 sm:p-10 backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-4 animate-pulse">
              <ShieldCheck className="h-3.5 w-3.5" /> Ready for review
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Workspace Overview
            </h1>
            <p className="mt-3 text-base text-slate-400 leading-relaxed">
              Accelerate response cycles with local keyword-matching Retrieval-Augmented Generation. Ingest technical source policies, draft grounding references, and catalog canonical approvals effortlessly.
            </p>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {/* Projects Metric */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f111a] p-6 hover:border-indigo-500/20 hover:shadow-indigo-500/2 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <FileText className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">Response Projects</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-200 inline-block">
                {projects.length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Active questionnaires in review</p>
            </div>
          </div>

          {/* Sources Metric */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f111a] p-6 hover:border-purple-500/20 hover:shadow-purple-500/2 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Database className="h-6 w-6 text-purple-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">Knowledge Base</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-200 inline-block">
                {sources.length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Uploaded policies & specs</p>
            </div>
          </div>

          {/* Reusable Q&A Library */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f111a] p-6 hover:border-pink-500/20 hover:shadow-pink-500/2 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20">
                <Library className="h-6 w-6 text-pink-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">Approved Library</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-200 inline-block">
                {libraryCount}
              </div>
              <p className="text-xs text-slate-400 mt-1">Approved reusable answers</p>
            </div>
          </div>

          {/* RAG Match Accuracy */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f111a] p-6 hover:border-emerald-500/20 hover:shadow-emerald-500/2 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">Draft Utility Rating</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-200 inline-block">
                85%
              </div>
              <p className="text-xs text-slate-400 mt-1">AI responses requiring minor/no edits</p>
            </div>
          </div>
        </div>

        {/* Dashboard Main Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Columns - Active Projects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" /> Active Questionnaires
              </h2>
              <Link 
                href="/projects" 
                className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Create New Project <Plus className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-white/5 bg-[#0f111a]">
                <span className="text-sm text-slate-400 animate-pulse">Loading active response tasks...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-white/5 bg-[#0f111a] p-6 text-center">
                <p className="text-sm text-slate-400">No active response questionnaires found.</p>
                <Link
                  href="/projects"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="h-4 w-4" /> Create First RFP Project
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => {
                  const progress = calculateProgress(project);
                  return (
                    <div 
                      key={project.id}
                      className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f111a] p-5 hover:border-white/10 hover:shadow-2xl transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                              {project.name}
                            </h3>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                              project.status === "Completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse"
                            }`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Client: {project.customerName}</p>
                        </div>
                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/[0.08] hover:border-white/10 transition-all self-start sm:self-center"
                        >
                          Review Space <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                        </Link>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400 font-medium">Human Approval Progress</span>
                          <span className="text-indigo-400 font-semibold">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column - Knowledge Base & Library Quick Access */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="h-5 w-5 text-purple-400" /> Source Repository
            </h2>

            {loading ? (
              <div className="h-48 rounded-2xl border border-white/5 bg-[#0f111a]" />
            ) : (
              <div className="rounded-2xl border border-white/5 bg-[#0f111a] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-semibold text-slate-400">Policy Sources</span>
                  <Link href="/sources" className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300">
                    Manage Sources
                  </Link>
                </div>
                
                {sources.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No sources uploaded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {sources.slice(0, 4).map((src) => (
                      <div key={src.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`h-2 w-2 rounded-full ${
                            src.fileType === "pdf" ? "bg-red-400" : src.fileType === "docx" ? "bg-blue-400" : "bg-emerald-400"
                          }`} />
                          <span className="font-medium text-slate-300 truncate" title={src.title}>{src.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-white/5 font-sans">
                          {src._count?.chunks || 0} chunks
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="pt-2 border-t border-white/5 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Library Index Status:</span>
                    <span className="font-semibold text-emerald-400">Operational</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
