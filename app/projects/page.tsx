"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { FileText, Plus, Calendar, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

interface Project {
  id: string;
  name: string;
  customerName: string;
  dueDate: string | null;
  status: string;
  questions: { id: string; status: string }[];
}

export default function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Project Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [questionnaireText, setQuestionnaireText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error("Load projects error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !customerName) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, customerName, dueDate, questionnaireText })
      });
      
      if (res.ok) {
        const newProj = await res.json();
        router.push(`/projects/${newProj.id}`);
      } else {
        console.error("Failed to create project");
      }
    } catch (err) {
      console.error("Create project error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = (project: Project) => {
    if (!project.questions || project.questions.length === 0) return 0;
    const approved = project.questions.filter(q => q.status === "Approved").length;
    return Math.round((approved / project.questions.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Questionnaire Projects</h1>
            <p className="text-xs text-slate-400 mt-1">Manage, draft, and approve client security questionnaires and RFPs</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-4.5 w-4.5" /> New Response Project
          </button>
        </div>

        {/* Create Project Form Section */}
        {showCreateForm && (
          <div className="relative mb-8 rounded-2xl border border-white/5 bg-[#0f111a] p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
            <h2 className="text-base font-bold text-white mb-4">Create New Response Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Security Review Q3"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Customer / Prospect Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Simulation Note</label>
                  <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3 text-[11px] text-indigo-300 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-400" />
                    <span>Provide raw text below to simulate PDF/XLSX text extraction. If left blank, the system automatically seeds typical security compliance questions.</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Questionnaire Raw Text (Optional)</label>
                <textarea
                  placeholder="Paste questions here (e.g. '1. Do you support SSO? \n 2. How often are backups performed?')"
                  rows={4}
                  value={questionnaireText}
                  onChange={(e) => setQuestionnaireText(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? "Extracting & Creating..." : "Parse & Create Project"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 rounded-2xl border border-white/5 bg-[#0f111a] animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-white/5 bg-[#0f111a] p-8 text-center">
            <HelpCircle className="h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-sm font-bold text-white">No Questionnaire Projects</h3>
            <p className="text-xs text-slate-400 mt-1">Start by parsing your first RFP or security questionnaire.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const progress = calculateProgress(project);
              return (
                <div 
                  key={project.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/5 bg-[#0f111a] p-5 hover:border-white/10 hover:shadow-2xl transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold border ${
                        project.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse"
                      }`}>
                        {project.status}
                      </span>
                      {project.dueDate && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Calendar className="h-3 w-3 text-indigo-400" />
                          {new Date(project.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Prospect: {project.customerName}</p>
                    <p className="text-xs text-slate-500 mt-3">{project.questions?.length || 0} questions extracted</p>
                  </div>

                  <div className="mt-6 border-t border-white/5 pt-4">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Human Approval</span>
                      <span className="font-semibold text-indigo-400">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <button
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.03] border border-white/5 py-2 text-xs font-bold text-white hover:bg-white/[0.08]"
                    >
                      Open Review Workspace <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
