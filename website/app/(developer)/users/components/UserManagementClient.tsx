"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  MailPlus,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { grantDeveloperProfile, inviteDeveloper, revokeDeveloperGrant } from "../actions";
import { toast } from "sonner";

type UserRole = "developer" | "officer" | "public";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  email_verified: boolean;
  created_at: string;
  updated_at?: string | null;
  is_demo?: boolean;
};

type AuthUser = {
  id: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  created_at?: string;
  last_sign_in_at?: string | null;
  confirmed_at?: string | null;
  email_confirmed_at?: string | null;
};

type OfficerProfile = {
  user_id: string;
  designation: string | null;
  jurisdiction: string | null;
  department: string | null;
  badge_id: string | null;
};

type PublicReport = {
  id: string;
  reporter_id: string | null;
  status: string;
  created_at: string;
};

type Advisory = {
  id: string;
  created_by: string;
  published_by: string | null;
  status: string;
};

type DeveloperIdentity = {
  user_id: string;
  is_root: boolean;
};

type Grant = {
  id: string;
  user_id: string;
  profile_id: string;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  reason: string;
};

type Profile = {
  id: string;
  name: string;
  description: string;
};

type ProfilePermission = {
  profile_id: string;
  permission_id: string;
};

type Permission = {
  id: string;
  name: string;
  description: string;
};

type GodSession = {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};

type ActivityEvent = {
  id: string;
  actor_id?: string | null;
  actor_user_id?: string | null;
  event_type?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  old_value?: Record<string, any> | null;
  new_value?: Record<string, any> | null;
  timestamp?: string;
  created_at?: string;
};

type Props = {
  users: User[];
  authUsers: AuthUser[];
  officerProfiles: OfficerProfile[];
  publicReports: PublicReport[];
  advisories: Advisory[];
  developerIdentities: DeveloperIdentity[];
  grants: Grant[];
  profiles: Profile[];
  profilePermissions: ProfilePermission[];
  permissions: Permission[];
  godSessions: GodSession[];
  securityEvents: ActivityEvent[];
  auditLogs: ActivityEvent[];
  isGodMode: boolean;
  canManageUsers: boolean;
};

const highRiskPermissions = new Set([
  "users.manage",
  "developers.permissions.grant",
  "developers.permissions.revoke",
  "feature_flags.update",
  "advisories.publish",
  "god_mode.enter",
]);

const permissionGroups: Record<string, string[]> = {
  Reports: ["reports.read", "reports.update", "reports.delete"],
  Advisories: ["advisories.read", "advisories.publish"],
  Users: ["users.read", "users.manage", "developers.permissions.grant", "developers.permissions.revoke"],
  Governance: ["audit.read", "feature_flags.read", "feature_flags.update", "god_mode.enter"],
};

function formatDate(value?: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleString();
}

function initials(user: User) {
  return (user.name || user.email || "U")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function isGrantActive(grant: Grant) {
  if (grant.revoked_at) return false;
  if (!grant.expires_at) return true;
  return new Date(grant.expires_at).getTime() > Date.now();
}

function statusFor(user: User, activeSessionCount: number) {
  if (!user.email_verified) return "Unverified";
  if (user.role === "developer" && activeSessionCount > 0) return "Privileged session";
  return "Active";
}

export default function UserManagementClient({
  users,
  authUsers,
  officerProfiles,
  publicReports,
  advisories,
  developerIdentities,
  grants,
  profiles,
  profilePermissions,
  permissions,
  godSessions,
  securityEvents,
  auditLogs,
  isGodMode,
  canManageUsers,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(initialTab === "officers" || initialTab === "public" ? initialTab : "developers");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [grantProfileId, setGrantProfileId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantExpiresAt, setGrantExpiresAt] = useState("");
  const [grantConfirmation, setGrantConfirmation] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "developers" || tab === "officers" || tab === "public") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const authById = useMemo(() => new Map(authUsers.map((user) => [user.id, user])), [authUsers]);
  const officerById = useMemo(() => new Map(officerProfiles.map((profile) => [profile.user_id, profile])), [officerProfiles]);
  const identityById = useMemo(() => new Map(developerIdentities.map((identity) => [identity.user_id, identity])), [developerIdentities]);
  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles]);
  const permissionById = useMemo(() => new Map(permissions.map((permission) => [permission.id, permission])), [permissions]);

  const selectedUser = selectedUserId ? usersById.get(selectedUserId) || null : null;
  const selectedAuth = selectedUser ? authById.get(selectedUser.id) : null;
  const selectedOfficer = selectedUser ? officerById.get(selectedUser.id) : null;
  const selectedGrants = selectedUser ? grants.filter((grant) => grant.user_id === selectedUser.id) : [];
  const activeGrants = selectedGrants.filter(isGrantActive);
  const revokedGrants = selectedGrants.filter((grant) => grant.revoked_at);
  const expiredGrants = selectedGrants.filter((grant) => !grant.revoked_at && grant.expires_at && new Date(grant.expires_at).getTime() <= Date.now());
  const activeSessions = selectedUser
    ? godSessions.filter((session) => session.user_id === selectedUser.id && !session.revoked_at && new Date(session.expires_at).getTime() > Date.now())
    : [];

  const effectivePermissions = useMemo(() => {
    const ids = new Set<string>();
    activeGrants.forEach((grant) => {
      profilePermissions
        .filter((row) => row.profile_id === grant.profile_id)
        .forEach((row) => ids.add(row.permission_id));
    });
    return ids;
  }, [activeGrants, profilePermissions]);

  const selectedProfilePermissions = grantProfileId
    ? profilePermissions.filter((row) => row.profile_id === grantProfileId).map((row) => row.permission_id)
    : [];
  const selectedProfileHighRisk = selectedProfilePermissions.some((permission) => highRiskPermissions.has(permission));

  const developers = users.filter((user) => user.role === "developer");
  const officers = users.filter((user) => user.role === "officer");
  const publicUsers = users.filter((user) => user.role === "public");

  const updateTab = (tab: string) => {
    setActiveTab(tab);
    setSelectedUserId(null);
    router.replace(`/users?tab=${tab}`, { scroll: false });
  };

  const filteredUsers = (list: User[]) => {
    const query = search.toLowerCase().trim();
    if (!query) return list;
    return list.filter((user) =>
      [user.name, user.email, user.role].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    );
  };

  const recentActivity = selectedUser
    ? [...securityEvents, ...auditLogs]
        .filter((event) => {
          const payload = JSON.stringify(event).toLowerCase();
          return payload.includes(selectedUser.id.toLowerCase()) || payload.includes(selectedUser.email.toLowerCase());
        })
        .sort((a, b) => new Date(b.timestamp || b.created_at || 0).getTime() - new Date(a.timestamp || a.created_at || 0).getTime())
        .slice(0, 8)
    : [];

  const handleInvite = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail || pending) return;
    if (!isGodMode) {
      toast.error("God Mode step-up is required to invite developers.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await inviteDeveloper(inviteEmail);
        toast.success(result.message);
        setInviteOpen(false);
        setInviteEmail("");
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  const handleGrant = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser || selectedUser.role !== "developer" || !grantProfileId || !grantReason || pending) return;
    startTransition(async () => {
      try {
        const result = await grantDeveloperProfile({
          targetUserId: selectedUser.id,
          profileId: grantProfileId,
          reason: grantReason,
          expiresAt: grantExpiresAt || null,
          confirmation: grantConfirmation,
        });
        toast.success(result.message);
        setGrantProfileId("");
        setGrantReason("");
        setGrantExpiresAt("");
        setGrantConfirmation("");
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  const handleRevoke = (grant: Grant) => {
    const reason = window.prompt(`Reason for revoking ${profileById.get(grant.profile_id)?.name || "this profile"}:`);
    if (!reason) return;
    startTransition(async () => {
      try {
        const result = await revokeDeveloperGrant({ grantId: grant.id, reason });
        toast.success(result.message);
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  const renderStatus = (user: User) => {
    const count = godSessions.filter((session) => session.user_id === user.id && !session.revoked_at && new Date(session.expires_at).getTime() > Date.now()).length;
    const status = statusFor(user, count);
    const className = status === "Privileged session"
      ? "border-dev-critical/40 bg-dev-critical/10 text-dev-critical"
      : status === "Unverified"
        ? "border-dev-warning/40 bg-dev-warning/10 text-dev-warning"
        : "border-dev-success/40 bg-dev-success/10 text-dev-success";

    return <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${className}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
  };

  const renderRoleTable = (list: User[], role: UserRole) => {
    const rows = filteredUsers(list);
    return (
      <div className="overflow-x-auto border border-dev-border bg-dev-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-dev-border bg-dev-elevated text-[10px] uppercase tracking-[0.18em] text-dev-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Identity</th>
              {role === "developer" && <th className="px-4 py-3 font-semibold">Root</th>}
              {role === "developer" && <th className="px-4 py-3 font-semibold">God Mode</th>}
              {role === "developer" && <th className="px-4 py-3 font-semibold">Permission Profile</th>}
              {role === "developer" && <th className="px-4 py-3 font-semibold">Effective Permissions</th>}
              {role === "officer" && <th className="px-4 py-3 font-semibold">Department</th>}
              {role === "officer" && <th className="px-4 py-3 font-semibold">Designation</th>}
              {role === "officer" && <th className="px-4 py-3 font-semibold">Jurisdiction</th>}
              {role === "officer" && <th className="px-4 py-3 font-semibold">Reports</th>}
              {role === "officer" && <th className="px-4 py-3 font-semibold">Advisories</th>}
              {role === "public" && <th className="px-4 py-3 font-semibold">Email State</th>}
              {role === "public" && <th className="px-4 py-3 font-semibold">Reports Submitted</th>}
              {role === "public" && <th className="px-4 py-3 font-semibold">Account State</th>}
              <th className="px-4 py-3 font-semibold">Last Active</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dev-border">
            {rows.map((user) => {
              const userGrants = grants.filter((grant) => grant.user_id === user.id && isGrantActive(grant));
              const userPermissionCount = new Set(userGrants.flatMap((grant) => profilePermissions.filter((row) => row.profile_id === grant.profile_id).map((row) => row.permission_id))).size;
              const userSessions = godSessions.filter((session) => session.user_id === user.id && !session.revoked_at && new Date(session.expires_at).getTime() > Date.now());
              const officer = officerById.get(user.id);
              const reportCount = publicReports.filter((report) => report.reporter_id === user.id).length;
              const resolvedReports = publicReports.filter((report) => report.reporter_id === user.id && report.status === "RESOLVED").length;
              const officerAdvisories = advisories.filter((advisory) => advisory.created_by === user.id || advisory.published_by === user.id).length;
              const authUser = authById.get(user.id);

              return (
                <tr key={user.id} className="hover:bg-dev-elevated/70">
                  <td className="px-4 py-4">
                    <button onClick={() => setSelectedUserId(user.id)} className="group flex items-center gap-3 text-left">
                      <span className="flex h-9 w-9 items-center justify-center border border-dev-border bg-dev-bg text-xs font-bold text-dev-text group-hover:border-dev-primary group-hover:text-dev-primary">{initials(user)}</span>
                      <span>
                        <span className="block font-semibold text-white group-hover:text-dev-primary">{user.name || "Unnamed identity"}</span>
                        <span className="block font-mono text-[11px] text-dev-text-muted">{user.email}</span>
                      </span>
                    </button>
                  </td>
                  {role === "developer" && <td className="px-4 py-4">{identityById.get(user.id)?.is_root ? <span className="text-dev-critical font-bold">ROOT</span> : <span className="text-dev-text-muted">No</span>}</td>}
                  {role === "developer" && <td className="px-4 py-4">{userSessions.length ? <span className="text-dev-critical">{userSessions.length} active</span> : <span className="text-dev-text-muted">Inactive</span>}</td>}
                  {role === "developer" && <td className="px-4 py-4 text-dev-text">{userGrants.map((grant) => profileById.get(grant.profile_id)?.name).filter(Boolean).join(", ") || "None"}</td>}
                  {role === "developer" && <td className="px-4 py-4 font-mono text-xs text-dev-accent">{userPermissionCount}</td>}
                  {role === "officer" && <td className="px-4 py-4 text-dev-text">{officer?.department || "Unassigned"}</td>}
                  {role === "officer" && <td className="px-4 py-4 text-dev-text">{officer?.designation || "Unavailable"}</td>}
                  {role === "officer" && <td className="px-4 py-4 text-dev-text">{officer?.jurisdiction || "Unassigned"}</td>}
                  {role === "officer" && <td className="px-4 py-4 text-dev-text">{resolvedReports} resolved</td>}
                  {role === "officer" && <td className="px-4 py-4 text-dev-text">{officerAdvisories}</td>}
                  {role === "public" && <td className="px-4 py-4 text-dev-text">{user.email_verified ? "Verified" : "Unverified"}</td>}
                  {role === "public" && <td className="px-4 py-4 text-dev-text">{reportCount}</td>}
                  {role === "public" && <td className="px-4 py-4 text-dev-text">{user.is_demo ? "Demo seed" : "Registered"}</td>}
                  <td className="px-4 py-4 font-mono text-xs text-dev-text-muted">{formatDate(authUser?.last_sign_in_at || user.updated_at || user.created_at)}</td>
                  <td className="px-4 py-4">{renderStatus(user)}</td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => setSelectedUserId(user.id)} className="inline-flex items-center gap-1.5 border border-dev-primary/30 bg-dev-primary/10 px-3 py-1.5 text-xs font-semibold text-dev-primary hover:bg-dev-primary/20 hover:text-white">
                      <ExternalLink className="h-3.5 w-3.5" /> Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-dev-text-muted">
                  No {role === "public" ? "public users" : `${role}s`} match the current search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col gap-4 border-b border-dev-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-dev-primary">DHARA-SOOCHAK / Identity Control</p>
          <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">Identity & Access Management</h1>
          <p className="mt-2 max-w-3xl text-sm text-dev-text-muted">
            Separate developer, officer, and public identities with backend-backed permissions, activity, and session state.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dev-text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search identities"
              className="h-10 w-full border border-dev-border bg-dev-bg pl-9 pr-3 text-sm text-white outline-none focus:border-dev-primary sm:w-72"
            />
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            disabled={!canManageUsers}
            className="inline-flex h-10 items-center justify-center gap-2 bg-dev-primary px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:border disabled:border-dev-border disabled:bg-dev-elevated disabled:text-dev-text-muted"
          >
            <MailPlus className="h-4 w-4" /> Invite Developer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {([
          { label: "Developers", value: developers.length, Icon: UserCog, detail: "Root and permission-bearing identities" },
          { label: "Officers", value: officers.length, Icon: ShieldCheck, detail: "Operational users and field workflows" },
          { label: "Public Users", value: publicUsers.length, Icon: Users, detail: "Citizen report submitters" },
          { label: "Active God Sessions", value: godSessions.filter((session) => !session.revoked_at && new Date(session.expires_at).getTime() > Date.now()).length, Icon: ShieldAlert, detail: "Short-lived privileged sessions" },
        ] as const).map(({ label, value, Icon, detail }) => (
          <div key={label} className="border border-dev-border bg-dev-surface p-4">
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 text-dev-primary" />
              <span className="font-mono text-2xl font-black text-white">{value}</span>
            </div>
            <div className="mt-3 text-xs font-bold uppercase tracking-wider text-dev-text">{label}</div>
            <div className="mt-1 text-xs text-dev-text-muted">{detail}</div>
          </div>
        ))}
      </div>

      {!isGodMode && (
        <div className="flex items-start gap-3 border border-dev-warning/30 bg-dev-warning/10 p-4 text-sm text-dev-warning">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-wider">Standard control session</p>
            <p className="mt-1 text-dev-warning/90">High-risk permission grants and developer invitations require active God Mode step-up.</p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={updateTab} className="w-full">
        <TabsList className="h-auto justify-start gap-1 overflow-x-auto border border-dev-border bg-dev-bg p-1">
          <TabsTrigger value="developers" className="data-[state=active]:bg-dev-elevated">Developers</TabsTrigger>
          <TabsTrigger value="officers">Officers</TabsTrigger>
          <TabsTrigger value="public">Public Users</TabsTrigger>
        </TabsList>
        <TabsContent value="developers" className="mt-4">
          {renderRoleTable(developers, "developer")}
        </TabsContent>
        <TabsContent value="officers" className="mt-4">
          {renderRoleTable(officers, "officer")}
        </TabsContent>
        <TabsContent value="public" className="mt-4">
          {renderRoleTable(publicUsers, "public")}
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" role="dialog" aria-modal="true" aria-label={`${selectedUser.email} detail`}>
          <button className="hidden flex-1 lg:block" aria-label="Close identity detail" onClick={() => setSelectedUserId(null)} />
          <aside className="h-full w-full overflow-y-auto border-l border-dev-border bg-dev-bg shadow-2xl lg:max-w-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-dev-border bg-dev-bg/95 p-5 backdrop-blur">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-dev-primary">{selectedUser.role} identity</p>
                <h2 className="mt-2 text-2xl font-black text-white">{selectedUser.name || "Unnamed identity"}</h2>
                <p className="mt-1 font-mono text-xs text-dev-text-muted">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUserId(null)} className="border border-dev-border p-2 text-dev-text-muted hover:border-dev-primary hover:text-white" aria-label="Close detail">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <section className="border border-dev-border bg-dev-surface p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white"><Users className="h-4 w-4 text-dev-primary" /> Identity</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ["Account status", statusFor(selectedUser, activeSessions.length)],
                    ["Auth provider", selectedAuth?.app_metadata?.provider || "email"],
                    ["Created", formatDate(selectedAuth?.created_at || selectedUser.created_at)],
                    ["Last login", formatDate(selectedAuth?.last_sign_in_at)],
                    ["Last active", formatDate(selectedUser.updated_at || selectedAuth?.last_sign_in_at || selectedUser.created_at)],
                    ["Email verification", selectedUser.email_verified || selectedAuth?.email_confirmed_at ? "Verified" : "Unverified"],
                    ["Session state", activeSessions.length ? `${activeSessions.length} privileged session active` : "No privileged session"],
                    ["Data source", selectedUser.is_demo ? "Seed/demo identity" : "Application database"],
                  ].map(([label, value]) => (
                    <div key={label} className="border border-dev-border bg-dev-bg p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-dev-text-muted">{label}</p>
                      <p className="mt-1 text-sm text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {selectedUser.role === "developer" && (
                <section className="border border-dev-border bg-dev-surface p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white"><KeyRound className="h-4 w-4 text-dev-primary" /> Authorization</h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="border border-dev-border bg-dev-bg p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-dev-text-muted">Root status</p>
                      <p className={identityById.get(selectedUser.id)?.is_root ? "mt-1 text-sm font-bold text-dev-critical" : "mt-1 text-sm text-white"}>
                        {identityById.get(selectedUser.id)?.is_root ? "Root enabled" : "Not root"}
                      </p>
                    </div>
                    <div className="border border-dev-border bg-dev-bg p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-dev-text-muted">God Mode eligibility</p>
                      <p className="mt-1 text-sm text-white">{identityById.get(selectedUser.id)?.is_root ? "Eligible" : "Not eligible"}</p>
                    </div>
                    <div className="border border-dev-border bg-dev-bg p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-dev-text-muted">Direct permissions</p>
                      <p className="mt-1 text-sm text-dev-text-muted">Unsupported by current schema</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <GrantList title="Active Grants" grants={activeGrants} profileById={profileById} onRevoke={canManageUsers ? handleRevoke : undefined} />
                    <GrantList title="Expiring Grants" grants={activeGrants.filter((grant) => grant.expires_at)} profileById={profileById} onRevoke={canManageUsers ? handleRevoke : undefined} />
                    <GrantList title="Revoked Grants" grants={[...revokedGrants, ...expiredGrants]} profileById={profileById} />
                  </div>

                  <div className="mt-5 border border-dev-border bg-dev-bg p-4">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-dev-text-muted">Effective Permissions</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {Object.entries(permissionGroups).map(([group, ids]) => (
                        <div key={group} className="border border-dev-border bg-dev-surface p-3">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white">{group}</p>
                          <div className="space-y-2">
                            {ids.map((id) => (
                              <div key={id} className="flex items-center justify-between gap-3 text-xs">
                                <span className={highRiskPermissions.has(id) ? "font-mono text-dev-warning" : "font-mono text-dev-text"}>{id}</span>
                                {effectivePermissions.has(id) ? <CheckCircle2 className="h-4 w-4 text-dev-success" /> : <Lock className="h-4 w-4 text-dev-text-muted" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleGrant} className="mt-5 border border-dev-border bg-dev-bg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white">Grant Permission Profile</h4>
                        <p className="mt-1 text-xs text-dev-text-muted">Server action validates role, risk, step-up, and audit logging.</p>
                      </div>
                      {selectedProfileHighRisk && <span className="border border-dev-critical/40 bg-dev-critical/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-dev-critical">High Risk</span>}
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <select value={grantProfileId} onChange={(event) => setGrantProfileId(event.target.value)} className="h-10 border border-dev-border bg-dev-surface px-3 text-sm text-white outline-none focus:border-dev-primary" disabled={!canManageUsers}>
                        <option value="">Choose profile</option>
                        {profiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>{profile.name}</option>
                        ))}
                      </select>
                      <input value={grantExpiresAt} onChange={(event) => setGrantExpiresAt(event.target.value)} type="datetime-local" className="h-10 border border-dev-border bg-dev-surface px-3 text-sm text-white outline-none focus:border-dev-primary" disabled={!canManageUsers} />
                      <input value={grantReason} onChange={(event) => setGrantReason(event.target.value)} placeholder="Audit reason" className="h-10 border border-dev-border bg-dev-surface px-3 text-sm text-white outline-none focus:border-dev-primary sm:col-span-2" disabled={!canManageUsers} />
                      {selectedProfileHighRisk && (
                        <input value={grantConfirmation} onChange={(event) => setGrantConfirmation(event.target.value)} placeholder='Type "GRANT HIGH RISK"' className="h-10 border border-dev-critical/40 bg-dev-critical/10 px-3 text-sm text-white outline-none focus:border-dev-critical sm:col-span-2" disabled={!canManageUsers} />
                      )}
                    </div>
                    {grantProfileId && (
                      <div className="mt-3 border border-dev-border bg-dev-surface p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-dev-text-muted">Profile impact</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedProfilePermissions.length ? selectedProfilePermissions.map((id) => (
                            <span key={id} className={`border px-2 py-1 font-mono text-[11px] ${highRiskPermissions.has(id) ? "border-dev-critical/40 bg-dev-critical/10 text-dev-critical" : "border-dev-border bg-dev-bg text-dev-text"}`}>
                              {id}
                            </span>
                          )) : <span className="text-xs text-dev-text-muted">No permissions mapped to this profile.</span>}
                        </div>
                      </div>
                    )}
                    <button disabled={!canManageUsers || !grantProfileId || !grantReason || pending || (selectedProfileHighRisk && grantConfirmation !== "GRANT HIGH RISK")} className="mt-4 inline-flex h-10 items-center justify-center gap-2 bg-dev-primary px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:border disabled:border-dev-border disabled:bg-dev-elevated disabled:text-dev-text-muted">
                      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                      Apply Grant
                    </button>
                  </form>
                </section>
              )}

              {selectedUser.role === "officer" && (
                <section className="border border-dev-border bg-dev-surface p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white"><ShieldCheck className="h-4 w-4 text-dev-secondary" /> Officer Profile</h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      ["Department", selectedOfficer?.department || "Unassigned"],
                      ["Designation", selectedOfficer?.designation || "Unavailable"],
                      ["Jurisdiction", selectedOfficer?.jurisdiction || "Unassigned"],
                      ["Badge ID", selectedOfficer?.badge_id || "Unavailable"],
                      ["Assigned reports", "Unavailable in current schema"],
                      ["Resolved reports", `${publicReports.filter((report) => report.status === "RESOLVED").length} system-wide`],
                      ["Advisories", `${advisories.filter((advisory) => advisory.created_by === selectedUser.id || advisory.published_by === selectedUser.id).length}`],
                    ].map(([label, value]) => (
                      <div key={label} className="border border-dev-border bg-dev-bg p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-dev-text-muted">{label}</p>
                        <p className="mt-1 text-sm text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedUser.role === "public" && (
                <section className="border border-dev-border bg-dev-surface p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white"><Users className="h-4 w-4 text-dev-text-muted" /> Public Profile</h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      ["Reports submitted", `${publicReports.filter((report) => report.reporter_id === selectedUser.id).length}`],
                      ["Open reports", `${publicReports.filter((report) => report.reporter_id === selectedUser.id && report.status !== "RESOLVED").length}`],
                      ["Account state", selectedUser.is_demo ? "Seed/demo identity" : "Registered"],
                      ["Email state", selectedUser.email_verified ? "Verified" : "Unverified"],
                    ].map(([label, value]) => (
                      <div key={label} className="border border-dev-border bg-dev-bg p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-dev-text-muted">{label}</p>
                        <p className="mt-1 text-sm text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="border border-dev-border bg-dev-surface p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white"><Activity className="h-4 w-4 text-dev-primary" /> Recent Activity</h3>
                <div className="mt-4 space-y-2">
                  {recentActivity.map((event) => (
                    <div key={event.id} className="border border-dev-border bg-dev-bg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs font-bold text-white">{event.event_type || event.action || "ACTIVITY"}</span>
                        <span className="font-mono text-[10px] text-dev-text-muted">{formatDate(event.timestamp || event.created_at)}</span>
                      </div>
                      <p className="mt-2 text-xs text-dev-text-muted">{event.entity_type || event.entity_id || event.details?.reason || "Security or audit event"}</p>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <div className="border border-dev-border bg-dev-bg p-6 text-center text-sm text-dev-text-muted">
                      No recent activity found for this identity.
                    </div>
                  )}
                </div>
              </section>

              <section className="border border-dev-border bg-dev-surface p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white"><SlidersHorizontal className="h-4 w-4 text-dev-primary" /> Actions</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <UnavailableAction label="Edit profile" />
                  <UnavailableAction label="Add individual permission" />
                  <UnavailableAction label="Suspend/deactivate" />
                  <UnavailableAction label="View sessions" disabled={selectedUser.role !== "developer"} />
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Invite developer">
          <div className="w-full max-w-md border border-dev-border bg-dev-surface">
            <div className="flex items-center justify-between border-b border-dev-border p-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white"><MailPlus className="h-5 w-5 text-dev-primary" /> Invite Developer</h2>
              <button onClick={() => setInviteOpen(false)} className="text-dev-text-muted hover:text-white" aria-label="Close invite dialog"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4 p-5">
              <div className="border border-dev-warning/30 bg-dev-warning/10 p-3 text-xs text-dev-warning">
                Developer invitations require God Mode step-up and are recorded as security events.
              </div>
              <input type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="developer@example.com" className="h-11 w-full border border-dev-border bg-dev-bg px-3 text-sm text-white outline-none focus:border-dev-primary" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setInviteOpen(false)} className="px-4 py-2 text-sm text-dev-text-muted hover:text-white">Cancel</button>
                <button disabled={pending || !inviteEmail || !isGodMode} className="inline-flex items-center gap-2 bg-dev-primary px-4 py-2 text-sm font-semibold text-white disabled:border disabled:border-dev-border disabled:bg-dev-elevated disabled:text-dev-text-muted">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GrantList({
  title,
  grants,
  profileById,
  onRevoke,
}: {
  title: string;
  grants: Grant[];
  profileById: Map<string, Profile>;
  onRevoke?: (grant: Grant) => void;
}) {
  return (
    <div className="border border-dev-border bg-dev-bg p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-dev-text-muted">{title}</p>
      <div className="mt-3 space-y-2">
        {grants.map((grant) => (
          <div key={grant.id} className="border border-dev-border bg-dev-surface p-3">
            <p className="text-sm font-semibold text-white">{profileById.get(grant.profile_id)?.name || "Unknown profile"}</p>
            <p className="mt-1 text-[11px] text-dev-text-muted">
              <CalendarClock className="mr-1 inline h-3 w-3" />
              {grant.expires_at ? `Expires ${formatDate(grant.expires_at)}` : `Granted ${formatDate(grant.granted_at)}`}
            </p>
            <p className="mt-1 text-[11px] text-dev-text-muted">{grant.revoked_at ? `Revoked ${formatDate(grant.revoked_at)}` : grant.reason}</p>
            {onRevoke && !grant.revoked_at && isGrantActive(grant) && (
              <button onClick={() => onRevoke(grant)} className="mt-3 inline-flex items-center gap-1.5 border border-dev-critical/30 bg-dev-critical/10 px-2 py-1 text-[11px] font-semibold text-dev-critical hover:bg-dev-critical/20">
                <ShieldAlert className="h-3.5 w-3.5" /> Revoke
              </button>
            )}
          </div>
        ))}
        {grants.length === 0 && <p className="py-4 text-center text-xs text-dev-text-muted">None</p>}
      </div>
    </div>
  );
}

function UnavailableAction({ label, disabled = false }: { label: string; disabled?: boolean }) {
  return (
    <button disabled className="flex items-center justify-between border border-dev-border bg-dev-bg p-3 text-left text-sm text-dev-text-muted" title={disabled ? "Not applicable to this identity type" : "Unavailable because the current database schema has no supported mutation"}>
      <span>{label}</span>
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-dev-warning"><Clock className="h-3 w-3" /> Unavailable</span>
    </button>
  );
}
