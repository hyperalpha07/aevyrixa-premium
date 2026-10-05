import { forbiddenAdminResponse, getFreshAdminRequestSession, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { listStaff, logStaffActivity } from "@/app/lib/admin-staff";
import {
  attachSupportLabel,
  clearSupportEscalation,
  createSupportLabel,
  deleteSupportLabel,
  escalateSupportConversation,
  getConversationById,
  getAdminSupportMessages,
  getSupportConversationLabels,
  getSupportInternalNotes,
  listSupportLabels,
  markCustomerMessagesRead,
  markCustomerMessagesUnread,
  removeSupportLabel,
  updateConversationPriority,
  updateConversationAssignment,
  updateConversationStatus,
  updateSupportLabel,
  type ConversationStatus,
  type SupportPriority,
} from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

function normalizeLabelName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

function duplicateLabelExists(labels: Array<{ id: string; name: string }>, name: string, exceptId = "") {
  const normalized = name.toLocaleLowerCase();
  return labels.some(label => label.id !== exceptId && label.name.trim().toLocaleLowerCase() === normalized);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyFreshAdminRequestPermission(request, "support.view"))) return forbiddenAdminResponse();

  const { id } = await params;
  const url = new URL(request.url);
  const shouldMarkRead = url.searchParams.get("markRead") === "1";

  try {
    const conversation = await getConversationById(id);
    if (!conversation) return json({ error: "Conversation not found." }, { status: 404 });

    const [messages, labels, availableLabels, staff, internalNotes] = await Promise.all([
      getAdminSupportMessages(id),
      getSupportConversationLabels(id),
      listSupportLabels(),
      listStaff().catch(() => []),
      getSupportInternalNotes(id),
    ]);
    if (shouldMarkRead) {
      await markCustomerMessagesRead(id);
    }

    return json({
      id: conversation.id,
      status: conversation.status,
      source_page: conversation.source_page,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      assigned_staff_id: conversation.assigned_staff_id ?? null,
      assigned_staff_name: conversation.assigned_staff_name ?? null,
      priority: conversation.priority ?? "normal",
      sla_started_at: conversation.sla_started_at ?? null,
      escalated_at: conversation.escalated_at ?? null,
      escalated_by: conversation.escalated_by ?? null,
      escalation_reason: conversation.escalation_reason ?? null,
      labels,
      availableLabels,
      internalNotes,
      staff: staff.filter(member => member.isActive).map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
      })),
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        sender_type: m.sender_type,
        created_at: m.created_at,
        attachments: m.attachments ?? [],
        product_shares: m.product_shares ?? [],
        order_shares: m.order_shares ?? [],
      })),
    });
  } catch (error) {
    console.error("Failed to load admin conversation:", error);
    return json({ error: "Could not load conversation." }, { status: 503 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return forbiddenAdminResponse();

  const { id } = await params;

  let status: ConversationStatus | null = null;
  let action = "";
  let staffId: string | null = null;
  let staffName: string | null = null;
  let labelId = "";
  let labelName = "";
  let labelColor: string | null = null;
  let priority: SupportPriority | null = null;
  let reason = "";
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "mark_unread") {
      action = "mark_unread";
    } else if (body.action === "assign") {
      action = "assign";
      staffId = typeof body.staffId === "string" && body.staffId.trim() ? body.staffId.trim() : null;
      staffName = typeof body.staffName === "string" && body.staffName.trim() ? body.staffName.trim().slice(0, 120) : null;
    } else if (body.action === "attach_label" || body.action === "remove_label" || body.action === "create_label") {
      action = body.action;
      labelId = typeof body.labelId === "string" ? body.labelId : "";
      labelName = typeof body.labelName === "string" ? body.labelName : "";
      labelColor = typeof body.color === "string" ? body.color : null;
    } else if (body.action === "update_label" || body.action === "delete_label") {
      action = body.action;
      labelId = typeof body.labelId === "string" ? body.labelId : "";
      labelName = typeof body.labelName === "string" ? body.labelName : "";
      labelColor = typeof body.color === "string" ? body.color : null;
    } else if (body.action === "priority") {
      action = "priority";
      const rawPriority = body.priority;
      if (rawPriority !== "low" && rawPriority !== "normal" && rawPriority !== "high" && rawPriority !== "urgent") {
        return json({ error: "Invalid priority." }, { status: 400 });
      }
      priority = rawPriority;
    } else if (body.action === "escalate") {
      action = "escalate";
      reason = typeof body.reason === "string" ? body.reason.trim() : "";
      staffId = typeof body.staffId === "string" && body.staffId.trim() ? body.staffId.trim() : null;
    } else if (body.action === "clear_escalation") {
      action = "clear_escalation";
    } else {
    const s = body.status;
    if (s !== "open" && s !== "pending" && s !== "closed") {
      return json({ error: "Invalid status. Use open, pending, or closed." }, { status: 400 });
    }
    status = s;
    }
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    if (!(await getConversationById(id))) return json({ error: "Conversation not found." }, { status: 404 });
    if (action === "mark_unread") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      await markCustomerMessagesUnread(id);
      await logStaffActivity({
        actor: session,
        action: "support.marked_unread",
        targetType: "conversation",
        targetId: id,
      });
      return json({ ok: true, action });
    }
    if (action === "assign") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      if (staffId) {
        const activeStaff = await listStaff().catch(() => []);
        const member = activeStaff.find(item => item.isActive && item.id === staffId);
        if (!member) return json({ error: "Staff member is not available." }, { status: 400 });
        staffName = member.name;
      }
      await updateConversationAssignment(id, { staffId, staffName });
      await logStaffActivity({
        actor: session,
        action: "support.assigned",
        targetType: "conversation",
        targetId: id,
        metadata: { assignedStaffId: staffId, assignedStaffName: staffName },
      });
      return json({ ok: true, action, assigned_staff_id: staffId, assigned_staff_name: staffName });
    }
    if (action === "attach_label") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      if (!labelId) return json({ error: "Label is required." }, { status: 400 });
      await attachSupportLabel(id, labelId);
      await logStaffActivity({ actor: session, action: "support.label_attached", targetType: "conversation", targetId: id, metadata: { labelId } });
      return json({ ok: true, action });
    }
    if (action === "remove_label") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      if (!labelId) return json({ error: "Label is required." }, { status: 400 });
      await removeSupportLabel(id, labelId);
      await logStaffActivity({ actor: session, action: "support.label_removed", targetType: "conversation", targetId: id, metadata: { labelId } });
      return json({ ok: true, action });
    }
    if (action === "create_label") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      if (labelColor && !/^#[0-9a-f]{6}$/i.test(labelColor)) return json({ error: "Invalid label color." }, { status: 400 });
      const cleanLabelName = normalizeLabelName(labelName);
      if (!cleanLabelName) return json({ error: "Label name is required." }, { status: 400 });
      if (duplicateLabelExists(await listSupportLabels(), cleanLabelName)) return json({ error: "A label with this name already exists." }, { status: 409 });
      const label = await createSupportLabel(cleanLabelName, labelColor);
      await attachSupportLabel(id, label.id);
      await logStaffActivity({ actor: session, action: "support.label_created", targetType: "conversation", targetId: id, metadata: { labelId: label.id, labelName: label.name } });
      return json({ ok: true, action, label });
    }
    if (action === "update_label") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      if (!labelId) return json({ error: "Label is required." }, { status: 400 });
      if (labelColor && !/^#[0-9a-f]{6}$/i.test(labelColor)) return json({ error: "Invalid label color." }, { status: 400 });
      const cleanLabelName = normalizeLabelName(labelName);
      if (!cleanLabelName) return json({ error: "Label name is required." }, { status: 400 });
      if (duplicateLabelExists(await listSupportLabels(), cleanLabelName, labelId)) return json({ error: "A label with this name already exists." }, { status: 409 });
      const label = await updateSupportLabel(labelId, { name: cleanLabelName, color: labelColor });
      await logStaffActivity({ actor: session, action: "support.label_updated", targetType: "support_label", targetId: label.id, metadata: { labelId: label.id } });
      return json({ ok: true, action, label });
    }
    if (action === "delete_label") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      if (!labelId) return json({ error: "Label is required." }, { status: 400 });
      await deleteSupportLabel(labelId);
      await logStaffActivity({ actor: session, action: "support.label_deleted", targetType: "support_label", targetId: labelId, metadata: { labelId } });
      return json({ ok: true, action });
    }
    if (action === "priority") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      if (!priority) return json({ error: "Invalid priority." }, { status: 400 });
      await updateConversationPriority(id, priority);
      await logStaffActivity({ actor: session, action: "support.priority_updated", targetType: "conversation", targetId: id, metadata: { priority } });
      return json({ ok: true, action, priority });
    }
    if (action === "escalate") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      if (!reason || reason.length > 1000) return json({ error: "Escalation reason is required." }, { status: 400 });
      let staffName: string | null = null;
      if (staffId) {
        const activeStaff = await listStaff().catch(() => []);
        const member = activeStaff.find(item => item.isActive && item.id === staffId);
        if (!member) return json({ error: "Staff member is not available." }, { status: 400 });
        staffName = member.name;
      }
      await escalateSupportConversation(id, { actorName: session.displayName || session.username, reason, staffId, staffName });
      await logStaffActivity({ actor: session, action: "support.escalated", targetType: "conversation", targetId: id, metadata: { assignedStaffId: staffId, reasonLength: reason.length } });
      return json({ ok: true, action });
    }
    if (action === "clear_escalation") {
      if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
      await clearSupportEscalation(id);
      await logStaffActivity({ actor: session, action: "support.escalation_cleared", targetType: "conversation", targetId: id });
      return json({ ok: true, action });
    }
    if (!status) return json({ error: "Invalid status. Use open, pending, or closed." }, { status: 400 });
    if (!hasPermission(session, "support.close")) return forbiddenAdminResponse();
    await updateConversationStatus(id, status);
    await logStaffActivity({
      actor: session,
      action: "support.status_updated",
      targetType: "conversation",
      targetId: id,
      metadata: { status },
    });
    return json({ ok: true, status });
  } catch (error) {
    console.error("Failed to update conversation status:", error);
    return json({ error: "Could not update status." }, { status: 503 });
  }
}
