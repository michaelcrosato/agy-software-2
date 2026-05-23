"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  MessageSquare, 
  Plus, 
  User, 
  Clock, 
  FolderPlus, 
  BookOpen, 
  CheckCircle,
  HelpCircle,
  FileText
} from "lucide-react";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl: string | null;
  };
}

interface SourceDoc {
  title: string;
  fileType: string;
}

interface SourceChunk {
  text: string;
  sectionTitle: string | null;
  pageNumber: number | null;
  sourceDocument: SourceDoc;
}

interface Citation {
  id: string;
  quoteExcerpt: string;
  sourceChunk: SourceChunk;
}

interface AnswerDraft {
  id: string;
  text: string;
  citations: Citation[];
}

interface Question {
  id: string;
  originalText: string;
  category: string;
  answerType: string;
  sourceLocation: string | null;
  status: string;
  confidenceLabel: string;
  assignedUserId: string | null;
  assignedUser?: { name: string; avatarUrl: string | null } | null;
  answerDraft: AnswerDraft | null;
  comments: Comment[];
}

interface Project {
  id: string;
  name: string;
  customerName: string;
  dueDate: string | null;
  status: string;
  questions: Question[];
}

interface WorkspaceUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export default function ProjectWorkspace() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Editor State
  const [answerText, setAnswerText] = useState("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [status, setStatus] = useState("Drafted");
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Comment State
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  async function loadData() {
    try {
      const resProj = await fetch(`/api/projects/${projectId}`);
      if (!resProj.ok) throw new Error("Project not found");
      const projData: Project = await resProj.json();
      setProject(projData);

      const resUsers = await fetch("/api/users");
      const usersData = await resUsers.json();
      setUsers(usersData);

      // Select first question if none selected
      if (projData.questions && projData.questions.length > 0) {
        // Retain selection if we are reloading
        const currentSelection = selectedQuestion 
          ? projData.questions.find(q => q.id === selectedQuestion.id) 
          : projData.questions[0];
        
        const bestSelection = currentSelection || projData.questions[0];
        setSelectedQuestion(bestSelection);
        setAnswerText(bestSelection.answerDraft?.text || "");
        setAssignedUserId(bestSelection.assignedUserId || "");
        setStatus(bestSelection.status);
      }
    } catch (err) {
      console.error("Workspace load error:", err);
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [projectId]);

  const selectQuestionDetails = (q: Question) => {
    setSelectedQuestion(q);
    setAnswerText(q.answerDraft?.text || "");
    setAssignedUserId(q.assignedUserId || "");
    setStatus(q.status);
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${selectedQuestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          assignedUserId: assignedUserId || null,
          answerText,
          saveToLibrary
        })
      });

      if (res.ok) {
        await loadData();
      } else {
        console.error("Failed to update question");
      }
    } catch (err) {
      console.error("Update question error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerAI = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "POST",
      });
      if (res.ok) {
        await loadData();
      } else {
        console.error("Bulk drafting failed");
      }
    } catch (err) {
      console.error("Trigger AI error:", err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedQuestion) return;

    setCommenting(true);
    try {
      const localUserId = localStorage.getItem("feedflow_user_id") || users[0]?.id;
      
      const res = await fetch(`/api/questions/${selectedQuestion.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newComment,
          userId: localUserId
        })
      });

      if (res.ok) {
        setNewComment("");
        await loadData();
      } else {
        console.error("Comment failed");
      }
    } catch (err) {
      console.error("Add comment error:", err);
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080e] text-slate-100">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <span className="text-sm text-slate-400 animate-pulse">Initializing Response Workspace...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  // Apply filters to question list
  const filteredQuestions = project.questions.filter(q => {
    const matchesCategory = categoryFilter === "All" || q.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || q.status === statusFilter;
    const matchesSearch = q.originalText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#07080e] text-slate-100 flex flex-col h-screen">
      <Navbar />

      {/* Sub-header */}
      <div className="border-b border-white/5 bg-[#090A0F]/60 px-4 py-4 sm:px-6 lg:px-8 shrink-0">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/projects" className="hover:text-indigo-400 transition-colors">Projects</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold text-white truncate max-w-[200px]" title={project.name}>{project.name}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerAI}
              disabled={generatingAI}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-indigo-600/25 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 animate-spin-slow" />
              {generatingAI ? "Running Local RAG..." : "Bulk AI RAG Drafting"}
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Panel */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-7xl h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          {/* LEFT SIDE: Question List & Filters */}
          <div className="lg:w-96 flex flex-col h-full bg-[#0a0c14]/40 overflow-hidden shrink-0">
            {/* Filters panel */}
            <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
              <input
                type="text"
                placeholder="Search extracted questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2 text-xs text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none transition-colors font-sans"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#121420] px-2 py-1 text-xs text-white"
                  >
                    <option value="All">All Categories</option>
                    <option value="Security">Security</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-lg border border-white/5 bg-[#121420] px-2 py-1 text-xs text-white"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Drafted">Drafted</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Needs Source">Needs Source</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredQuestions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No questions match filter criteria.
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = selectedQuestion?.id === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => selectQuestionDetails(q)}
                      className={`w-full p-4 text-left transition-colors flex flex-col gap-2 border-l-2 ${
                        isSelected 
                          ? "bg-indigo-500/5 border-indigo-500" 
                          : "border-transparent hover:bg-white/[0.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{q.sourceLocation}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                            q.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : q.status === "Needs Source"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          }`}>
                            {q.status}
                          </span>
                        </div>
                      </div>

                      <p className={`text-xs leading-relaxed truncate-2-lines ${isSelected ? "text-white font-bold" : "text-slate-300 font-medium"}`}>
                        {q.originalText}
                      </p>

                      <div className="flex items-center justify-between w-full mt-1">
                        <span className="text-[10px] text-indigo-400 font-semibold">{q.category}</span>
                        
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex rounded text-[8px] px-1 font-bold ${
                            q.confidenceLabel === "High" ? "bg-emerald-500/10 text-emerald-400" :
                            q.confidenceLabel === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {q.confidenceLabel} RAG
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Interactive Answer Editor & Cited Evidence */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07080e]">
            {selectedQuestion ? (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                {/* Mid Section: Editor & Submits */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-sm font-bold text-white leading-relaxed">
                      {selectedQuestion.originalText}
                    </h2>
                  </div>

                  <form onSubmit={handleUpdateQuestion} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Assignee Expert</label>
                        <select
                          value={assignedUserId}
                          onChange={(e) => setAssignedUserId(e.target.value)}
                          className="w-full rounded-xl border border-white/5 bg-[#121420] px-3.5 py-2.5 text-xs text-white"
                        >
                          <option value="">Unassigned</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Question Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full rounded-xl border border-white/5 bg-[#121420] px-3.5 py-2.5 text-xs text-white"
                        >
                          <option value="Drafted">Drafted</option>
                          <option value="Needs Review">Needs Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Needs Source">Needs Source</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Draft Response</label>
                      <textarea
                        required
                        rows={6}
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none transition-colors leading-relaxed font-sans font-medium"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-white/5 pt-4 gap-4">
                      {status === "Approved" && (
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveToLibrary}
                            onChange={(e) => setSaveToLibrary(e.target.checked)}
                            className="rounded border-white/10 bg-white/[0.02] text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          Save as canonical approved answer to reusable Library
                        </label>
                      )}
                      
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 ml-auto"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {saving ? "Saving Changes..." : "Save Answer Details"}
                      </button>
                    </div>
                  </form>

                  {/* Comment Feed section */}
                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-indigo-400" /> Workspace Team Comments
                    </h3>

                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add review feedback, tag teammate..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-slate-500"
                      />
                      <button
                        type="submit"
                        disabled={commenting}
                        className="rounded-xl bg-white/[0.04] border border-white/5 px-4 text-xs font-bold text-white hover:bg-white/[0.08]"
                      >
                        Send
                      </button>
                    </form>

                    {/* Comments list */}
                    <div className="space-y-3 pt-2">
                      {selectedQuestion.comments?.length === 0 ? (
                        <p className="text-[11px] text-slate-500 font-sans">No review comments yet.</p>
                      ) : (
                        selectedQuestion.comments?.map((comment) => (
                          <div key={comment.id} className="rounded-xl bg-white/[0.01] border border-white/5 p-3 flex gap-3">
                            <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                              {comment.user.avatarUrl ? (
                                <img src={comment.user.avatarUrl} alt={comment.user.name} className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="font-bold text-white">{comment.user.name}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-500 flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {new Date(comment.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 font-sans font-medium">{comment.body}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Citations & Grounding Excerpts */}
                <div className="lg:w-80 p-6 overflow-y-auto bg-[#0a0c14]/40 shrink-0 space-y-4">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Cited Evidence & Grounding
                  </h3>

                  {selectedQuestion.answerDraft?.citations?.length === 0 ? (
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center">
                      <HelpCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No RAG source citations found for the current draft.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Run bulk AI drafting to automatically locate policy excerpts.</p>
                    </div>
                  ) : (
                    selectedQuestion.answerDraft?.citations?.map((cit) => (
                      <div 
                        key={cit.id}
                        className="relative overflow-hidden rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> {cit.sourceChunk.sourceDocument.title}
                          </span>
                          <span className="text-[9px] text-slate-500 font-medium bg-white/5 px-1.5 py-0.5 rounded font-sans">
                            Pg {cit.sourceChunk.pageNumber || 1}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans font-medium italic">
                          &ldquo;{cit.quoteExcerpt}&rdquo;
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
                Select a question from the left sidebar to begin verification.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
