import React from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings, 
  ShieldCheck,
  Menu,
  X,
  FileCode2,
  Sparkles
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  geminiConfigured: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  geminiConfigured,
  mobileOpen,
  setMobileOpen
}: SidebarProps) {
  
  const navItems = [
    { id: "dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
    { id: "new-review", label: "Analyze Configuration", icon: PlusCircle },
    { id: "history", label: "Review Registry", icon: History },
    { id: "capabilities", label: "AI Challenge Showcase", icon: Sparkles },
    { id: "settings", label: "System Control", icon: Settings },
  ];

  return (
    <>
      {/* Handheld/Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Navigation Drawer Content */}
      <aside className={`
        fixed top-0 bottom-0 left-0 w-66 bg-slate-950 text-slate-100 z-50 border-r border-slate-800 flex flex-col justify-between
        transition-transform duration-300 transform lg:transform-none lg:sticky lg:top-18 lg:h-[calc(100vh-4.5rem)]
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        
        {/* Branding Area for Mobile drawer when topbar isn't present */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between lg:hidden bg-slate-900">
          <div className="flex items-center space-x-2.5">
            <span className="font-display font-black text-emerald-400 tracking-tight text-base">NetGuard AI</span>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3.5 py-6 space-y-7 overflow-y-auto">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-500 px-3 block mb-3.5">
              Operations Hub
            </span>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isSelected = activeTab === item.id || (item.id === "new-review" && activeTab === "analysis-result");
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-3.5 rounded-xl text-sm font-semibold transition-all relative ${
                      isSelected 
                        ? "bg-slate-900 text-white font-bold border border-slate-800 shadow-sm" 
                        : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-r-md" />
                    )}
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Manual Documents */}
          <div className="pt-2">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-500 px-3 block mb-3">
              Standard Compliance
            </span>
            <div className="space-y-2 px-3 text-xs text-slate-400">
              <div className="flex items-center space-x-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/40">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>NIST-800 Audited</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/40">
                <FileCode2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>SOC2 Framework</span>
              </div>
            </div>
          </div>
        </div>

        {/* Static Bottom Identity Indicator */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/30 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Gemini Cognitive:</span>
            {geminiConfigured ? (
              <span className="inline-flex items-center text-emerald-400 font-bold font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mr-1" />
                ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-400 font-bold font-mono">
                <span className="h-2 w-2 rounded-full bg-amber-400 mr-1" />
                OFFLINE
              </span>
            )}
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            NetGuard Security Suite v2.10
          </div>
        </div>
      </aside>
    </>
  );
}
