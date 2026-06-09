import React, { useState } from "react";
import { 
  Search, 
  Trash2, 
  Eye, 
  Download, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle, 
  PlusCircle,
  Clock,
  Calendar,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Building
} from "lucide-react";
import { ReviewRecord } from "../types";

interface ReviewHistoryViewProps {
  records: ReviewRecord[];
  onViewRecord: (id: string) => void;
  onDeleteRecord: (id: string) => Promise<void>;
  onDownloadMarkdown: (id: string) => void;
  onCreateNewRequest: () => void;
}

export default function ReviewHistoryView({
  records,
  onViewRecord,
  onDeleteRecord,
  onDownloadMarkdown,
  onCreateNewRequest
}: ReviewHistoryViewProps) {
  
  // States of filter parameters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<string>("ALL");
  const [selectedEnv, setSelectedEnv] = useState<string>("ALL");
  const [selectedRisk, setSelectedRisk] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-800 border-emerald-250";
      case "rejected":
        return "bg-rose-50 text-rose-805 border-rose-200";
      case "needs changes":
        return "bg-amber-50 text-amber-800 border-amber-250";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getRiskStyle = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return "bg-rose-600 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-amber-400 text-slate-900";
      default:
        return "bg-emerald-600 text-white";
    }
  };

  // Run filters
  const filteredRecords = records.filter(item => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesText = 
        item.id.toLowerCase().includes(q) ||
        item.changeRequestId.toLowerCase().includes(q) ||
        item.reviewer.toLowerCase().includes(q) ||
        (item.analysis && item.analysis.executiveSummary && item.analysis.executiveSummary.toLowerCase().includes(q));
      if (!matchesText) return false;
    }

    if (selectedDevice !== "ALL") {
      if (item.deviceType !== selectedDevice) return false;
    }

    if (selectedEnv !== "ALL") {
      if (item.environment !== selectedEnv) return false;
    }

    if (selectedRisk !== "ALL") {
      if (item.overallRisk !== selectedRisk) return false;
    }

    if (selectedStatus !== "ALL") {
      if (item.status !== selectedStatus) return false;
    }

    return true;
  });

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeleteLoadingId(id);
    try {
      await onDeleteRecord(id);
    } catch (err) {
      console.error("Error deleting record", err);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Distinct values for filter selects
  const devicesList = ["ALL", ...Array.from(new Set(records.map(r => r.deviceType)))];
  const envsList = ["ALL", ...Array.from(new Set(records.map(r => r.environment)))];
  const risksList = ["ALL", "Low", "Medium", "High", "Critical"];
  const statusList = ["ALL", "Pending", "Approved", "Rejected", "Needs Changes"];

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-950">Review Registry Database</h2>
          <p className="text-sm text-slate-500 font-light">Central directory of reviewed differential configurations and compliance decision traces</p>
        </div>
        
        <button
          onClick={onCreateNewRequest}
          className="inline-flex items-center space-x-2 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-xs transition active:scale-97 cursor-pointer"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>New Config Evaluation</span>
        </button>
      </div>

      {/* Registry Filter Toolbars box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-500 pb-2 border-b border-slate-100">
          <SlidersHorizontal className="h-4.5 w-4.5" />
          <span className="text-xs uppercase font-mono font-bold tracking-wider">Search & Query Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Main search input query */}
          <div className="space-y-1 lg:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Query Keywords</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, ticket, reviewer..."
                className="w-full bg-slate-50 border border-slate-250 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-850placeholder-slate-500 focus:bg-white focus:border-slate-900 outline-hidden transition"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Device brand select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Appliance Model</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-hidden focus:bg-white cursor-pointer"
            >
              {devicesList.map(vendor => (
                <option key={vendor} value={vendor}>{vendor === "ALL" ? "All Platforms" : vendor}</option>
              ))}
            </select>
          </div>

          {/* Env select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Environment</label>
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-hidden focus:bg-white cursor-pointer"
            >
              {envsList.map(zone => (
                <option key={zone} value={zone}>{zone === "ALL" ? "All Zones" : zone}</option>
              ))}
            </select>
          </div>

          {/* Risk severity level select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Risk Threshold</label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-hidden focus:bg-white cursor-pointer"
            >
              {risksList.map(lvl => (
                <option key={lvl} value={lvl}>{lvl === "ALL" ? "All Risks" : `${lvl} Risk`}</option>
              ))}
            </select>
          </div>

          {/* decision status select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Decision Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-hidden focus:bg-white cursor-pointer"
            >
              {statusList.map(st => (
                <option key={st} value={st}>{st === "ALL" ? "All Statuses" : st}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Spreadsheet grid database table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 px-6 space-y-4">
            <HelpCircle className="h-10 w-10 text-slate-350 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-display">No Corresponding Audit Records Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-light mt-1">
                Verify query keywords or trigger a fresh configuration diff evaluation to create logs.
              </p>
            </div>
            <button
              onClick={onCreateNewRequest}
              className="mt-2 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-205 font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Trigger New Review
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-[12px] text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-250 font-bold tracking-tight text-slate-700">
                  <th className="py-4 px-5">Review Code</th>
                  <th className="py-4 px-4 font-mono">Ticket Ticket CR-ID</th>
                  <th className="py-4 px-4">Vendors</th>
                  <th className="py-4 px-4">Target Zone</th>
                  <th className="py-4 px-4">Audit Severity</th>
                  <th className="py-4 px-4">Status Badges</th>
                  <th className="py-4 px-4">Assigned Auditor</th>
                  <th className="py-4 px-4">Evaluation Date</th>
                  <th className="py-4 px-5 text-right">Actions Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-light text-slate-650">
                {filteredRecords.map((item) => {
                  const itemsDate = new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
                  return (
                    <tr 
                      key={item.id}
                      onClick={() => onViewRecord(item.id)}
                      className="hover:bg-slate-50/50 transition duration-150 cursor-pointer group"
                    >
                      <td className="py-4 px-5 font-bold font-mono text-slate-900">
                        {item.id}
                      </td>
                      <td className="py-4 px-4 font-mono font-medium">
                        {item.changeRequestId}
                      </td>
                      <td className="py-4 px-4 font-sans text-slate-800">
                        {item.deviceType}
                      </td>
                      <td className="py-4 px-4 font-normal text-slate-800">
                        {item.environment}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-extrabold flex items-center gap-1.5 w-max ${getRiskStyle(item.overallRisk)}`}>
                          <span>{item.overallRisk === "Low" ? "🟢" : item.overallRisk === "Medium" ? "🟡" : "🔴"}</span>
                          <span>{item.overallRisk}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 truncate max-w-[120px]" title={item.reviewer}>
                        {item.reviewer}
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                        {itemsDate}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewRecord(item.id);
                            }}
                            className="p-1.5 hover:bg-slate-150 border border-slate-200 bg-white rounded-lg transition text-slate-500 hover:text-slate-900 cursor-pointer shadow-3xs"
                            title="Open detailed view dashboard"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownloadMarkdown(item.id);
                            }}
                            className="p-1.5 hover:bg-slate-150 border border-slate-200 bg-white rounded-lg transition text-slate-500 hover:text-slate-900 cursor-pointer shadow-3xs"
                            title="Download reports MD"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(e, item.id)}
                            disabled={deleteLoadingId === item.id}
                            className={`p-1.5 hover:bg-red-50 border border-red-100 bg-white rounded-lg transition text-red-500 hover:text-red-700 cursor-pointer shadow-3xs ${deleteLoadingId === item.id ? "opacity-50" : ""}`}
                            title="Remove completely"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modern, non-blocking custom confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop blur & overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setConfirmDeleteId(null)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-205 p-6 animate-fadeIn text-left z-10">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-950 font-display">Delete Review Log?</h4>
                <p className="text-xs text-slate-400 font-light">This action is irreversible.</p>
              </div>
            </div>

            <p className="text-xs text-slate-655 font-light leading-relaxed mb-6">
              Are you sure you want to permanently delete configuration review record <strong className="font-semibold text-slate-800">{confirmDeleteId}</strong> from the local registry database?
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
