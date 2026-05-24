"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { FileText, Plus, Calendar, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import * as XLSX from "xlsx";


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

  // CSV Questionnaire Upload & Mapping State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  
  // Mapping assignments: maps a field to a column index in the CSV
  const [mapQuestionTextIdx, setMapQuestionTextIdx] = useState<number>(-1);
  const [mapCategoryIdx, setMapCategoryIdx] = useState<number>(-1);
  const [mapSourceLocationIdx, setMapSourceLocationIdx] = useState<number>(-1);
  
  // Show Column Mapper view
  const [showColumnMapper, setShowColumnMapper] = useState(false);

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

  // Extremely robust client-side CSV parser
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip LF
        }
        row.push(currentVal.trim());
        if (row.some(val => val.length > 0)) {
          result.push(row);
        }
        row = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }

    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      if (row.some(val => val.length > 0)) {
        result.push(row);
      }
    }

    return result;
  };

  const handleFileChange = (file: File) => {
    setUploadFile(file);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const ab = e.target?.result as ArrayBuffer;
        if (!ab) return;

        try {
          const workbook = XLSX.read(new Uint8Array(ab), { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });

          if (jsonData.length > 0) {
            const headers = (jsonData[0] as any[]).map(val => String(val || "").trim());
            const rows = jsonData.slice(1).map(row => 
              Array.from({ length: headers.length }, (_, i) => String(row[i] || "").trim())
            );

            setCsvHeaders(headers);
            setCsvRows(rows);
            setShowColumnMapper(true);

            // Auto-detect columns based on header keywords
            let questionIdx = -1;
            let categoryIdx = -1;
            let locationIdx = -1;

            headers.forEach((header, idx) => {
              const lower = header.toLowerCase();
              if (
                lower.includes("question") ||
                lower.includes("requirement") ||
                lower.includes("prompt") ||
                lower.includes("text")
              ) {
                if (questionIdx === -1) questionIdx = idx;
              } else if (
                lower.includes("category") ||
                lower.includes("section") ||
                lower.includes("topic")
              ) {
                if (categoryIdx === -1) categoryIdx = idx;
              } else if (
                lower.includes("location") ||
                lower.includes("row") ||
                lower.includes("id") ||
                lower.includes("number")
              ) {
                if (locationIdx === -1) locationIdx = idx;
              }
            });

            setMapQuestionTextIdx(questionIdx !== -1 ? questionIdx : 0);
            setMapCategoryIdx(categoryIdx);
            setMapSourceLocationIdx(locationIdx);
          }
        } catch (err) {
          console.error("Failed to parse Excel file:", err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;

        const parsed = parseCSV(text);
        if (parsed.length > 0) {
          const headers = parsed[0];
          const rows = parsed.slice(1);
          setCsvHeaders(headers);
          setCsvRows(rows);
          setShowColumnMapper(true);

          // Auto-detect columns based on header keywords
          let questionIdx = -1;
          let categoryIdx = -1;
          let locationIdx = -1;

          headers.forEach((header, idx) => {
            const lower = header.toLowerCase();
            if (
              lower.includes("question") ||
              lower.includes("requirement") ||
              lower.includes("prompt") ||
              lower.includes("text")
            ) {
              if (questionIdx === -1) questionIdx = idx;
            } else if (
              lower.includes("category") ||
              lower.includes("section") ||
              lower.includes("topic")
            ) {
              if (categoryIdx === -1) categoryIdx = idx;
            } else if (
              lower.includes("location") ||
              lower.includes("row") ||
              lower.includes("id") ||
              lower.includes("number")
            ) {
              if (locationIdx === -1) locationIdx = idx;
            }
          });

          setMapQuestionTextIdx(questionIdx !== -1 ? questionIdx : 0);
          setMapCategoryIdx(categoryIdx);
          setMapSourceLocationIdx(locationIdx);
        }
      };
      reader.readAsText(file);
    }
  };

  const getMappedQuestions = () => {
    if (mapQuestionTextIdx === -1) return [];
    
    return csvRows.map((row, idx) => {
      const qText = row[mapQuestionTextIdx] || "";
      const qCategory = mapCategoryIdx !== -1 ? row[mapCategoryIdx] : "";
      const qLoc = mapSourceLocationIdx !== -1 ? row[mapSourceLocationIdx] : `Row ${idx + 2}`;
      
      return {
        text: qText,
        category: qCategory || undefined,
        sourceLocation: qLoc
      };
    }).filter(q => q.text.trim().length > 0);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !customerName) return;

    setSubmitting(true);
    try {
      const payload: any = {
        name,
        customerName,
        dueDate: dueDate || undefined,
      };

      if (uploadFile && showColumnMapper && mapQuestionTextIdx !== -1) {
        payload.questions = getMappedQuestions();
      } else {
        payload.questionnaireText = questionnaireText;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setUploadFile(null);
              setShowColumnMapper(false);
              setCsvHeaders([]);
              setCsvRows([]);
            }}
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
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ingestion Note</label>
                  <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3 text-[11px] text-indigo-300 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-400" />
                    <span>Upload a CSV or Excel spreadsheet questionnaire and map the headers directly, or paste raw text. Leaving both blank seeds typical compliance questions.</span>
                  </div>
                </div>
              </div>

              {/* Questionnaire Ingestion Segment */}
              <div className="border border-white/5 bg-[#07080e]/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Questionnaire Ingestion</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setShowColumnMapper(false);
                      }}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        !uploadFile ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20" : "bg-transparent text-slate-400"
                      }`}
                    >
                      Raw Text / Fallback
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".csv,.xlsx,.xls,.txt";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileChange(file);
                        };
                        input.click();
                      }}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        uploadFile ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20" : "bg-transparent text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      Upload CSV/Excel File
                    </button>
                  </div>
                </div>

                {!uploadFile ? (
                  <div className="space-y-4">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDragLeave={() => setIsDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragActive(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileChange(file);
                      }}
                      className={`border border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                        isDragActive
                          ? "border-indigo-500 bg-indigo-500/5"
                          : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
                      }`}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".csv,.xlsx,.xls,.txt";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileChange(file);
                        };
                        input.click();
                      }}
                    >
                      <Plus className="mx-auto h-5 w-5 text-indigo-400 mb-2 animate-bounce" />
                      <p className="text-xs font-bold text-slate-200">Drag & drop your CSV or Excel questionnaire here</p>
                      <p className="text-[10px] text-slate-500 mt-1">Or click to select a file from your device (CSV, Excel, TXT)</p>
                    </div>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-white/5"></div>
                      <span className="flex-shrink mx-4 text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Or Paste Raw Text</span>
                      <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    <div>
                      <textarea
                        placeholder="Paste questions here (e.g. '1. Do you support SSO? \n 2. How often are backups performed?')"
                        rows={3}
                        value={questionnaireText}
                        onChange={(e) => setQuestionnaireText(e.target.value)}
                        className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 hover:border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active File Banner */}
                    <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-5 w-5 text-indigo-400" />
                        <div>
                          <p className="text-xs font-bold text-white">{uploadFile.name}</p>
                          <p className="text-[10px] text-slate-400">{(uploadFile.size / 1024).toFixed(1)} KB • {csvRows.length} rows detected</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFile(null);
                          setShowColumnMapper(false);
                          setCsvHeaders([]);
                          setCsvRows([]);
                        }}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/10 transition-all"
                      >
                        Remove File
                      </button>
                    </div>

                    {showColumnMapper && (
                      <div className="bg-[#0f111a] border border-white/5 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <h3 className="text-xs font-bold text-indigo-400">Column Mapper Configuration</h3>
                          <span className="text-[10px] font-semibold text-slate-400">Map CSV headers to database fields</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Question Text <span className="text-rose-400">*</span></label>
                            <select
                              value={mapQuestionTextIdx}
                              onChange={(e) => setMapQuestionTextIdx(Number(e.target.value))}
                              className="w-full rounded-xl border border-white/5 bg-[#07080e] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value={-1}>-- Select Column --</option>
                              {csvHeaders.map((header, idx) => (
                                <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Category (Optional)</label>
                            <select
                              value={mapCategoryIdx}
                              onChange={(e) => setMapCategoryIdx(Number(e.target.value))}
                              className="w-full rounded-xl border border-white/5 bg-[#07080e] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value={-1}>-- None (Auto-Classify) --</option>
                              {csvHeaders.map((header, idx) => (
                                <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Source/Row Location (Optional)</label>
                            <select
                              value={mapSourceLocationIdx}
                              onChange={(e) => setMapSourceLocationIdx(Number(e.target.value))}
                              className="w-full rounded-xl border border-white/5 bg-[#07080e] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value={-1}>-- Auto (Row Number) --</option>
                              {csvHeaders.map((header, idx) => (
                                <option key={idx} value={idx}>{header || `Column ${idx + 1}`}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Parsed Preview Card */}
                        {mapQuestionTextIdx !== -1 && (
                          <div className="bg-[#07080e]/40 border border-white/5 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Live Parse Preview (First 3 questions)</p>
                            <div className="space-y-2">
                              {getMappedQuestions().slice(0, 3).map((q, qidx) => (
                                <div key={qidx} className="flex items-start gap-2 bg-[#07080e]/80 border border-white/5 rounded-lg p-2.5 text-[11px]">
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-semibold uppercase tracking-wider shrink-0 mt-0.5">
                                    {q.category || "General"}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{q.text}</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">Location: {q.sourceLocation}</p>
                                  </div>
                                </div>
                              ))}
                              {getMappedQuestions().length > 3 && (
                                <p className="text-[10px] text-indigo-400/80 text-right font-medium">+ {getMappedQuestions().length - 3} more questions mapped</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setUploadFile(null);
                    setShowColumnMapper(false);
                  }}
                  className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!!uploadFile && mapQuestionTextIdx === -1)}
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
