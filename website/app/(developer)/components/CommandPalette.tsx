"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Terminal, Users, FileWarning, ShieldAlert, AlertTriangle } from "lucide-react";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!isOpen) return null;

  const actions = [
    { title: "Command Center", route: "/dev-dashboard", icon: Terminal, risk: false },
    { title: "Manage Developers", route: "/users?tab=developers", icon: Users, risk: false },
    { title: "Public Reports", route: "/dev-dashboard/reports", icon: FileWarning, risk: false },
    { title: "Audit Logs", route: "/dev-audit", icon: ShieldAlert, risk: false },
    { title: "God Mode", route: "/dev-dashboard/god-mode", icon: AlertTriangle, risk: true },
  ];

  const filtered = actions.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0"
        onClick={() => setIsOpen(false)}
      />
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-neutral-800 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 animate-in slide-in-from-top-4 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-neutral-800 bg-[#111]">
          <Search className="h-5 w-5 text-neutral-500 mr-3 shrink-0" />
          <input
            autoFocus
            className="w-full bg-transparent border-none text-white focus:outline-none font-mono text-sm"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-mono text-neutral-400 font-bold ml-2">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-sm font-mono">No results found.</div>
          ) : (
            <ul className="px-2">
              {filtered.map((action, i) => {
                const Icon = action.icon;
                return (
                  <li key={i}>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push(action.route);
                      }}
                      className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors group ${
                        action.risk ? "hover:bg-dev-critical/10" : "hover:bg-neutral-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 mr-3 ${action.risk ? "text-dev-critical" : "text-neutral-500 group-hover:text-white"}`} />
                      <span className={`text-sm font-medium ${action.risk ? "text-dev-critical" : "text-neutral-300 group-hover:text-white"}`}>
                        {action.title}
                      </span>
                      {action.risk && (
                        <span className="ml-auto text-[10px] bg-dev-critical/20 text-dev-critical px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                          Step-Up Required
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
