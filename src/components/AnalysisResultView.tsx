import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  CheckSquare, 
  AlertTriangle, 
  FileText, 
  Download, 
  ArrowLeft, 
  ClipboardCheck, 
  Check, 
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Layers,
  XCircle,
  Terminal,
  Search,
  BookOpen,
  Activity,
  CheckCircle2,
  AlertOctagon,
  MessageSquare,
  ArrowRight,
  Server,
  UserCheck
} from "lucide-react";
import { ReviewRecord, ChecklistItem } from "../types";

interface AnalysisResultViewProps {
  record: ReviewRecord;
  onBackToHistory: () => void;
  onDownloadMarkdown: (id: string) => void;
  onSaveDecision: (id: string, status: "Approved" | "Rejected" | "Needs Changes", rationale: string) => Promise<void>;
  decisionLoading: boolean;
  onToggleChecklist: (id: string, index: number) => void;
}

export default function AnalysisResultView({
  record,
  onBackToHistory,
  onDownloadMarkdown,
  onSaveDecision,
  decisionLoading,
  onToggleChecklist
}: AnalysisResultViewProps) {
  
  const { id, changeRequestId, deviceType, environment, reviewer, status, overallRisk, riskScore, diff, analysis, checklist, auditTrail } = record;
  
  // Local state for approval rationale
  const [rationale, setRationale] = useState<string>("");
  const [rationaleError, setRationaleError] = useState<string | null>(null);
  const [decisionSuccessMessage, setDecisionSuccessMessage] = useState<string | null>(null);

  // Filter configuration for diff lines (All vs Added vs Removed)
  const [diffFilter, setDiffFilter] = useState<"all" | "changes" | "additions">("all");
  const [diffSearch, setDiffSearch] = useState<string>("");

  // Clean sub-tabs for organizing dense report metrics
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"executive" | "findings" | "diff">("executive");

  useEffect(() => {
    // Reset decision success notification when active record changes
    setDecisionSuccessMessage(null);
    setRationale("");
  }, [id]);

  const handleActionClick = async (nextStatus: "Approved" | "Rejected" | "Needs Changes") => {
    if (nextStatus !== "Approved" && !rationale.trim()) {
      setRationaleError("Please write a short auditing justification statement when requesting changes or rejecting configurations.");
      return;
    }
    setRationaleError(null);
    
    try {
      await onSaveDecision(id, nextStatus, rationale.trim() || `Approved standard review ruleset.`);
      setDecisionSuccessMessage(`Successfully updated this network config status to ${nextStatus.toUpperCase()}!`);
      setRationale("");
    } catch (err: any) {
      setRationaleError(err.message || "Failed to submit auditor signature updates.");
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return { 
          text: "text-rose-600", 
          border: "border-rose-300", 
          bg: "bg-rose-50", 
          badge: "bg-rose-600 text-white", 
          lightBadge: "bg-rose-50 text-rose-700 border-rose-200",
          accentColor: "#f43f5e" 
        };
      case "high":
        return { 
          text: "text-orange-600", 
          border: "border-orange-300", 
          bg: "bg-orange-50", 
          badge: "bg-orange-500 text-white", 
          lightBadge: "bg-orange-50 text-orange-700 border-orange-200",
          accentColor: "#f97316" 
        };
      case "medium":
        return { 
          text: "text-amber-750", 
          border: "border-amber-300", 
          bg: "bg-amber-50", 
          badge: "bg-amber-500 text-slate-950", 
          lightBadge: "bg-amber-55/60 text-amber-805 border-amber-200",
          accentColor: "#f59e0b" 
        };
      default:
        return { 
          text: "text-emerald-700", 
          border: "border-emerald-300", 
          bg: "bg-emerald-50", 
          badge: "bg-emerald-600 text-white", 
          lightBadge: "bg-emerald-55 text-emerald-800 border-emerald-200",
          accentColor: "#10b981" 
        };
    }
  };

  const getStatusStyle = (reviewStatus: string) => {
    switch (reviewStatus?.toLowerCase()) {
      case "approved":
        return "bg-emerald-500 text-white border-emerald-600 shadow-emerald-100";
      case "rejected":
        return "bg-rose-650 text-white border-rose-705 shadow-rose-100";
      case "needs changes":
        return "bg-amber-500 text-slate-950 border-amber-500 shadow-amber-100";
      default:
        return "bg-slate-200 text-slate-805 border-slate-300 shadow-slate-100";
    }
  };

  const getRecommendationStyle = (rec: string) => {
    const r = rec?.toLowerCase() || "";
    if (r.includes("reject") || r.includes("do not approve")) {
      return { label: "Reject Proposal", cls: "bg-rose-50 border-rose-205 text-rose-805", icon: XCircle };
    }
    if (r.includes("checks") || r.includes("conditional") || r.includes("need")) {
      return { label: "Conditional Approval", cls: "bg-amber-50 border-amber-205 text-amber-900", icon: AlertTriangle };
    }
    return { label: "Unconditional Approve", cls: "bg-emerald-50 border-emerald-205 text-emerald-900", icon: ShieldCheck };
  };

  const recStyle = getRecommendationStyle(analysis.approvalRecommendation);
  const riskPalette = getRiskColor(overallRisk);

  // Filtering physical line differentials
  const filteredDiff = diff.filter(line => {
    if (diffSearch.trim()) {
      if (!line.value.toLowerCase().includes(diffSearch.toLowerCase())) {
        return false;
      }
    }
    if (diffFilter === "changes") {
      return line.type !== "unchanged";
    }
    if (diffFilter === "additions") {
      return line.type === "added";
    }
    return true;
  });

  const checkedCount = checklist.filter(item => item.checked).length;
  const checklistPercent = checklist.length > 0 ? Math.round((checkedCount / checklist.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      
      {/* 1. Upper Breadcrumbs Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToHistory}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 shadow-3xs rounded-xl transition text-slate-550 hover:text-slate-900 cursor-pointer active:scale-95"
            title="Go back to list registry"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Security Assessment Log</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-tight shadow-3xs border ${getStatusStyle(status)}`}>
                {status}
              </span>
            </div>
            <h2 className="text-xl font-bold font-display tracking-tight text-slate-950 mt-1 flex items-center gap-2">
              Review: {id} 
              <span className="text-slate-400 font-mono text-xs font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                {changeRequestId}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => onDownloadMarkdown(id)}
            className="w-full md:w-auto bg-white border border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2 text-xs font-bold text-slate-705 flex items-center justify-center space-x-2 transition shadow-3xs cursor-pointer active:scale-97"
          >
            <Download className="h-4 w-4 text-slate-405" />
            <span>Export Markdown Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Grid: threat indicator gauges and recommended advice card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Modern Threat Gauge Dial */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs flex flex-row sm:flex-col items-center justify-between sm:justify-center text-center gap-4 relative overflow-hidden">
          <div className="absolute top-3 left-4 text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400">
            Threat Index Rating
          </div>
          
          <div className="flex flex-col items-center flex-1 sm:mt-2">
            {/* SVG Speedometer Ring */}
            <div className="relative h-24 w-24 flex items-center justify-center">
              <svg className="absolute inset-0 h-full w-full rotate-225" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="188 250"
                  strokeLinecap="round"
                />
                {/* Highlight Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={riskPalette.accentColor}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(riskScore / 10) * 188} 250`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Core Text */}
              <div className="relative z-10 flex flex-col items-center justify-center pt-1.5">
                <span className="text-2xl font-black font-display tracking-tight text-slate-900">{riskScore}/10</span>
                <span className="text-[8px] text-slate-400 font-mono tracking-wide uppercase">Score</span>
              </div>
            </div>
 
            <div className="mt-3.5 space-y-1 text-center sm:text-left">
              <span className={`inline-flex items-center text-[10px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-full gap-1.5 ${riskPalette.badge}`}>
                <span>{overallRisk === "Low" ? "🟢" : overallRisk === "Medium" ? "🟡" : "🔴"}</span>
                <span>{overallRisk} Risk Level</span>
              </span>
            </div>
          </div>
          
          <div className="hidden sm:block border-t border-slate-100 pt-3 w-full text-[11px] text-slate-450 font-mono flex items-center justify-between">
            <span>Hardware Target:</span>
            <span className="font-bold text-slate-800">{deviceType}</span>
          </div>
        </div>

        {/* AI verdict directive summary banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs flex flex-col justify-between lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 block">
                Cognitive Threat Directive
              </span>
              <span className="text-[10px] text-slate-450 font-mono flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Impact Zone: <strong>{environment}</strong>
              </span>
            </div>

            <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${recStyle.cls}`}>
              <div className="p-1.5 bg-white/80 rounded-lg shadow-3xs text-slate-900 shrink-0">
                <recStyle.icon className="h-4.5 w-4.5 text-slate-800" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold uppercase tracking-wide">Automated Baseline Advice</h4>
                <p className="text-[11px] leading-relaxed opacity-90">{analysis.approvalRecommendation}</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-650 font-light leading-relaxed">
              {analysis.executiveSummary || "No executive summary parsed for this configuration differential register."}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-[11px] font-mono">
            <div className="bg-slate-50/55 rounded-lg p-2 border border-slate-100">
              <span className="text-[8px] text-slate-400 uppercase font-black block">Status state</span>
              <span className="font-bold text-slate-850 truncate block mt-0.5">{status}</span>
            </div>
            <div className="bg-slate-50/55 rounded-lg p-2 border border-slate-100">
              <span className="text-[8px] text-slate-400 uppercase font-black block">Verification checklists</span>
              <span className="font-bold text-slate-850 truncate block mt-0.5">{checklistPercent}% Compiled</span>
            </div>
            <div className="bg-slate-50/55 rounded-lg p-2 border border-slate-100">
              <span className="text-[8px] text-slate-400 uppercase font-black block">Device Target</span>
              <span className="font-bold text-slate-850 truncate block mt-0.5">{deviceType}</span>
            </div>
            <div className="bg-slate-50/55 rounded-lg p-2 border border-slate-100">
              <span className="text-[8px] text-slate-400 uppercase font-black block">Ticket Ident</span>
              <span className="font-bold text-slate-855 truncate block mt-0.5">{changeRequestId}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Dual Workspace split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Workspace pane (2/3 size): Powered by Tabs */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Workspace Tabs Controller */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-205 flex w-full">
            <button
              onClick={() => setActiveWorkspaceTab("executive")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
                activeWorkspaceTab === "executive"
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Cognitive Summary</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab("findings")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
                activeWorkspaceTab === "findings"
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Technical Flaws</span>
              {analysis.changes && analysis.changes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-[9px] font-black font-mono rounded-full">
                  {analysis.changes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveWorkspaceTab("diff")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
                activeWorkspaceTab === "diff"
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-650 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>Code Differentials</span>
            </button>
          </div>

          {/* Tab #1 content: Cognitive Oversight */}
          {activeWorkspaceTab === "executive" && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-955 font-display flex items-center gap-2">
                    <BookOpen className="h-4.5 w-4.5 text-indigo-505" />
                    Deep Cognitive Technical Analysis
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">High-fidelity analysis compiled from modern AI heuristics and vector matching</p>
                </div>
                
                <div className="font-light text-slate-700 text-xs leading-relaxed space-y-4">
                  <div className="space-y-1.5 text-left border-l-3 border-indigo-200 pl-4 py-0.5">
                    <span className="font-bold text-slate-900 text-xs block uppercase font-mono tracking-wider">Executive Overview Summary</span>
                    <p className="text-slate-655">{analysis.technicalSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3.5 border-t border-slate-100 text-slate-805">
                    <div className="p-4 bg-rose-50/55 rounded-xl border border-rose-100 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-rose-950 text-[10px] uppercase font-mono block">Security Implications</span>
                        <p className="text-[11px] leading-relaxed text-rose-800 font-medium mt-1.5">{analysis.securityImpact}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/55 rounded-xl border border-amber-100 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-amber-955 text-[10px] uppercase font-mono block">Availability implications</span>
                        <p className="text-[11px] leading-relaxed text-amber-800 font-medium mt-1.5">{analysis.availabilityImpact}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50/55 rounded-xl border border-emerald-100 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-emerald-955 text-[10px] uppercase font-mono block">Compliance Frameworks</span>
                        <p className="text-[11px] leading-relaxed text-emerald-800 font-medium mt-1.5">{analysis.complianceImpact}</p>
                      </div>
                    </div>
                  </div>

                  {analysis.affectedServices && analysis.affectedServices.length > 0 && (
                    <div className="pt-2">
                      <span className="font-bold text-slate-900 font-mono text-[9px] uppercase tracking-wider block mb-2">Potential Impact Scope Targets</span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.affectedServices.map(srv => (
                          <span key={srv} className="bg-slate-50 border border-slate-200 text-[10px] px-3 py-1.5 rounded-lg font-mono text-slate-700 font-semibold shadow-3xs flex items-center gap-1.5">
                            <Server className="h-3 w-3 text-slate-405" />
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* Tab #2 Content: Detailed anomalies list */}
          {activeWorkspaceTab === "findings" && (
            <div className="space-y-4 animate-fadeIn">
              
              {analysis.changes && analysis.changes.length > 0 ? (
                analysis.changes.map((item, index) => {
                  const riskStyle = getRiskColor(item.riskLevel);
                  return (
                    <div 
                      key={index} 
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4 hover:border-slate-300 transition-all duration-200 text-left"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${riskStyle.badge}`}>
                            {item.riskLevel} Issue
                          </span>
                          <span className="text-[10px] bg-slate-100 border border-slate-200 font-mono text-slate-700 px-2.5 py-0.5 rounded-lg font-extrabold">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold font-mono text-indigo-900 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                          Vector: {item.title}
                        </h4>
                      </div>

                      <div className="space-y-4">
                        <div className="text-xs text-slate-655 font-light leading-relaxed">
                          <span className="font-bold text-slate-900 block mb-1">Diagnostic Explanation:</span>
                          {item.description}
                        </div>

                        {/* Mitigation Grid panel */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-[11px] bg-slate-50/50 border border-slate-205 p-4 rounded-2xl font-light">
                          <div className="space-y-1">
                            <strong className="text-slate-800 block font-bold uppercase tracking-tight text-[9px] font-mono text-slate-400">Business Impact</strong>
                            <p className="text-slate-655 leading-relaxed font-light">{item.businessImpact}</p>
                          </div>
                          <div className="space-y-1">
                            <strong className="text-slate-800 block font-bold uppercase tracking-tight text-[9px] font-mono text-slate-400">Technical Context</strong>
                            <p className="text-slate-655 leading-relaxed font-light">{item.technicalImpact}</p>
                          </div>
                          <div className="space-y-1 bg-red-50/30 border border-red-100 p-2.5 rounded-xl">
                            <strong className="text-red-950 block font-light uppercase tracking-tight text-[9px] font-mono font-bold text-rose-900">Mitigation Path</strong>
                            <p className="text-rose-800 leading-relaxed font-medium">{item.recommendedAction}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400 font-light space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800 mt-2">No configuration anomalies matched</p>
                  <p>All lines correspond parameters mapped in current regulatory standards checklists.</p>
                </div>
              )}

            </div>
          )}

          {/* Tab #3 Content: Differentials visual editor block */}
          {activeWorkspaceTab === "diff" && (
            <div className="bg-slate-900 text-slate-105 rounded-2xl shadow-sm border border-slate-800 overflow-hidden flex flex-col font-mono text-xs animate-fadeIn">
              
              {/* Header */}
              <div className="bg-slate-950 p-4 border-b border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4.5 w-4.5 text-emerald-400" />
                  <span className="font-bold text-slate-205">Diff Command Analyzer Log</span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[9px]">
                  <button
                    type="button"
                    onClick={() => setDiffFilter("all")}
                    className={`px-2.5 py-1 rounded-md border font-bold cursor-pointer transition ${
                      diffFilter === "all" 
                        ? "bg-slate-800 border-slate-700 text-white" 
                        : "border-slate-800 text-slate-405 hover:bg-slate-805"
                    }`}
                  >
                    All Commands
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffFilter("changes")}
                    className={`px-2.5 py-1 rounded-md border font-bold cursor-pointer transition ${
                      diffFilter === "changes" 
                        ? "bg-slate-800 border-slate-700 text-white" 
                        : "border-slate-800 text-slate-405 hover:bg-slate-805"
                    }`}
                  >
                    Anomalies Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffFilter("additions")}
                    className={`px-2.5 py-1 rounded-md border font-bold cursor-pointer transition ${
                      diffFilter === "additions" 
                        ? "bg-slate-800 border-slate-700 text-white" 
                        : "border-slate-800 text-slate-405 hover:bg-slate-805"
                    }`}
                  >
                    Additions Only
                  </button>
                </div>
              </div>

              {/* diff search */}
              <div className="bg-slate-955/40 px-4 py-2 border-b border-slate-850 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={diffSearch}
                  onChange={(e) => setDiffSearch(e.target.value)}
                  placeholder="Interactive match search (e.g. secret, access-list, vty)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-505 outline-hidden focus:border-slate-700 transition"
                />
              </div>

              {/* Terminal View */}
              <div className="p-3 overflow-y-auto max-h-[420px] divide-y divide-slate-850 space-y-0.5 text-left">
                {filteredDiff.length === 0 ? (
                  <div className="text-center py-12 text-slate-505 italic">No differential lines match your current search filters.</div>
                ) : (
                  filteredDiff.map((line, i) => {
                    let bgClass = "bg-transparent text-slate-405";
                    let prefix = " ";
                    if (line.type === "added") {
                      bgClass = "bg-emerald-950/40 text-emerald-305 border-l-3 border-emerald-500 px-1";
                      prefix = "+";
                    } else if (line.type === "removed") {
                      bgClass = "bg-rose-955/35 text-rose-305 border-l-3 border-rose-500 px-1";
                      prefix = "-";
                    }
                    
                    return (
                      <div key={i} className={`py-1.5 flex leading-relaxed truncate whitespace-pre ${bgClass}`}>
                        <div className="w-10 text-right pr-3 select-none text-slate-600 font-mono text-[10px] shrink-0">
                          {line.oldLineNumber || ""}
                        </div>
                        <div className="w-10 text-right pr-3 select-none text-slate-605 font-mono text-[10px] shrink-0 border-r border-slate-850">
                          {line.newLineNumber || ""}
                        </div>
                        <div className="pl-3 font-mono text-[10px] select-text">
                          <span className="text-slate-500 mr-2 font-bold select-none">{prefix}</span>
                          {line.value || " "}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Terminal Footer */}
              <div className="bg-slate-950 p-3 text-[10px] text-slate-550 font-mono flex flex-wrap justify-between gap-2 border-t border-slate-850">
                <div className="flex gap-4">
                  <span>Lines: {diff.length}</span>
                  <span className="text-emerald-500">+{diff.filter(x => x.type === "added").length} additions</span>
                  <span className="text-rose-500">-{diff.filter(x => x.type === "removed").length} removals</span>
                </div>
                <span>Regulatory Parser Active</span>
              </div>

            </div>
          )}

        </div>

        {/* Right Workspace pane (1/3 size): Auditor Toolbox & Manual Registry Signatures */}
        <div className="space-y-6 animate-fadeIn">
          
          {/* Section 3.1: Interactive Task Verification Checklists */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-955 font-display flex items-center gap-2">
                <ClipboardCheck className="h-4.5 w-4.5 text-indigo-505" />
                Interactive Auditor Steps
              </h3>
              <p className="text-[11px] text-slate-400 font-light">Custom tasks generated based on rules</p>
            </div>

            {/* Checklist progress tracker */}
            <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-150">
              <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                <span className="text-slate-500 uppercase">Process validation</span>
                <span className="text-slate-905">{checklistPercent}% Verified</span>
              </div>
              <div className="h-1.5 w-full bg-slate-150 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-950 rounded-full transition-all duration-500"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {checklist && checklist.length > 0 ? (
                checklist.map((item, index) => (
                  <label 
                    key={index}
                    className={`flex items-start gap-2.5 p-2.5 border rounded-xl transition cursor-pointer ${
                      item.checked 
                        ? "bg-slate-50 border-slate-200" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => onToggleChecklist(id, index)}
                      className="mt-0.5 h-3.5 w-3.5 text-slate-950 border-slate-305 rounded focus:ring-0 cursor-pointer shrink-0"
                    />
                    <span className={`text-[11px] leading-snug select-none ${
                      item.checked ? "text-slate-405 line-through font-light" : "text-slate-705 font-bold"
                    }`}>
                      {item.item}
                    </span>
                  </label>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-light">
                  No automated validation checklist tasks drafted.
                </div>
              )}
            </div>
          </div>

          {/* Section 3.2: AI Interview Templates */}
          {analysis.questionsForChangeOwner && analysis.questionsForChangeOwner.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs space-y-3 font-sans">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-905 font-display flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-indigo-505" />
                  Operator Query Templates
                </h3>
                <p className="text-[11px] text-slate-450 font-light">Questions to trace baseline intent</p>
              </div>

              <div className="space-y-2 text-left">
                {analysis.questionsForChangeOwner.map((q, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl text-[11px] text-slate-655 leading-normal pl-7 relative font-light"
                  >
                    <span className="absolute top-3 left-2.5 text-[8px] font-mono font-bold bg-indigo-100 border border-indigo-200 text-indigo-850 h-4 w-4 rounded-full flex items-center justify-center">
                      {idx+1}
                    </span>
                    "{q}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3.3: Auditor Final Sign-off control form */}
          <div className="bg-slate-950 text-white rounded-2xl border border-slate-905 p-6 shadow-md space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
                <UserCheck className="h-4.5 w-4.5 text-emerald-400" />
                Auditor Manual Verdict Finalization
              </h3>
              <p className="text-[11px] text-slate-400 font-light leading-snug">Sign off on the security review metrics to update the central repository</p>
            </div>

            <div className="space-y-3 pt-1">
              <label className="text-[10px] font-bold text-slate-350 block uppercase tracking-wider font-mono">Verdict Justification Comments</label>
              <textarea
                value={rationale}
                onChange={(e) => {
                  setRationale(e.target.value);
                  setRationaleError(null);
                }}
                placeholder="Log rationale comment statements, checklist exceptions, or change request directives here..."
                className="w-full h-22 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-200 placeholder-slate-505 focus:outline-hidden focus:border-slate-700 transition leading-relaxed resize-none"
              />

              {rationaleError && (
                <div className="text-[10px] text-rose-300 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50 leading-normal font-medium">
                  {rationaleError}
                </div>
              )}

              {decisionSuccessMessage && (
                <div className="text-[10px] text-emerald-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/50 leading-normal font-semibold">
                  {decisionSuccessMessage}
                </div>
              )}

              {/* Approval status triggers */}
              <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                
                <button
                  type="button"
                  onClick={() => handleActionClick("Approved")}
                  disabled={decisionLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[10px] uppercase py-3 rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleActionClick("Needs Changes")}
                  disabled={decisionLoading}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-[10px] uppercase py-3 rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Request CHG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleActionClick("Rejected")}
                  disabled={decisionLoading}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-[10px] uppercase py-3 rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>

              </div>
              
            </div>

            <div className="border-t border-slate-850 pt-3 flex justify-between items-center text-[10px] text-slate-455 font-mono">
              <span>Assigned Auditor:</span>
              <span className="font-bold text-slate-200">{reviewer}</span>
            </div>
          </div>

          {/* Section 3.4: Log audit logs trail */}
          {auditTrail && auditTrail.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-3xs space-y-3 select-none text-left">
              <h3 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-450 font-mono">History Log Trail</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {auditTrail.map((ev, i) => {
                  const evDate = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={i} className="text-[10px] leading-relaxed relative pl-3.5 border-l border-slate-200">
                      <span className="absolute top-1 left-0 h-1.5 w-1.5 rounded-full bg-slate-400 -translate-x-[4px]" />
                      <div className="flex justify-between font-mono text-[8px] text-slate-400 font-bold">
                        <span>{evDate}</span>
                        <span>{ev.reviewer || "System"}</span>
                      </div>
                      <p className="text-slate-800 font-bold mt-0.5">{ev.action}</p>
                      <p className="text-slate-455 font-light text-[9px] mt-0.5">{ev.details}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
