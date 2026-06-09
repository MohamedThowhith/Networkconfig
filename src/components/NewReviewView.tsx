import React, { useState, useRef } from "react";
import { 
  Upload, 
  ArrowRightLeft, 
  Sparkles, 
  Terminal, 
  FileCode, 
  Settings2, 
  Trash2, 
  AlertTriangle,
  Play
} from "lucide-react";
import { DiffLine, PolicyCheckResult } from "../types";

interface NewReviewViewProps {
  onAnalyze: (payload: {
    oldConfig: string;
    newConfig: string;
    deviceType: string;
    environment: string;
    changeRequestId: string;
    reviewer: string;
  }) => void;
  loading: boolean;
  loadingTimer: number;
}

// Full preset configurations for demo ease-of-use
const SAMPLE_CISCO_OLD = `! Baseline Router Version 15.2
hostname Edge-Gateway-Internal
!
interface GigabitEthernet0/1
 description local corporate egress
 ip address 10.10.20.1 255.255.255.0
 speed auto
 duplex auto
!
line vty 0 4
 login local
 transport input ssh
!`;

const SAMPLE_CISCO_NEW = `! Edge Gateway Configuration Updates
hostname Edge-Gateway-ZoneA
!
interface GigabitEthernet0/1
 description local corporate egress (widened client lane)
 ip address 10.10.20.1 255.255.255.0
 speed 1000
 duplex full
!
line vty 0 4
 login local
 transport input telnet ssh
!`;

const SAMPLE_PALO_OLD = `# Palo Alto Firewall Security Rule Baseline
set rulebase security rules "Trusted DNS Queries" description "Allow central corporate name lookup servers"
set rulebase security rules "Trusted DNS Queries" from Internal-Core to External-Public
set rulebase security rules "Trusted DNS Queries" source 10.244.5.10
set rulebase security rules "Trusted DNS Queries" destination 8.8.8.8
set rulebase security rules "Trusted DNS Queries" service service-dns
set rulebase security rules "Trusted DNS Queries" action allow`;

const SAMPLE_PALO_NEW = `# Palo Alto Firewall Security Rule Updates
set rulebase security rules "Trusted DNS Queries" description "Allow central corporate name lookup servers"
set rulebase security rules "Trusted DNS Queries" from Internal-Core to External-Public
set rulebase security rules "Trusted DNS Queries" source any
set rulebase security rules "Trusted DNS Queries" destination any
set rulebase security rules "Trusted DNS Queries" service any
set rulebase security rules "Trusted DNS Queries" action allow`;


export default function NewReviewView({
  onAnalyze,
  loading,
  loadingTimer
}: NewReviewViewProps) {
  
  // Form inputs
  const [oldConfig, setOldConfig] = useState<string>("");
  const [newConfig, setNewConfig] = useState<string>("");
  const [deviceType, setDeviceType] = useState<string>("Cisco IOS");
  const [environment, setEnvironment] = useState<string>("Production");
  const [changeRequestId, setChangeRequestId] = useState<string>("CHG-2026-9041");
  const [reviewer, setReviewer] = useState<string>("Security Operations Hub");

  // Local feedback validation
  const [errorText, setErrorText] = useState<string | null>(null);

  // Drag state trackers
  const [dragState, setDragState] = useState<"old" | "new" | null>(null);

  // File system refs
  const fileInputOldRef = useRef<HTMLInputElement>(null);
  const fileInputNewRef = useRef<HTMLInputElement>(null);

  const togglePreset = (type: "cisco" | "palo") => {
    if (type === "cisco") {
      setOldConfig(SAMPLE_CISCO_OLD);
      setNewConfig(SAMPLE_CISCO_NEW);
      setDeviceType("Cisco IOS");
      setChangeRequestId("CHG-2026-9041");
    } else {
      setOldConfig(SAMPLE_PALO_OLD);
      setNewConfig(SAMPLE_PALO_NEW);
      setDeviceType("Palo Alto");
      setChangeRequestId("CHG-2026-1052");
    }
    setErrorText(null);
  };

  const clearTerminals = () => {
    setOldConfig("");
    setNewConfig("");
    setErrorText(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "old" | "new") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500000) {
      setErrorText("Input matches file sizes above 500KB. Try truncated configs.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (target === "old") setOldConfig(text);
      else setNewConfig(text);
      setErrorText(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldConfig.trim() || !newConfig.trim()) {
      setErrorText("Please upload, drag or paste baseline and proposed network configuration codes.");
      return;
    }
    setErrorText(null);
    
    onAnalyze({
      oldConfig,
      newConfig,
      deviceType,
      environment,
      changeRequestId,
      reviewer
    });
  };

  const handleDragOver = (e: React.DragEvent, target: "old" | "new") => {
    e.preventDefault();
    setDragState(target);
  };

  const handleDragLeave = () => {
    setDragState(null);
  };

  const handleDrop = (e: React.DragEvent, target: "old" | "new") => {
    e.preventDefault();
    setDragState(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (target === "old") setOldConfig(text);
      else setNewConfig(text);
      setErrorText(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-950">Initialize Cognitive Configuration Review</h2>
          <p className="text-sm text-slate-500 font-light">Input physical configs, set compliance variables and run automated audit validation loops</p>
        </div>
        
        {/* Preset quick buttons */}
        <div className="flex gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => togglePreset("cisco")}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold px-4 py-2 rounded-xl transition shadow-3xs hover:-translate-y-0.5 cursor-pointer"
          >
            Load Cisco (Telnet Alert)
          </button>
          <button 
            type="button"
            onClick={() => togglePreset("palo")}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold px-4 py-2 rounded-xl transition shadow-3xs hover:-translate-y-0.5 cursor-pointer"
          >
            Load Palo Alto (Wildcard Alert)
          </button>
        </div>
      </div>

      <form onSubmit={onFormSubmit} className="space-y-6">
        
        {/* Meta details inputs box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 font-mono flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-slate-500" />
            Config Review Credentials
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Device Type Select */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Appliance Vendor Type</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-slate-900 outline-hidden transition cursor-pointer"
              >
                <option value="Cisco IOS">Cisco IOS Switch/Router</option>
                <option value="Juniper">Juniper Junos Net</option>
                <option value="Fortinet">Fortinet FortiGate</option>
                <option value="Palo Alto">Palo Alto Network Firewall</option>
                <option value="Generic">Generic / Multi-platform Config</option>
              </select>
            </div>

            {/* Target Environment */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Target Environment Zone</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-slate-900 outline-hidden transition cursor-pointer"
              >
                <option value="Production">Production Core Zone</option>
                <option value="Staging">Staging DMZ Environment</option>
                <option value="Development">Development Lab / Testing</option>
              </select>
            </div>

            {/* Change Request ID */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Change Ticket Ticket CR-ID</label>
              <input
                type="text"
                value={changeRequestId}
                onChange={(e) => setChangeRequestId(e.target.value)}
                placeholder="e.g. CHG-2026-9041"
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-slate-900 outline-hidden transition"
                required
              />
            </div>

            {/* assigned reviewer name */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Auditor / Auditor Signature Name</label>
              <input
                type="text"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                placeholder="Manager or Department"
                className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-3 text-xs font-medium text-slate-800 focus:bg-white focus:border-slate-900 outline-hidden transition"
                required
              />
            </div>

          </div>
        </div>

        {/* Configurations Pasting Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Baseline config card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs">
            <div className="bg-slate-50/80 border-b border-slate-100 p-4.5 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileCode className="h-4.5 w-4.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-905">Baseline Hardware Configuration</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputOldRef.current?.click()}
                className="text-[11px] bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1 cursor-pointer shadow-3xs"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Upload</span>
              </button>
              <input
                type="file"
                ref={fileInputOldRef}
                onChange={(e) => handleFileUpload(e, "old")}
                className="hidden"
                accept=".txt,.cfg,.conf,text/plain"
              />
            </div>

            <div 
              onDragOver={(e) => handleDragOver(e, "old")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "old")}
              className={`p-4 flex-1 relative ${dragState === "old" ? "bg-slate-100 border-2 border-dashed border-slate-900" : "bg-white"}`}
            >
              <textarea
                value={oldConfig}
                onChange={(e) => setOldConfig(e.target.value)}
                placeholder="! Paste base / current config content here. Or drag backup .txt/.cfg configs directly onto this workspace..."
                className="w-full h-80 font-mono text-xs p-4 bg-slate-50/20 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all leading-relaxed"
              />
              {dragState === "old" && (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-3xs rounded-xl flex items-center justify-center pointer-events-none">
                  <span className="bg-slate-950 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md">
                    Drop Baseline Config Here
                  </span>
                </div>
              )}
            </div>
            <div className="px-4.5 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Lines count: {oldConfig ? oldConfig.split(/\n/).length : 0} lines</span>
              <span>Total size: {oldConfig.length.toLocaleString()} characters</span>
            </div>
          </div>

          {/* Proposed config override card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs">
            <div className="bg-slate-50/80 border-b border-slate-100 p-4.5 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4.5 w-4.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-905">Proposed Configuration Override</span>
              </div>
              <div className="flex gap-1.5">
                {oldConfig && newConfig && (
                  <button 
                    type="button"
                    onClick={clearTerminals}
                    className="text-[11px] bg-slate-100 border border-slate-200 text-slate-650 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                    title="Clear entries"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputNewRef.current?.click()}
                  className="text-[11px] bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1 cursor-pointer shadow-3xs"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-400" />
                  <span>Upload</span>
                </button>
                <input
                  type="file"
                  ref={fileInputNewRef}
                  onChange={(e) => handleFileUpload(e, "new")}
                  className="hidden"
                  accept=".txt,.cfg,.conf,text/plain"
                />
              </div>
            </div>

            <div 
              onDragOver={(e) => handleDragOver(e, "new")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "new")}
              className={`p-4 flex-1 relative ${dragState === "new" ? "bg-slate-100 border-2 border-dashed border-slate-900" : "bg-white"}`}
            >
              <textarea
                value={newConfig}
                onChange={(e) => setNewConfig(e.target.value)}
                placeholder="! Paste the proposed instructions config here..."
                className="w-full h-80 font-mono text-xs p-4 bg-slate-50/20 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all leading-relaxed"
              />
              {dragState === "new" && (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-3xs rounded-xl flex items-center justify-center pointer-events-none">
                  <span className="bg-slate-950 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md">
                    Drop Proposed Config Here
                  </span>
                </div>
              )}
            </div>
            <div className="px-4.5 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Lines count: {newConfig ? newConfig.split(/\n/).length : 0} lines</span>
              <span>Total size: {newConfig.length.toLocaleString()} characters</span>
            </div>
          </div>

        </div>

        {/* Validation Errors banner */}
        {errorText && (
          <div className="bg-rose-50 border border-rose-250 p-4 rounded-2xl flex items-start gap-3 shadow-3xs">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800">
              <span className="font-bold block text-rose-950 mb-0.5">Validation Checklist Failed</span>
              {errorText}
            </div>
          </div>
        )}

        {/* Run review actions panel */}
        <div className="flex justify-center pt-3.5">
          <button
            type="submit"
            disabled={loading}
            className={`cursor-pointer w-full sm:w-auto px-12 py-5 rounded-2xl font-display font-extrabold text-white text-sm transition shadow-lg flex items-center justify-center space-x-3 active:scale-97 ${
              loading 
                ? "bg-slate-900 text-slate-300 cursor-not-allowed shadow-none" 
                : "bg-slate-950 hover:bg-slate-900 shadow-slate-950/15"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing Configurations ({loadingTimer.toFixed(1)}s)...</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4.5 w-4.5 text-emerald-400" />
                <span>Trigger Analysis Sequence</span>
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse ml-1" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
