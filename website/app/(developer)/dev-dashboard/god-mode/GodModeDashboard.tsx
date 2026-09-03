'use client';

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Clock, EyeOff, Flag, Loader2, Lock, RadioTower, ShieldAlert, ShieldCheck, ToggleLeft, ToggleRight, Users } from "lucide-react";
import { revokePrivilegedSession, updateFeatureFlag } from "./actions";
import { toast } from "sonner";

type ActiveSession = {
  id: string;
  expires_at: string;
  created_at: string;
};

type FeatureFlag = {
  id: string;
  name: string;
  value: any;
  updated_at: string;
  updated_by: string | null;
  users?: { email?: string; name?: string | null } | null;
};

type GodSession = {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};

type SecurityEvent = {
  id: string;
  actor_id: string | null;
  event_type: string;
  details: Record<string, any>;
  ip_address: string | null;
  timestamp?: string;
  created_at?: string;
};

type RootDeveloper = {
  user_id: string;
  is_root: boolean;
  users?: { email?: string; name?: string | null } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleString();
}

function minutesRemaining(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000));
}

function flagEnabled(value: any) {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && "enabled" in value) return Boolean(value.enabled);
  return Boolean(value);
}

export default function GodModeDashboard({
  userEmail,
  activeSession,
  featureFlags,
  godSessions,
  securityEvents,
  rootDevelopers,
}: {
  userEmail: string | undefined;
  activeSession: ActiveSession;
  featureFlags: FeatureFlag[];
  godSessions: GodSession[];
  securityEvents: SecurityEvent[];
  rootDevelopers: RootDeveloper[];
}) {
  const [selectedFlagId, setSelectedFlagId] = useState(featureFlags[0]?.id || "");
  const [flagReason, setFlagReason] = useState("");
  const [flagConfirmation, setFlagConfirmation] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedFlag = featureFlags.find((flag) => flag.id === selectedFlagId) || null;
  const activePrivilegedSessions = useMemo(
    () => godSessions.filter((session) => !session.revoked_at && new Date(session.expires_at).getTime() > Date.now()),
    [godSessions]
  );

  const handleFlagUpdate = (value: boolean) => {
    if (!selectedFlag || pending) return;
    startTransition(async () => {
      try {
        const result = await updateFeatureFlag({
          flagId: selectedFlag.id,
          value,
          reason: flagReason,
          confirmation: flagConfirmation,
        });
        toast.success(result.message);
        setFlagReason("");
        setFlagConfirmation("");
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  const handleRevokeSession = (session: GodSession) => {
    const reason = window.prompt("Reason for revoking this privileged session:");
    if (!reason) return;
    startTransition(async () => {
      try {
        const result = await revokePrivilegedSession({ sessionId: session.id, reason });
        toast.success(result.message);
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8 animate-slide-up">
      <div className="border border-dev-critical/40 bg-[#080808] p-5 shadow-[0_0_40px_rgba(225,29,72,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-dev-critical">DHARA-SOOCHAK / ROOT CONTROL</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-white">
              <ShieldAlert className="h-8 w-8 text-dev-critical" />
              Root Control Active
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">Every privileged request is server-validated against root eligibility and the short-lived God Mode cookie.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border border-dev-critical/30 bg-dev-critical/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-dev-critical">Session</p>
              <p className="mt-1 font-mono text-xl font-black text-white">{minutesRemaining(activeSession.expires_at)} min remaining</p>
            </div>
            <div className="border border-neutral-800 bg-black p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Identity</p>
              <p className="mt-1 font-mono text-sm text-dev-critical">{userEmail || "root"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {([
          { label: "Feature Flags", value: featureFlags.length, Icon: Flag },
          { label: "Root Developers", value: rootDevelopers.length, Icon: Users },
          { label: "Privileged Sessions", value: activePrivilegedSessions.length, Icon: Lock },
          { label: "Security Events", value: securityEvents.length, Icon: Activity },
        ] as const).map(({ label, value, Icon }) => (
          <div key={label} className="border border-neutral-800 bg-[#080808] p-4">
            <Icon className="h-5 w-5 text-dev-critical" />
            <p className="mt-4 font-mono text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="border border-neutral-800 bg-[#050505] p-5 xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                <Flag className="h-4 w-4 text-dev-critical" />
                High-Risk Configuration
              </h2>
              <p className="mt-1 text-xs text-neutral-500">Only flags present in the backend are actionable here.</p>
            </div>
            <span className="border border-dev-critical/30 bg-dev-critical/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-dev-critical">Audited</span>
          </div>

          {featureFlags.length === 0 ? (
            <div className="mt-5 border border-neutral-800 bg-black p-6 text-center">
              <EyeOff className="mx-auto h-8 w-8 text-neutral-600" />
              <p className="mt-3 text-sm font-semibold text-white">No feature flags are configured.</p>
              <p className="mt-1 text-xs text-neutral-500">Controls are intentionally unavailable instead of rendering fake toggles.</p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
              <div className="space-y-2">
                {featureFlags.map((flag) => (
                  <button
                    key={flag.id}
                    onClick={() => setSelectedFlagId(flag.id)}
                    className={`w-full border p-3 text-left ${selectedFlagId === flag.id ? "border-dev-critical/50 bg-dev-critical/10" : "border-neutral-800 bg-black hover:border-neutral-600"}`}
                  >
                    <span className="block text-sm font-bold text-white">{flag.name}</span>
                    <span className="mt-1 block font-mono text-[11px] text-neutral-500">{flag.id}</span>
                  </button>
                ))}
              </div>

              {selectedFlag && (
                <div className="border border-neutral-800 bg-black p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">{selectedFlag.name}</h3>
                      <p className="mt-1 font-mono text-xs text-neutral-500">{selectedFlag.id}</p>
                    </div>
                    <div className={flagEnabled(selectedFlag.value) ? "text-dev-success" : "text-neutral-500"}>
                      {flagEnabled(selectedFlag.value) ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="border border-neutral-800 bg-[#050505] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Current</p>
                      <p className="mt-1 text-sm text-white">{flagEnabled(selectedFlag.value) ? "ON" : "OFF"}</p>
                    </div>
                    <div className="border border-neutral-800 bg-[#050505] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Last changed</p>
                      <p className="mt-1 text-sm text-white">{formatDate(selectedFlag.updated_at)}</p>
                    </div>
                  </div>
                  <div className="mt-4 border border-dev-warning/30 bg-dev-warning/10 p-3 text-xs text-dev-warning">
                    <AlertTriangle className="mr-2 inline h-4 w-4" />
                    This change may affect public visibility, operational behavior, or administrative access. Type the confirmation phrase before applying.
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <input value={flagReason} onChange={(event) => setFlagReason(event.target.value)} placeholder="Audit reason" className="h-10 border border-neutral-800 bg-[#050505] px-3 text-sm text-white outline-none focus:border-dev-critical" />
                    <input value={flagConfirmation} onChange={(event) => setFlagConfirmation(event.target.value)} placeholder='Type "APPLY ROOT CHANGE"' className="h-10 border border-dev-critical/40 bg-dev-critical/10 px-3 text-sm text-white outline-none focus:border-dev-critical" />
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button disabled={pending || !flagReason || flagConfirmation !== "APPLY ROOT CHANGE"} onClick={() => handleFlagUpdate(true)} className="inline-flex h-10 items-center justify-center gap-2 bg-dev-critical px-4 text-sm font-bold text-white disabled:border disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-600">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RadioTower className="h-4 w-4" />} Verify & Enable
                      </button>
                      <button disabled={pending || !flagReason || flagConfirmation !== "APPLY ROOT CHANGE"} onClick={() => handleFlagUpdate(false)} className="inline-flex h-10 items-center justify-center gap-2 border border-neutral-700 bg-black px-4 text-sm font-bold text-white hover:border-dev-critical disabled:text-neutral-600">
                        Disable
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="border border-neutral-800 bg-[#050505] p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
            <Lock className="h-4 w-4 text-dev-critical" />
            Privileged Sessions
          </h2>
          <div className="mt-4 space-y-3">
            {activePrivilegedSessions.map((session) => (
              <div key={session.id} className="border border-neutral-800 bg-black p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-white">{session.id.slice(0, 8)}...</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Expires {formatDate(session.expires_at)}</p>
                  </div>
                  <button onClick={() => handleRevokeSession(session)} className="border border-dev-critical/30 bg-dev-critical/10 px-2 py-1 text-[11px] font-bold text-dev-critical hover:bg-dev-critical/20">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
            {activePrivilegedSessions.length === 0 && <p className="border border-neutral-800 bg-black p-6 text-center text-sm text-neutral-500">No active privileged sessions.</p>}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="border border-neutral-800 bg-[#050505] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
              <Activity className="h-4 w-4 text-dev-critical" />
              Recent Root Activity
            </h2>
            <Link href="/dev-audit" className="text-xs font-semibold text-dev-critical hover:text-white">View audit</Link>
          </div>
          <div className="mt-4 space-y-2">
            {securityEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="border border-neutral-800 bg-black p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold text-white">{event.event_type}</span>
                  <span className="font-mono text-[10px] text-neutral-500">{formatDate(event.timestamp || event.created_at)}</span>
                </div>
                <p className="mt-2 truncate text-xs text-neutral-500">{JSON.stringify(event.details || {})}</p>
              </div>
            ))}
            {securityEvents.length === 0 && <p className="border border-neutral-800 bg-black p-6 text-center text-sm text-neutral-500">No security events found.</p>}
          </div>
        </section>

        <section className="border border-neutral-800 bg-[#050505] p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
            <ShieldCheck className="h-4 w-4 text-dev-critical" />
            Root Developers
          </h2>
          <div className="mt-4 space-y-2">
            {rootDevelopers.map((root) => (
              <div key={root.user_id} className="border border-neutral-800 bg-black p-3">
                <p className="text-sm font-semibold text-white">{root.users?.name || root.users?.email || root.user_id}</p>
                <p className="mt-1 font-mono text-[11px] text-neutral-500">{root.users?.email || root.user_id}</p>
              </div>
            ))}
            {rootDevelopers.length === 0 && <p className="border border-neutral-800 bg-black p-6 text-center text-sm text-neutral-500">No root developer records found.</p>}
          </div>
          <div className="mt-4 border border-dev-warning/30 bg-dev-warning/10 p-3 text-xs text-dev-warning">
            Root assignment remains unavailable here because the current backend only supports one-time bootstrap.
          </div>
        </section>
      </div>
    </div>
  );
}
