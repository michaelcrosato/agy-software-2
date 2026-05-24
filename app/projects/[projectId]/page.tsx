"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert,
  MessageSquare, 
  Plus, 
  User, 
  Clock, 
  FolderPlus, 
  BookOpen, 
  CheckCircle,
  HelpCircle,
  FileText,
  Download,
  ChevronDown,
  Layers,
  Grid,
  ChevronUp,
  Copy,
  CheckCheck
} from "lucide-react";

const STOP_WORDS = new Set([
  "what", "your", "does", "have", "with", "from", "that", "this",
  "the", "and", "are", "for", "you", "but", "not", "they", "our",
  "their", "who", "whom", "which", "whose", "how", "why", "when",
  "where", "can", "could", "will", "would", "shall", "should", "may",
  "might", "must", "been", "were", "was", "has", "had", "did", "does"
]);

const SENSITIVE_CATEGORIES = new Set([
  "security certifications",
  "security",
  "compliance",
  "insurance",
  "legal",
  "data residency",
  "subprocessors",
  "breach notification",
  "financial",
  "references"
]);

function stem(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/ies$/, "y")
    .replace(/sses$/, "ss")
    .replace(/s$/, "")
    .replace(/ed$/, "")
    .replace(/ing$/, "")
    .replace(/ly$/, "");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[?.,!/():;'"\-\[\]]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function getJaccardSimilarity(q1: string, q2: string): number {
  const t1 = new Set(tokenize(q1).filter(w => !STOP_WORDS.has(w)).map(w => stem(w)));
  const t2 = new Set(tokenize(q2).filter(w => !STOP_WORDS.has(w)).map(w => stem(w)));
  
  if (t1.size === 0 || t2.size === 0) return 0;
  
  const intersection = new Set([...t1].filter(x => t2.has(x)));
  const union = new Set([...t1, ...t2]);
  
  return intersection.size / union.size;
}

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
  const [draftingSingleAI, setDraftingSingleAI] = useState(false);
  const [selectedTone, setSelectedTone] = useState("Concise");

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Comment State
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [allowUnapprovedSensitive, setAllowUnapprovedSensitive] = useState(false);

  // Clustering and Bulk Actions State
  const [viewMode, setViewMode] = useState<"list" | "clusters">("list");
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [bulkPropagating, setBulkPropagating] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);

  // Dynamic question clustering logic
  const getClusters = (questions: Question[]) => {
    const visited = new Set<string>();
    const clusters: Question[][] = [];

    for (let i = 0; i < questions.length; i++) {
      const q1 = questions[i];
      if (visited.has(q1.id)) continue;

      const cluster: Question[] = [q1];
      visited.add(q1.id);

      for (let j = i + 1; j < questions.length; j++) {
        const q2 = questions[j];
        if (visited.has(q2.id)) continue;

        const similarity = getJaccardSimilarity(q1.originalText, q2.originalText);
        if (similarity >= 0.22) {
          cluster.push(q2);
          visited.add(q2.id);
        }
      }
      clusters.push(cluster);
    }
    return clusters;
  };

  // Toggle cluster expansion
  const toggleCluster = (clusterId: string) => {
    setExpandedClusters(prev => ({
      ...prev,
      [clusterId]: !prev[clusterId]
    }));
  };

  // Propagate answer to similar questions in cluster
  const handlePropagateAnswer = async (cluster: Question[]) => {
    if (!selectedQuestion) return;
    setBulkPropagating(true);
    try {
      const otherQuestions = cluster.filter(q => q.id !== selectedQuestion.id);
      for (const q of otherQuestions) {
        await fetch(`/api/questions/${q.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answerText: answerText,
            saveToLibrary: false
          })
        });
      }
      await loadData();
    } catch (err) {
      console.error("Propagate answer error:", err);
    } finally {
      setBulkPropagating(false);
    }
  };

  // Bulk approve all questions in cluster and promote them to Approved Answer Library
  const handleBulkApproveCluster = async (cluster: Question[]) => {
    if (!selectedQuestion) return;
    setBulkApproving(true);
    try {
      for (const q of cluster) {
        const qAnswer = q.id === selectedQuestion.id ? answerText : (q.answerDraft?.text || answerText || "");
        await fetch(`/api/questions/${q.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Approved",
            answerText: qAnswer,
            saveToLibrary: true
          })
        });
      }
      await loadData();
    } catch (err) {
      console.error("Bulk approve cluster error:", err);
    } finally {
      setBulkApproving(false);
    }
  };

  // Find cluster of the selected question
  const getSelectedQuestionCluster = (): Question[] => {
    if (!selectedQuestion || !project) return [];
    const clusters = getClusters(project.questions);
    return clusters.find(c => c.some(q => q.id === selectedQuestion.id)) || [];
  };

  const activeCluster = getSelectedQuestionCluster();
  const isClusterMember = activeCluster.length > 1;

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
      const res = await fetch(`/api/projects/${projectId}?tone=${selectedTone}`, {
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

  const handleTriggerSingleAI = async () => {
    if (!selectedQuestion) return;
    setDraftingSingleAI(true);
    try {
      const res = await fetch(`/api/questions/${selectedQuestion.id}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: selectedTone })
      });
      if (res.ok) {
        const updatedQuestion: Question = await res.json();
        // Update local project state with the updated question details
        if (project) {
          const updatedQuestions = project.questions.map(q => 
            q.id === updatedQuestion.id ? updatedQuestion : q
          );
          setProject({ ...project, questions: updatedQuestions });
        }
        selectQuestionDetails(updatedQuestion);
      } else {
        console.error("Single RAG drafting failed");
      }
    } catch (err) {
      console.error("Trigger Single AI error:", err);
    } finally {
      setDraftingSingleAI(false);
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

  const unapprovedSensitiveCount = project.questions.filter(q =>
    SENSITIVE_CATEGORIES.has(q.category.toLowerCase()) &&
    q.status !== "Approved"
  ).length || 0;

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
          
          <div className="flex items-center gap-3 relative">
            <button
              onClick={handleTriggerAI}
              disabled={generatingAI}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-indigo-600/25 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 animate-spin-slow" />
              {generatingAI ? "Running Local RAG..." : "Bulk AI RAG Drafting"}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/[0.08] hover:border-white/10 transition-all"
              >
                <Download className="h-4 w-4 text-indigo-400" />
                Export Response
                {unapprovedSensitiveCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/20" id="unapproved-sensitive-badge">
                    !
                  </span>
                )}
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {showExportDropdown && (
                <div className={`absolute right-0 mt-2 rounded-xl border border-white/5 bg-[#0f111a] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                  unapprovedSensitiveCount > 0 ? "w-64 p-3 space-y-3" : "w-48 p-1.5"
                }`}>
                  {unapprovedSensitiveCount > 0 && (
                    <div className="rounded-lg bg-rose-500/5 border border-rose-500/15 p-2.5 space-y-1.5" id="unapproved-sensitive-warning-box">
                      <p className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3 shrink-0" />
                        Unapproved Sensitive Claims
                      </p>
                      <p className="text-[9px] leading-relaxed text-slate-400 font-sans font-medium">
                        {unapprovedSensitiveCount} sensitive answers will be redacted by default to protect organization liability.
                      </p>

                      <label className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-300 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          id="allow-unapproved-checkbox"
                          checked={allowUnapprovedSensitive}
                          onChange={(e) => setAllowUnapprovedSensitive(e.target.checked)}
                          className="rounded border-white/10 bg-[#07080e] text-rose-600 focus:ring-rose-500 h-3 w-3"
                        />
                        Include unapproved (adds warnings)
                      </label>
                    </div>
                  )}

                  <div className="space-y-1">
                    <a
                      href={`/api/projects/${projectId}/export?format=xlsx${allowUnapprovedSensitive ? "&allowUnapprovedSensitive=true" : ""}`}
                      onClick={() => setShowExportDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      id="export-xlsx-link"
                    >
                      <FileText className="h-3.5 w-3.5 text-emerald-400" /> Excel Spreadsheet (.xlsx)
                    </a>
                    <a
                      href={`/api/projects/${projectId}/export?format=csv${allowUnapprovedSensitive ? "&allowUnapprovedSensitive=true" : ""}`}
                      onClick={() => setShowExportDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      id="export-csv-link"
                    >
                      <FileText className="h-3.5 w-3.5 text-teal-400" /> Comma-Separated Values (.csv)
                    </a>
                    <a
                      href={`/api/projects/${projectId}/export?format=docx${allowUnapprovedSensitive ? "&allowUnapprovedSensitive=true" : ""}`}
                      onClick={() => setShowExportDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      id="export-docx-link"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-400" /> Word Document (.docx)
                    </a>
                    <a
                      href={`/api/projects/${projectId}/export?format=json${allowUnapprovedSensitive ? "&allowUnapprovedSensitive=true" : ""}`}
                      onClick={() => setShowExportDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      id="export-json-link"
                    >
                      <FileText className="h-3.5 w-3.5 text-purple-400" /> Structured JSON (.json)
                    </a>
                  </div>
                </div>
              )}
            </div>
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

            {/* Toggle View Mode (List vs. Clusters) */}
            <div className="flex border-b border-white/5 p-2 gap-1 shrink-0 bg-[#090A0F]/40">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/25"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                Standard List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("clusters")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "clusters"
                    ? "bg-purple-600/10 text-purple-400 border border-purple-500/25"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                }`}
                id="similarity-clusters-tab"
              >
                <Layers className="h-3.5 w-3.5" />
                Similarity Clusters
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {viewMode === "list" ? (
                filteredQuestions.length === 0 ? (
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
                )
              ) : (
                // Clusters View
                (() => {
                  const clusters = getClusters(filteredQuestions);
                  if (clusters.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No clusters found.
                      </div>
                    );
                  }
                  
                  return clusters.map((cluster, cIdx) => {
                    const primaryQ = cluster[0];
                    const clusterId = primaryQ.id;
                    const isExpanded = !!expandedClusters[clusterId];
                    const isMulti = cluster.length > 1;
                    
                    if (!isMulti) {
                      const q = primaryQ;
                      const isSelected = selectedQuestion?.id === q.id;
                      return (
                        <button
                          key={q.id}
                          onClick={() => selectQuestionDetails(q)}
                          className={`w-full p-4 text-left transition-colors flex flex-col gap-2 border-l-2 ${
                            isSelected 
                              ? "bg-[#6366F1]/5 border-[#6366F1]" 
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
                            <span className={`inline-flex rounded text-[8px] px-1 font-bold ${
                              q.confidenceLabel === "High" ? "bg-emerald-500/10 text-emerald-400" :
                              q.confidenceLabel === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                            }`}>
                              {q.confidenceLabel} RAG
                            </span>
                          </div>
                        </button>
                      );
                    }
                    
                    const approvedCount = cluster.filter(q => q.status === "Approved").length;
                    const isAnySelected = cluster.some(q => selectedQuestion?.id === q.id);
                    
                    return (
                      <div key={clusterId} className={`flex flex-col border-b border-white/5 ${isAnySelected ? "bg-purple-500/[0.02]" : ""}`}>
                        {/* Cluster Header */}
                        <div className="p-4 flex flex-col gap-2">
                          <div className="flex items-center justify-between w-full">
                            <button
                              type="button"
                              onClick={() => toggleCluster(clusterId)}
                              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              <Layers className="h-3.5 w-3.5 shrink-0" />
                              <span>Cluster ({cluster.length} Items)</span>
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                              {approvedCount}/{cluster.length} Approved
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed font-bold text-slate-200">
                            {primaryQ.originalText}
                          </p>

                          <div className="flex items-center justify-between w-full mt-1">
                            <span className="text-[10px] text-purple-400 font-semibold">{primaryQ.category}</span>
                            <button
                              type="button"
                              onClick={() => toggleCluster(clusterId)}
                              className="text-[10px] font-semibold text-slate-400 hover:text-white transition-colors"
                            >
                              {isExpanded ? "Collapse List" : "Expand Similar Questions"}
                            </button>
                          </div>
                        </div>

                        {/* Cluster Expanded Questions List */}
                        {isExpanded && (
                          <div className="pl-4 border-l-2 border-purple-500/20 bg-purple-950/[0.04] divide-y divide-white/5">
                            {cluster.map((q) => {
                              const isSelected = selectedQuestion?.id === q.id;
                              return (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => selectQuestionDetails(q)}
                                  className={`w-full p-3 text-left transition-colors flex flex-col gap-1.5 border-l-2 ${
                                    isSelected 
                                      ? "bg-purple-500/5 border-purple-500 text-white font-bold" 
                                      : "border-transparent hover:bg-white/[0.01] text-slate-300 font-medium"
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{q.sourceLocation}</span>
                                    <span className={`inline-flex rounded px-1 py-0.2 text-[8px] font-bold border ${
                                      q.status === "Approved"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : q.status === "Needs Source"
                                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                    }`}>
                                      {q.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed line-clamp-2">
                                    {q.originalText}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Interactive Answer Editor & Cited Evidence */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07080e]">
            {selectedQuestion && isClusterMember && (
              <div className="mx-6 mt-6 rounded-2xl border border-purple-500/10 bg-purple-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
                <div className="flex items-start gap-2.5">
                  <Layers className="h-4.5 w-4.5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-white">Repetitive Question Cluster Detected</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans font-medium">
                      This item belongs to a cluster of <span className="text-purple-400 font-bold">{activeCluster.length} similar questions</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={bulkPropagating || bulkApproving}
                    onClick={() => handlePropagateAnswer(activeCluster)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/[0.08] hover:border-white/20 transition-all disabled:opacity-50"
                    id="propagate-answer-btn"
                  >
                    <Copy className="h-3.5 w-3.5 text-purple-400" />
                    {bulkPropagating ? "Propagating..." : "Propagate Answer"}
                  </button>
                  <button
                    type="button"
                    disabled={bulkPropagating || bulkApproving}
                    onClick={() => handleBulkApproveCluster(activeCluster)}
                    className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                    id="bulk-approve-btn"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    {bulkApproving ? "Approving All..." : "Bulk Approve Cluster"}
                  </button>
                </div>
              </div>
            )}

            {selectedQuestion ? (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                {/* Mid Section: Editor & Submits */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-sm font-bold text-white leading-relaxed">
                      {selectedQuestion.originalText}
                    </h2>
                  </div>

                  {selectedQuestion && SENSITIVE_CATEGORIES.has(selectedQuestion.category.toLowerCase()) && status !== "Approved" && (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200" id="sensitive-claim-banner">
                      <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-white">Sensitive Claim Control Active</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-medium font-sans">
                          This question falls under the <span className="text-rose-400 font-bold">{selectedQuestion.category}</span> sensitive category. It is a restricted claim and <span className="text-rose-400 font-semibold">requires explicit human approval (Status: Approved)</span> before the response can be exported.
                        </p>
                      </div>
                    </div>
                  )}

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
                      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                        <label className="block text-xs font-semibold text-slate-400">Draft Response</label>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedTone}
                            onChange={(e) => setSelectedTone(e.target.value)}
                            className="rounded-lg border border-white/5 bg-[#121420] px-2 py-0.5 text-[10px] font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            id="tone-selector"
                          >
                            <option value="Concise">Concise Answer</option>
                            <option value="Detailed">Detailed Answer</option>
                            <option value="YesNo">Yes/No with Explanation</option>
                            <option value="Formal">Formal Proposal Tone</option>
                            <option value="Security">Security Questionnaire Tone</option>
                            <option value="Plain">Plain-Language Answer</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleTriggerSingleAI}
                            disabled={draftingSingleAI}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors disabled:opacity-50"
                            id="draft-with-ai-btn"
                          >
                            <Sparkles className={`h-3 w-3 ${draftingSingleAI ? "animate-spin" : "animate-spin-slow"}`} />
                            {draftingSingleAI ? "Drafting..." : "Draft with AI"}
                          </button>
                        </div>
                      </div>
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
