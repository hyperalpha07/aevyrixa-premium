import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { listStaff, logStaffActivity } from "@/app/lib/admin-staff";
import {
  attachSupportLabel,
  createSupportLabel,
  getConversationById,
  getAdminSupportMessages,
  getSupportConversationLabels,
  listSupportLabels,
  markCustomerMessagesRead,
  markCustomerMessagesUnread,
  removeSupportLabel,
  updateConversationAssignment,
  updateConversationStatus,
  type ConversationStatus,
} from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
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

    const [messages, labels, availableLabels, staff] = await Promise.all([
      getAdminSupportMessages(id),
      getSupportConversationLabels(id),
      listSupportLabels(),
      listStaff().catch(() => []),
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
      labels,
      availableLabels,
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
  const session = await verifyFreshAdminRequestPermission(request, "support.close");
  if (!session) return forbiddenAdminResponse();

  const { id } = await params;

  let status: ConversationStatus | null = null;
  let action = "";
  let staffId: string | null = null;
  let staffName: string | null = null;
  let labelId = "";
  let labelName = "";
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
      if (!labelId) return json({ error: "Label is required." }, { status: 400 });
      await attachSupportLabel(id, labelId);
      await logStaffActivity({ actor: session, action: "support.label_attached", targetType: "conversation", targetId: id, metadata: { labelId } });
      return json({ ok: true, action });
    }
    if (action === "remove_label") {
      if (!labelId) return json({ error: "Label is required." }, { status: 400 });
      await removeSupportLabel(id, labelId);
      await logStaffActivity({ actor: session, action: "support.label_removed", targetType: "conversation", targetId: id, metadata: { labelId } });
      return json({ ok: true, action });
    }
    if (action === "create_label") {
      const label = await createSupportLabel(labelName);
      await attachSupportLabel(id, label.id);
      await logStaffActivity({ actor: session, action: "support.label_created", targetType: "conversation", targetId: id, metadata: { labelId: label.id, labelName: label.name } });
      return json({ ok: true, action, label });
    }
    if (!status) return json({ error: "Invalid status. Use open, pending, or closed." }, { status: 400 });
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
