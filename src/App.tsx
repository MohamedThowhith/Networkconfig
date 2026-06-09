import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Menu, 
  X, 
  RefreshCw, 
  Sparkle,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  Bell,
  XCircle
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import NewReviewView from "./components/NewReviewView";
import AnalysisResultView from "./components/AnalysisResultView";
import ReviewHistoryView from "./components/ReviewHistoryView";
import SettingsView from "./components/SettingsView";
import CapabilityVerificationView from "./components/CapabilityVerificationView";
import { 
  ReviewRecord, 
  DashboardSummary, 
  RiskDistributionItem, 
  RecentActivityEvent,
  SystemSettings
} from "./types";

export default function App() {
  
  // Persistent page routing state
  const [activeTab, setActiveTab] = useState<"dashboard" | "new-review" | "analysis-result" | "history" | "capabilities" | "settings">("dashboard");
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Core records and summary states retrieved from backend
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistributionItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityEvent[]>([]);
  
  // App variables
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [organizationName, setOrganizationName] = useState<string>("NetGuard Global Operations");
  
  // Loading states and timers
  const [allLoading, setAllLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [decisionLoading, setDecisionLoading] = useState<boolean>(false);
  const [analysisTimer, setAnalysisTimer] = useState<number>(0);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Active highlighted review report
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Toast notifications manager
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Timer run loop when analysis is active
  useEffect(() => {
    let tInterval: any;
    if (analysisLoading) {
      setAnalysisTimer(0);
      tInterval = setInterval(() => {
        setAnalysisTimer(t => t + 0.1);
      }, 100);
    }
    return () => clearInterval(tInterval);
  }, [analysisLoading]);

  // Read initialization stats from backend REST APIs
  const initApplicationData = async () => {
    try {
      setAllLoading(true);
      setErrorText(null);
      
      // Fetch system settings
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setGeminiConfigured(settingsData.geminiConfigured);
        if (settingsData.organizationName) {
          setOrganizationName(settingsData.organizationName);
        }
      }

      // Refresh records database
      await refreshRecordsList();
      
    } catch (err: any) {
      console.error("Initialization failed:", err);
      setErrorText("Database synchronization error. Verify that the NetGuard endpoint server is fully reachable.");
    } finally {
      setAllLoading(false);
    }
  };

  const refreshRecordsList = async () => {
    try {
      setHistoryLoading(true);
      
      // Fetch reviews list
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error("Could not download records registry.");
      const data = await res.json();
      setRecords(data);
      if (data && data.length > 0 && !selectedRecordId) {
        setSelectedRecordId(data[0].id);
      }

      // Fetch dashboard metrics
      const summaryRes = await fetch("/api/dashboard/summary");
      if (summaryRes.ok) {
        const sData = await summaryRes.json();
        setDashboardSummary(sData);
      }

      // Fetch risk distribution
      const distRes = await fetch("/api/dashboard/risk-distribution");
      if (distRes.ok) {
        const dData = await distRes.json();
        setRiskDistribution(dData);
      }

      // Fetch log activities
      const actRes = await fetch("/api/dashboard/recent-activity");
      if (actRes.ok) {
        const aData = await actRes.json();
        setRecentActivity(aData);
      }

    } catch (err: any) {
      console.error(err);
      showToast("Could not sync with central database registry.", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Boot applications
  useEffect(() => {
    initApplicationData();
  }, []);

  // Invokes analysis pipeline
  const handleAnalyzeRequest = async (payload: {
    oldConfig: string;
    newConfig: string;
    deviceType: string;
    environment: string;
    changeRequestId: string;
    reviewer: string;
  }) => {
    setAnalysisLoading(true);
    setErrorText(null);
    try {
      const res = await fetch("/api/reviews/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const eData = await res.json().catch(() => ({}));
        throw new Error(eData.error || "Cognitive review pipeline returned internal failure.");
      }

      const generatedRecord = (await res.json()) as ReviewRecord;
      
      showToast(`Completed analysis for ${generatedRecord.id} successfully!`, "success");
      
      // Update memory indexes & route pages
      await refreshRecordsList();
      setSelectedRecordId(generatedRecord.id);
      setActiveTab("analysis-result");

    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Failed to finalize evaluation. Check endpoint connection parameters.");
      showToast("Evaluation sequence breached limitations.", "error");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Changes state / manuals signature approvals
  const handleSaveDecision = async (
    id: string, 
    status: "Approved" | "Rejected" | "Needs Changes", 
    rationale: string
  ) => {
    setDecisionLoading(true);
    try {
      const res = await fetch(`/api/reviews/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rationale,
          reviewer: organizationName
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Decision update failed.");
      }

      showToast(`Auditor status registered: ${status.toUpperCase()}`, "success");
      
      // Refresh registry datasets
      await refreshRecordsList();

    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setDecisionLoading(false);
    }
  };

  // Toggles checklist locally or triggers state updates
  const handleToggleChecklist = async (reviewId: string, itemIdx: number) => {
    // Optimistic UI updates
    setRecords(prev => prev.map(rec => {
      if (rec.id === reviewId) {
        const updatedCheck = rec.checklist.map((c, i) => {
          if (i === itemIdx) return { ...c, checked: !c.checked };
          return c;
        });
        return { ...rec, checklist: updatedCheck };
      }
      return rec;
    }));

    // Perform background status PATCH or just keep local state if parent re-renders
    // To make it persistent in our server database reviews.json, find the target record
    const target = records.find(r => r.id === reviewId);
    if (!target) return;
    
    try {
      const checklistCopy = [...target.checklist];
      checklistCopy[itemIdx] = { 
        ...checklistCopy[itemIdx], 
        checked: !checklistCopy[itemIdx].checked 
      };

      // Let's perform a patch for decision trace updates in secondary fields
      await fetch(`/api/reviews/${reviewId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: target.status,
          checklist: checklistCopy,
          reviewer: target.reviewer
        })
      });
      
      // Briefly sync list
      const freshRes = await fetch("/api/reviews");
      if (freshRes.ok) {
        const updatedList = await freshRes.json();
        setRecords(updatedList);
      }
    } catch (err) {
      console.error("Could not sync checklist status:", err);
    }
  };

  // Removes a log entirely
  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Could not drop file entry.");
      
      showToast(`Removed review record ${id} from registry database.`, "info");
      await refreshRecordsList();
      
      if (selectedRecordId === id) {
        setSelectedRecordId(null);
        setActiveTab("history");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Could not drop file entry.", "error");
    }
  };

  // Downloads Markdown report from server gateway
  const handleDownloadMarkdown = (id: string) => {
    window.open(`/api/reports/${id}/markdown`, "_blank");
    showToast("Opening requested Markdown compilation download.", "info");
  };

  // Test connection function
  const handleTestAICall = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/settings/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) return false;
      const data = await res.json();
      setGeminiConfigured(data.geminiConfigured);
      return data.testSuccess === true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Navigation handlers
  const handleViewRecord = (id: string) => {
    setSelectedRecordId(id);
    setActiveTab("analysis-result");
  };

  const activeRecord = records.find(r => r.id === selectedRecordId) || (records.length > 0 ? records[0] : null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-slate-950 selection:text-white">
      
      {/* 1. Global Banner Header */}
      <header className="bg-slate-900 text-white h-18 sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-3.5">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-800 lg:hidden text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          
          <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-5.5 w-5.5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display text-base font-black tracking-tight text-white">
                NetGuard AI
              </span>
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.2 rounded-full font-mono font-bold uppercase">
                Enterprise v2.1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-light mt-0.5">{organizationName}</p>
          </div>
        </div>

        {/* Global system online status indicators */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono">
            <span className="relative flex h-2 w-2 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-slate-400">Gemini:</span>
            <span className="font-bold text-[10px] text-emerald-400">{geminiConfigured ? "ONLINE" : "DETERMINISTIC FALLBACK ACTIVE"}</span>
          </div>

          <button
            onClick={initApplicationData}
            disabled={allLoading}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Force index database synchronization"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${allLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </header>

      {/* 2. Page Content Sandbox structure: Flex Layout containing persist Sidebar left */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Styled Persistent Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          geminiConfigured={geminiConfigured}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Core display arena */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden space-y-8">
          
          {/* Main Error Indicator block */}
          {errorText && (
            <div className="bg-rose-50 border border-rose-220 p-5 rounded-2xl flex items-start space-x-3.5 shadow-3xs text-left">
              <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-950 font-display">Evaluation Fault Mapped</h4>
                <p className="text-xs text-rose-800 font-light mt-1.5 leading-relaxed">{errorText}</p>
                <button
                  onClick={() => setErrorText(null)}
                  className="mt-3 text-xs bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-3 py-1.5 rounded-lg transition"
                >
                  Dismiss Warning
                </button>
              </div>
            </div>
          )}

          {/* Active View Selector */}
          {allLoading ? (
            <div className="flex flex-col items-center justify-center py-28 space-y-4">
              <div className="h-12 w-12 border-4 border-slate-900 border-t-emerald-400 rounded-full animate-spin" />
              <div className="text-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Synchronizing Workspace</span>
                <p className="text-xs text-slate-400 font-light mt-1 text-[11px]">Contacting NetGuard servers to fetch audit records database indexes...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardView
                  summary={dashboardSummary}
                  distribution={riskDistribution}
                  recentActivity={recentActivity}
                  onNewReviewRequest={() => setActiveTab("new-review")}
                  onViewReview={handleViewRecord}
                  allRecords={records}
                />
              )}

              {activeTab === "new-review" && (
                <NewReviewView
                  onAnalyze={handleAnalyzeRequest}
                  loading={analysisLoading}
                  loadingTimer={analysisTimer}
                />
              )}

              {activeTab === "analysis-result" && (
                activeRecord ? (
                  <AnalysisResultView
                    record={activeRecord}
                    onBackToHistory={() => setActiveTab("history")}
                    onDownloadMarkdown={handleDownloadMarkdown}
                    onSaveDecision={handleSaveDecision}
                    decisionLoading={decisionLoading}
                    onToggleChecklist={handleToggleChecklist}
                  />
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <AlertOctagon className="h-10 w-10 text-slate-350 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-display">Review Registry Empty</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto font-light mt-1">
                        Begin by checking router configuration scripts in the "Analyze Configuration" module.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("new-review")}
                      className="text-xs bg-slate-150 hover:bg-slate-200 border border-slate-205 font-bold px-4 py-2 rounded-xl transition"
                    >
                      Analyze Configuration
                    </button>
                  </div>
                )
              )}

              {activeTab === "history" && (
                <ReviewHistoryView
                  records={records}
                  onViewRecord={handleViewRecord}
                  onDeleteRecord={handleDeleteRecord}
                  onDownloadMarkdown={handleDownloadMarkdown}
                  onCreateNewRequest={() => setActiveTab("new-review")}
                />
              )}

              {activeTab === "capabilities" && (
                <CapabilityVerificationView />
              )}

              {activeTab === "settings" && (
                <SettingsView
                  onTestAI={handleTestAICall}
                  organizationName={organizationName}
                  setOrganizationName={setOrganizationName}
                  geminiConfigured={geminiConfigured}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* 3. Global Toast Notifications banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fadeIn bg-slate-900 border border-slate-800 text-white p-4.5 rounded-xl shadow-lg flex items-center space-x-3 text-left">
          <div className="h-8 w-8 rounded-lg bg-slate-950 flex items-center justify-center shrink-0">
            {toast.type === "error" ? (
              <XCircle className="h-4 w-4 text-rose-400" />
            ) : toast.type === "info" ? (
              <Sparkle className="h-4 w-4 text-sky-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div className="text-xs leading-normal font-medium">
            {toast.message}
          </div>
        </div>
      )}

    </div>
  );
}
