"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getActiveGodModeSession } from "@/utils/auth/godMode";
import { isRoot } from "@/utils/auth/permissions";
import { logAudit, logSecurityEvent } from "@/utils/auth/audit";

function getAdminClient() {
  const { createClient: createSupabaseAdmin } = require("@supabase/supabase-js");
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireRootControl() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  if (!(await isRoot(user.id))) throw new Error("Forbidden: Root capability required");

  const session = await getActiveGodModeSession();
  if (!session) throw new Error("Step-up authentication required");

  return { user, session };
}

export async function updateFeatureFlag(input: {
  flagId: string;
  value: boolean;
  confirmation: string;
  reason: string;
}) {
  const { user } = await requireRootControl();

  if (!input.flagId) throw new Error("Feature flag id is required");
  if (input.confirmation !== "APPLY ROOT CHANGE") throw new Error("Typed confirmation mismatch");
  if (!input.reason || input.reason.trim().length < 6) throw new Error("A meaningful audit reason is required");

  const adminClient = getAdminClient();
  const { data: before } = await adminClient
    .from("feature_flags")
    .select("*")
    .eq("id", input.flagId)
    .single();

  const { data: after, error } = await adminClient
    .from("feature_flags")
    .update({
      value: { enabled: input.value },
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", input.flagId)
    .select("*")
    .single();

  if (error) throw new Error(error.message || "Failed to update feature flag");

  await logSecurityEvent({
    actor_id: user.id,
    event_type: "FEATURE_FLAG_UPDATED",
    details: { flag_id: input.flagId, value: input.value, reason: input.reason },
    ip_address: "server-action",
  });

  await logAudit({
    actor_id: user.id,
    actor_role: "developer",
    action: "FEATURE_FLAG_UPDATED",
    resource: "FEATURE_FLAG",
    resource_id: input.flagId,
    details: { reason: input.reason },
    before_state: before,
    after_state: after,
  });

  revalidatePath("/dev-dashboard/god-mode");
  revalidatePath("/dev-dashboard");
  return { success: true, message: `${input.flagId} updated` };
}

export async function revokePrivilegedSession(input: {
  sessionId: string;
  reason: string;
}) {
  const { user, session } = await requireRootControl();
  if (!input.sessionId) throw new Error("Session id is required");
  if (!input.reason || input.reason.trim().length < 6) throw new Error("A meaningful audit reason is required");

  const adminClient = getAdminClient();
  const { data: before } = await adminClient
    .from("god_mode_sessions")
    .select("*")
    .eq("id", input.sessionId)
    .single();

  if (!before || before.revoked_at) throw new Error("Active privileged session not found");

  const revokedAt = new Date().toISOString();
  const { data: after, error } = await adminClient
    .from("god_mode_sessions")
    .update({ revoked_at: revokedAt })
    .eq("id", input.sessionId)
    .is("revoked_at", null)
    .select("*")
    .single();

  if (error) throw new Error(error.message || "Failed to revoke privileged session");

  await logSecurityEvent({
    actor_id: user.id,
    event_type: input.sessionId === session.id ? "GOD_MODE_SELF_REVOKED" : "GOD_MODE_SESSION_REVOKED",
    details: { session_id: input.sessionId, reason: input.reason },
    ip_address: "server-action",
  });

  await logAudit({
    actor_id: user.id,
    actor_role: "developer",
    action: "GOD_MODE_SESSION_REVOKED",
    resource: "GOD_MODE_SESSION",
    resource_id: input.sessionId,
    details: { reason: input.reason },
    before_state: before,
    after_state: after,
  });

  if (input.sessionId === session.id) {
    const cookieStore = await cookies();
    cookieStore.set("GodMode-Token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  }

  revalidatePath("/dev-dashboard/god-mode");
  return { success: true, message: "Privileged session revoked" };
}
