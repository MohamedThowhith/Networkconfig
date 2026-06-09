import React from "react";
import { 
  ShieldAlert, 
  CheckSquare, 
  AlertOctagon, 
  ThumbsUp, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  FileMinus2,
  ListFilter
} from "lucide-react";
import { DashboardSummary, RiskDistributionItem, RecentActivityEvent, ReviewRecord } from "../types";

interface DashboardViewProps {
  summary: DashboardSummary | null;
  distribution: RiskDistributionItem[];
  recentActivity: RecentActivityEvent[];
  onNewReviewRequest: () => void;
  onViewReview: (id: string) => void;
  allRecords: ReviewRecord[];
}

export default function DashboardView({
  summary,
  distribution,
  recentActivity,
  onNewReviewRequest,
  onViewReview,
  allRecords
}: DashboardViewProps) {
  
  const metrics = [
    {
      label: "Total Configurations Evaluated",
      value: summary?.totalReviews ?? 0,
      icon: CheckSquare,
      color: "bg-slate-50 text-slate-900 border-slate-200",
      description: "Historic database total reviews analyzed"
    },
    {
      label: "High & Critical Risk Breaches",
      value: summary?.highRiskReviews ?? 0,
      icon: ShieldAlert,
      color: "bg-rose-50 text-rose-700 border-rose-200",
      description: "Policy infractions requiring mitigation"
    },
    {
      label: "Active Pending Approvals",
      value: summary?.pendingApprovals ?? 0,
      icon: Clock,
      color: "bg-amber-50 text-amber-850 border-amber-200",
      description: "Awaiting auditor manual signature"
    },
    {
      label: "Safe Approved Changes",
      value: summary?.approvedChanges ?? 0,
      icon: ThumbsUp,
      color: "bg-emerald-50 text-emerald-800 border-emerald-250",
      description: "Fully verified standard configurations"
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header Banner & Action Shortcut */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-950">Security Posture Dashboard</h2>
          <p className="text-sm text-slate-500 font-light">Real-time status overview of the corporate network drift policies.</p>
        </div>
        
        <button
          onClick={onNewReviewRequest}
          className="inline-flex items-center space-x-2 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-xs transition-transform active:scale-97 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Review Analysis</span>
        </button>
      </div>

      {/* 2. Top Overview Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx} 
              className={`p-5 rounded-2xl border ${item.color} flex flex-col justify-between space-y-4`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 font-mono tracking-wider">
                  {item.label}
                </span>
                <div className="bg-white/90 p-2 rounded-xl border border-inherit shadow-2xs">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black font-display tracking-tight block">
                  {item.value}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-light leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Center Section: Risk Metrics Distribution & Pending Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk distribution column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 lg:col-span-1 shadow-2xs flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-950 font-display">Vulnerability Distribution</h3>
            <p className="text-xs text-slate-500 font-light">Config reviews classified by maximum detected impact level</p>
          </div>

          {/* Interactive list model */}
          <div className="space-y-3.5 my-4">
            {distribution.map((item) => {
              const totalVal = summary?.totalReviews ?? 1;
              const percentage = Math.round((item.value / (totalVal || 1)) * 100);
              const emoji = item.name === "Low" ? "🟢" : item.name === "Medium" ? "🟡" : "🔴";
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="h-2.5 w-2.5 rounded-full hidden" style={{ backgroundColor: item.color }} />
                      <span className="text-xs">{emoji}</span>
                      <span className="font-semibold text-slate-755">{item.name} Risk Level</span>
                    </div>
                    <span className="text-slate-500 font-mono font-medium">
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.name === "Low" ? '#059669' : item.name === "Medium" ? '#d97706' : '#dc2626'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 font-light flex items-center justify-between">
            <span>Threat Threshold Status:</span>
            <span className="font-mono text-slate-700 font-semibold uppercase">Fully active</span>
          </div>
        </div>

        {/* Pending approvals tracker list */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between lg:col-span-2 shadow-2xs">
          <div className="space-y-1 pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-950 font-display">Awaiting Auditor Approval</h3>
            <p className="text-xs text-slate-500 font-light">Urgent configuration reviews assigned for manual signature authorization</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-slate-100 pr-1">
            {allRecords.filter(r => r.status === "Pending").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center h-full">
                <ShieldCheck className="h-8 w-8 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-800">Workspace is Clear</span>
                <p className="text-[10px] text-slate-400 font-light px-6">All submitted network configuration differentials have been resolved by auditors.</p>
              </div>
            ) : (
              allRecords.filter(r => r.status === "Pending").map((record) => {
                const isCritical = record.overallRisk === "Critical" || record.overallRisk === "High";
                return (
                  <div 
                    key={record.id} 
                    className="py-3 flex items-center justify-between group hover:bg-slate-50/50 transition-colors rounded-lg px-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span 
                          onClick={() => onViewReview(record.id)}
                          className="text-xs font-bold font-mono text-slate-900 cursor-pointer hover:text-slate-950 hover:underline"
                        >
                          {record.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({record.changeRequestId})</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                        <span>{record.deviceType}</span>
                        <span>•</span>
                        <span className="text-slate-700 font-light">{record.environment}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3.5">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium flex items-center gap-1.5 ${
                        record.overallRisk === "High" || record.overallRisk === "Critical" 
                          ? "bg-rose-50 text-rose-700 border border-rose-100" 
                          : record.overallRisk === "Medium" 
                            ? "bg-amber-50 text-amber-800 border border-amber-100" 
                            : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      }`}>
                        <span>{record.overallRisk === "Low" ? "🟢" : record.overallRisk === "Medium" ? "🟡" : "🔴"}</span>
                        <span>{record.overallRisk}</span>
                      </span>
                      
                      <button
                        onClick={() => onViewReview(record.id)}
                        className="text-slate-400 group-hover:text-slate-900 transition-colors p-1 cursor-pointer"
                        title="Open analysis card"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 pt-3.5 mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Critical actions required:</span>
            <span className="font-mono text-rose-600 font-bold">{allRecords.filter(r => r.status === "Pending" && (r.overallRisk === "High" || r.overallRisk === "Critical")).length} High Risk</span>
          </div>
        </div>

      </div>

      {/* 4. bottom section: Activity Logs audit trail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-950 font-display">Audit & Security Activity log</h3>
            <p className="text-xs text-slate-500 font-light font-sans mt-0.5">Real-time chronicle of systemic analysis events and reviewer decisions</p>
          </div>
          <ListFilter className="h-4.5 w-4.5 text-slate-400" />
        </div>

        <div className="overflow-y-auto max-h-72 space-y-3.5 pr-2">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-light">
              No recent audit trail logs found. Run an evaluation to bootstrap the logs database.
            </div>
          ) : (
            recentActivity.map((event, idx) => {
              const dateStr = new Date(event.timestamp).toLocaleString();
              const isStatusChange = event.action === "STATUS_CHANGED";
              return (
                <div key={idx} className="flex items-start justify-between text-xs gap-4 relative pl-3 border-l-2 border-slate-200">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-900 font-mono">[{event.reviewId}]</span>
                      <span className={`text-[9px] px-2 py-0.2 rounded font-mono font-bold ${
                        isStatusChange ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-800"
                      }`}>
                        {event.action}
                      </span>
                      {isStatusChange && (
                        <span className="text-[10px] text-slate-500">by {event.reviewer || "System"}</span>
                      )}
                    </div>
                    <p className="text-slate-600 font-light leading-relaxed">{event.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 font-light">{dateStr}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
