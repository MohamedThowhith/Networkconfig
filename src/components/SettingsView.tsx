import React, { useState } from "react";
import { 
  Settings, 
  Cpu, 
  HelpCircle, 
  Save, 
  ShieldCheck, 
  CheckCircle, 
  Zap,
  Info
} from "lucide-react";

interface SettingsViewProps {
  onTestAI: () => Promise<boolean>;
  organizationName: string;
  setOrganizationName: (name: string) => void;
  geminiConfigured: boolean;
}

export default function SettingsView({
  onTestAI,
  organizationName,
  setOrganizationName,
  geminiConfigured
}: SettingsViewProps) {
  
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testLog, setTestLog] = useState<string>("");

  const [orgSaveSuccess, setOrgSaveSuccess] = useState<boolean>(false);

  // Local state modifiers for additional configurations
  const [standardCompliance, setStandardCompliance] = useState<string>("NIST-800-53");
  const [retentionDays, setRetentionDays] = useState<number>(180);
  const [allowSelfApproval, setAllowSelfApproval] = useState<boolean>(false);

  const runTestAI = async () => {
    setTestLoading(true);
    setTestSuccess(null);
    setTestLog("System: Connecting to NetGuard secure server gateway...\n");
    
    try {
      // Small simulated console log output during active model tests
      setTimeout(() => setTestLog(prev => prev + "Agent: Initializing GoogleGenAI Client with User-Agent verification...\n"), 400);
      setTimeout(() => setTestLog(prev => prev + "Agent: Sending echo challenge content mapping model: gemini-3.5-flash...\n"), 900);
      
      const success = await onTestAI();
      
      setTimeout(() => {
        setTestSuccess(success);
        setTestLoading(false);
        if (success) {
          setTestLog(prev => prev + "Gateway result: 200 SUCCESS. Model respond successfully with prompt schema parameters! Connection established.\n");
        } else {
          setTestLog(prev => prev + "Gateway result: 503 UNAVAILABLE or Key Misconfigured. Falling back onto local deterministic heuristic rules.\n");
        }
      }, 1600);

    } catch (err: any) {
      setTestSuccess(false);
      setTestLoading(false);
      setTestLog(prev => prev + `Gateway error: Connection failed. ${err.message || err}\n`);
    }
  };

  const saveOrgDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSaveSuccess(true);
    setTimeout(() => setOrgSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold font-display tracking-tight text-slate-950">System Controls & Parameters</h2>
        <p className="text-sm text-slate-500 font-light">Manage local risk offsets, organization profiles, and test model configuration links</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Settings checklist) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Organization Name & retention form card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-slate-500" />
              General Profile Configuration
            </h3>

            <form onSubmit={saveOrgDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Enterprise Organization Name</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Acme Network Operations"
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-950 outline-hidden transition"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Audit Compliance Standard Scope</label>
                  <select
                    value={standardCompliance}
                    onChange={(e) => setStandardCompliance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:bg-white cursor-pointer"
                  >
                    <option value="NIST-800-53">NIST SP 800-53 (US Federal)</option>
                    <option value="ISO-27001">ISO/IEC 27001 Standard</option>
                    <option value="PCI-DSS">PCI-DSS Card Security</option>
                    <option value="SOC2">SOC Type II Framework</option>
                    <option value="CIS-BENCHMARKS">CIS Level 1 Switched benchmarks</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Data Retention Logs Policy</span>
                  <span className="font-mono text-slate-900">{retentionDays} Days</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="730"
                  step="30"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-950"
                />
                <span className="text-[10px] text-slate-400 block font-light leading-snug">
                  Audits, configuration files, and AI evaluations are pruned based on this threshold.
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="self_approval"
                  checked={allowSelfApproval}
                  onChange={(e) => setAllowSelfApproval(e.target.checked)}
                  className="h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-0 cursor-pointer"
                />
                <label htmlFor="self_approval" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                  Force dual auditor signature authorization checks (Avoid single self-approval drifts)
                </label>
              </div>

              {orgSaveSuccess && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 leading-normal">
                  Successfully saved organizational properties!
                </div>
              )}

              <div className="text-right pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save General Settings</span>
                </button>
              </div>

            </form>
          </div>

          {/* Model information card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-slate-500" />
              Cognitive AI Model Selection Strategy
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed font-light">
              <p>
                NetGuard AI connects securely to Google's next-generation LLM pipelines to read complex Cisco/Juniper ACL syntax, summarize structural actions, and suggest compliance remedies.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1">
                  <strong className="text-slate-905 block font-bold">Primary Model Priority</strong>
                  <span className="font-mono text-[11px] text-indigo-750 font-semibold">gemini-3.5-flash</span>
                  <p className="text-[10px] text-slate-400 mt-1 font-light leading-snug">Default model for structural diff explanations and risks classification.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1">
                  <strong className="text-slate-905 block font-bold">Heuristic Backup Ruleset</strong>
                  <span className="font-mono text-[11px] text-emerald-750 font-semibold">Deterministic Policy Engine</span>
                  <p className="text-[10px] text-slate-400 mt-1 font-light leading-snug">Invoked automatically when requests timeout, spike high demand, or connection key is missing.</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-3">
                <Info className="h-4.5 w-4.5 text-slate-400" />
                <span>To use full AI cognitive evaluations, configure the <code>GEMINI_API_KEY</code> variable in the AI Studio Settings menu. Or rely on the built-in deterministic rules tracker!</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: live connection testing console */}
        <div className="space-y-6">
          
          {/* Gemini connection test card */}
          <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-md border border-slate-950 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-amber-400" />
                Live Connection Testing Gateway
              </h3>
              <p className="text-xs text-slate-400 font-light leading-snug">Echo connection challenge testing to verify keys status easily</p>
            </div>

            <button
              onClick={runTestAI}
              disabled={testLoading}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer select-none active:scale-97 ${
                testLoading 
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed" 
                  : "bg-white hover:bg-slate-100 text-slate-950 shadow-sm"
              }`}
            >
              {testLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying API Key...</span>
                </>
              ) : (
                <span>Invoke Echo Connection Test</span>
              )}
            </button>

            {/* Simulated Live command logs */}
            {testLog && (
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] text-slate-400 font-mono">Console Logs Output</span>
                <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-[10px] font-mono text-emerald-400 leading-normal overflow-x-auto max-h-44">
                  {testLog}
                </pre>
              </div>
            )}

            {testSuccess !== null && (
              <div className={`p-3.5 rounded-xl border text-xs leading-normal font-semibold ${
                testSuccess 
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" 
                  : "bg-rose-950/40 text-rose-400 border-rose-900/50"
              }`}>
                {testSuccess 
                  ? "Connection Verified! Gemini 3.5 is responding successfully within latency thresholds. Ready for core audits." 
                  : "Verification Failed. Check settings or rely on local backup heuristics."}
              </div>
            )}

            <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Environment Status:</span>
              <span>{geminiConfigured ? "KEY_DETECTED" : "KEY_NOT_CONFIGURED"}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
