"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Activity, RefreshCw, ShieldCheck, UserCheck, UserPlus } from "lucide-react";
import {
  adminPermissionKeys,
  permissionGroups,
  permissionLabels,
  roleDefaultPermissions,
  roleLabels,
  type AdminPermission,
  type AdminRole,
} from "@/app/lib/admin-permissions";
import type { AdminStaffRecord, StaffActivityLog } from "@/app/lib/admin-staff";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2SearchField } from "@/components/admin-v2/shared/V2SearchField";
import { parseStaffRoleFilter, parseStaffStatusFilter, queryStaff, safeActivitySummary, staffListHref, staffMetrics, type StaffRoleFilter, type StaffStatusFilter } from "@/lib/admin-v2/staff/staff-query";

type Props = {
  initialQuery: string;
  initialRole: StaffRoleFilter;
  initialStatus: StaffStatusFilter;
  permissions: { canManageStaff: boolean; canViewActivity: boolean };
};

type StaffPayload = {
  staff: AdminStaffRecord[];
  activityLogs: StaffActivityLog[];
  errors?: string[];
};

type InviteRecord = {
  id: string;
  email: string;
  role_key: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

const editableRoles: Array<Exclude<AdminRole, "owner">> = ["manager", "order_staff", "product_staff", "support_staff", "viewer"];
const roleFilters: Array<[StaffRoleFilter, string]> = [["all", "All Roles"], ...editableRoles.map(role => [role, roleLabels[role]] as [StaffRoleFilter, string])];
const statusFilters: Array<[StaffStatusFilter, string]> = [["all", "All"], ["active", "Active"], ["inactive", "Inactive"]];

function emptyPermissions(role: AdminRole) {
  const defaults = new Set(roleDefaultPermissions[role]);
  return adminPermissionKeys.reduce((map, key) => {
    map[key] = role === "owner" || defaults.has(key);
    return map;
  }, {} as Record<AdminPermission, boolean>);
}

function permissionCount(permissions: Record<AdminPermission, boolean>) {
  return adminPermissionKeys.filter(key => permissions[key]).length;
}

function dateLabel(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function initials(name: string, username: string) {
  return (name || username || "ST").replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "ST";
}

type Draft = {
  id?: string;
  name: string;
  username: string;
  email: string;
  password: string;
  role: Exclude<AdminRole, "owner">;
  isActive: boolean;
  permissions: Record<AdminPermission, boolean>;
};

function draftFromStaff(member?: AdminStaffRecord): Draft {
  const role = member?.role && member.role !== "owner" ? member.role : "viewer";
  return {
    id: member?.id,
    name: member?.name ?? "",
    username: member?.username ?? "",
    email: member?.email ?? "",
    password: "",
    role,
    isActive: member?.isActive ?? true,
    permissions: member?.permissions ?? emptyPermissions(role),
  };
}

async function readStaff(): Promise<StaffPayload> {
  const response = await fetch("/api/admin/staff", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error((data.errors ?? ["Staff data unavailable."]).join(" "));
  return data;
}

export function AdminV2StaffView({ initialQuery, initialRole, initialStatus, permissions }: Props) {
  const router = useRouter();
  const [staff, setStaff] = useState<AdminStaffRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<StaffActivityLog[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [tab, setTab] = useState<"staff" | "activity">(permissions.canManageStaff ? "staff" : "activity");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [invites, setInvites] = useState<InviteRecord[]>([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await readStaff();
      setStaff(data.staff ?? []);
      setActivityLogs(data.activityLogs ?? []);
      setSelectedId(current => current || data.staff?.[0]?.id || "");
      if (permissions.canManageStaff) {
        const inviteResponse = await fetch("/api/admin/staff/invites", { cache: "no-store" });
        if (inviteResponse.ok) {
          const inviteData = await inviteResponse.json();
          setInvites(inviteData.invites ?? []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Staff data unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const metrics = staffMetrics(staff);
  const filtered = useMemo(() => queryStaff(staff, query, role, status), [staff, query, role, status]);
  const selected = staff.find(member => member.id === selectedId) ?? filtered[0] ?? staff[0];

  useEffect(() => {
    if (selected && (!selectedId || !staff.some(member => member.id === selectedId))) setSelectedId(selected.id);
  }, [selected, selectedId, staff]);

  function applyFilter(nextQuery = query, nextRole = role, nextStatus = status) {
    setQuery(nextQuery);
    setRole(nextRole);
    setStatus(nextStatus);
    router.replace(staffListHref(nextQuery, nextRole, nextStatus), { scroll: false });
  }

  function openCreate() {
    setDraft(draftFromStaff());
    setCreateOpen(true);
  }

  function openEdit(member: AdminStaffRecord) {
    setDraft(draftFromStaff(member));
    setCreateOpen(true);
  }

  function updateDraft(next: Partial<Draft>) {
    setDraft(current => current ? { ...current, ...next } : current);
  }

  function changeRole(nextRole: Exclude<AdminRole, "owner">) {
    updateDraft({ role: nextRole, permissions: emptyPermissions(nextRole) });
  }

  async function saveDraft() {
    if (!draft) return;
    const creating = !draft.id;
    if (creating && draft.password.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }
    if (draft.password && draft.password.length < 8) {
      setError("Reset password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(creating ? "/api/admin/staff" : `/api/admin/staff/${encodeURIComponent(draft.id!)}`, {
        method: creating ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          username: draft.username,
          email: draft.email,
          role: draft.role,
          isActive: draft.isActive,
          permissions: draft.permissions,
          ...(draft.password ? { password: draft.password } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error((data.errors ?? ["Could not save staff member."]).join(" "));
      setNotice(creating ? "Staff member created." : "Staff member updated.");
      setCreateOpen(false);
      await load();
      if (data.staff?.id) setSelectedId(data.staff.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save staff member.");
    } finally {
      setSaving(false);
    }
  }

  async function createInviteLink() {
    const email = window.prompt("Email for the invite link");
    if (!email) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/staff/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, roleKey: "viewer", permissionOverrides: {} }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error((data.errors ?? ["Could not create invite link."]).join(" "));
      await navigator.clipboard?.writeText(data.inviteLink ?? "");
      setNotice("Invite link created and copied. No email was sent.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite link.");
    } finally {
      setSaving(false);
    }
  }

  async function revokeInvite(id: string) {
    if (!window.confirm("Revoke this invite link?")) return;
    const response = await fetch(`/api/admin/staff/invites/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError((data.errors ?? ["Could not revoke invite."]).join(" "));
      return;
    }
    setNotice("Invite revoked.");
    await load();
  }

  return <>
    <V2PageHeader
      title="Staff"
      description="Manage team access, roles and account security."
      actions={permissions.canManageStaff ? <Stack direction="row" sx={{ gap: 1 }}>
        <V2Button variant="outlined" startIcon={<UserPlus size={16} />} onClick={createInviteLink}>Create Invite Link</V2Button>
        <V2Button variant="contained" startIcon={<UserPlus size={16} />} onClick={openCreate}>Add Staff</V2Button>
      </Stack> : undefined}
    />

    {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
    {notice ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert> : null}

    <V2Card sx={{ mb: 2 }}>
      <Stack direction="row" sx={{ gap: 0, flexWrap: "nowrap" }}>
        {([["Total Staff", metrics.total], ["Active", metrics.active], ["Inactive", metrics.inactive], ["Managers", metrics.managers]] as Array<[string, number]>).map(([label, value], index) => (
          <Box key={label} sx={{ flex: 1, minWidth: 0, px: index ? 2.5 : 0, borderLeft: index ? 1 : 0, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 800 }}>{label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 950 }}>{value}</Typography>
          </Box>
        ))}
      </Stack>
    </V2Card>

    <V2Card>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
        <Stack direction="row" sx={{ gap: 0.75 }}>
          {permissions.canManageStaff ? <V2Button size="small" variant={tab === "staff" ? "contained" : "outlined"} startIcon={<UserCheck size={15} />} onClick={() => setTab("staff")}>Staff</V2Button> : null}
          {permissions.canViewActivity ? <V2Button size="small" variant={tab === "activity" ? "contained" : "outlined"} startIcon={<Activity size={15} />} onClick={() => setTab("activity")}>Activity</V2Button> : null}
        </Stack>
        <V2Button variant="outlined" startIcon={<RefreshCw size={15} />} disabled={loading} onClick={() => { void load(); }}>Refresh</V2Button>
      </Stack>

      {tab === "staff" ? <>
        <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
          <Box component="form" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); applyFilter(String(form.get("q") ?? "").slice(0, 140)); }} sx={{ display: "flex", gap: 1 }}>
            <V2SearchField name="q" defaultValue={query} placeholder="Search name, username, or email" slotProps={{ htmlInput: { "aria-label": "Search staff" } }} sx={{ minWidth: 330 }} />
            <V2Button type="submit" variant="contained">Search</V2Button>
          </Box>
          <TextField select size="small" value={role} onChange={event => applyFilter(query, parseStaffRoleFilter(event.target.value), status)} sx={{ minWidth: 160 }}>
            {roleFilters.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField select size="small" value={status} onChange={event => applyFilter(query, role, parseStaffStatusFilter(event.target.value))} sx={{ minWidth: 130 }}>
            {statusFilters.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>{filtered.length} matching staff</Typography>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 24rem", gap: 2, alignItems: "stretch" }}>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "minmax(15rem, 1.5fr) 8.5rem 7.5rem 6rem 8rem 8rem", gap: 1, px: 1.5, py: 1, bgcolor: "rgba(124,77,255,0.045)" }}>
              {["Staff", "Role", "Access", "Status", "Last Login", "Created"].map(label => <Typography key={label} variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: "uppercase" }}>{label}</Typography>)}
            </Box>
            {filtered.map(member => <Box key={member.id} onClick={() => setSelectedId(member.id)}
              sx={{ display: "grid", gridTemplateColumns: "minmax(15rem, 1.5fr) 8.5rem 7.5rem 6rem 8rem 8rem", gap: 1, px: 1.5, py: 1.25, alignItems: "center", borderTop: 1, borderColor: "divider", cursor: "pointer", bgcolor: selected?.id === member.id ? "rgba(124,77,255,0.06)" : "transparent", "&:hover": { bgcolor: "rgba(124,77,255,0.045)" } }}>
              <Stack direction="row" sx={{ alignItems: "center", gap: 1.1, minWidth: 0 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, bgcolor: "rgba(124,77,255,0.11)", color: "primary.main", fontWeight: 950 }}>{initials(member.name, member.username)}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{member.username} · {member.email || "No email"}</Typography>
                </Box>
              </Stack>
              <Chip size="small" label={roleLabels[member.role]} sx={{ fontWeight: 850 }} />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{permissionCount(member.permissions)} permissions</Typography>
              <Chip size="small" color={member.isActive ? "success" : "default"} label={member.isActive ? "Active" : "Inactive"} />
              <Typography variant="caption" color="text.secondary">{dateLabel(member.lastLoginAt)}</Typography>
              <Typography variant="caption" color="text.secondary">{dateLabel(member.createdAt)}</Typography>
            </Box>)}
            {!filtered.length ? <Box sx={{ py: 7, textAlign: "center" }}><Typography variant="h6">No staff found</Typography><Typography color="text.secondary">Try another search, role, or status.</Typography></Box> : null}
          </Box>

          <StaffDetails member={selected} canManage={permissions.canManageStaff} onEdit={selected ? () => openEdit(selected) : undefined} onNotice={setNotice} onError={setError} />
        </Box>

        {permissions.canManageStaff ? <V2Card sx={{ mt: 2 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>Invite Links</Typography>
            <V2Button size="small" variant="outlined" onClick={createInviteLink}>Create Invite Link</V2Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Links are generated once. No email is sent by this workspace.</Typography>
          <Stack sx={{ gap: 1 }}>
            {invites.map(invite => <Stack key={invite.id} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 850 }}>{invite.email}</Typography>
                <Typography variant="caption" color="text.secondary">{invite.role_key} · expires {dateLabel(invite.expires_at)}</Typography>
              </Box>
              <Stack direction="row" sx={{ gap: 0.75 }}>
                <Chip size="small" label={invite.accepted_at ? "Accepted" : invite.revoked_at ? "Revoked" : "Open"} color={invite.accepted_at ? "success" : invite.revoked_at ? "default" : "warning"} />
                {!invite.accepted_at && !invite.revoked_at ? <V2Button size="small" variant="outlined" onClick={() => revokeInvite(invite.id)}>Revoke Invite</V2Button> : null}
              </Stack>
            </Stack>)}
            {!invites.length ? <Typography variant="body2" color="text.secondary">No active invite links.</Typography> : null}
          </Stack>
        </V2Card> : null}
      </> : <ActivityLog logs={activityLogs} />}
    </V2Card>

    <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>{draft?.id ? "Edit Staff" : "Add Staff"}</DialogTitle>
      {draft ? <DialogContent dividers>
        <Stack sx={{ gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
            <TextField label="Name" value={draft.name} onChange={event => updateDraft({ name: event.target.value })} />
            <TextField label="Username" value={draft.username} onChange={event => updateDraft({ username: event.target.value })} />
            <TextField label="Email" value={draft.email} onChange={event => updateDraft({ email: event.target.value })} />
            <TextField label={draft.id ? "New temporary password (optional)" : "Temporary password"} type="password" value={draft.password} onChange={event => updateDraft({ password: event.target.value })} helperText={draft.id ? "Leave blank to keep existing password." : "Required; minimum 8 characters."} />
            <TextField select label="Role" value={draft.role} onChange={event => changeRole(event.target.value as Exclude<AdminRole, "owner">)}>
              {editableRoles.map(value => <MenuItem key={value} value={value}>{roleLabels[value]}</MenuItem>)}
            </TextField>
            <FormControlLabel control={<Switch checked={draft.isActive} onChange={event => updateDraft({ isActive: event.target.checked })} />} label={draft.isActive ? "Active account" : "Inactive account"} />
          </Box>
          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Permissions</Typography>
          <PermissionEditor permissions={draft.permissions} onChange={(key, value) => updateDraft({ permissions: { ...draft.permissions, [key]: value } })} />
        </Stack>
      </DialogContent> : null}
      <DialogActions>
        <V2Button variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</V2Button>
        <V2Button variant="contained" loading={saving} onClick={saveDraft}>{draft?.id ? "Save changes" : "Create staff"}</V2Button>
      </DialogActions>
    </Dialog>
  </>;
}

function StaffDetails({ member, canManage, onEdit, onNotice, onError }: { member?: AdminStaffRecord; canManage: boolean; onEdit?: () => void; onNotice: (message: string) => void; onError: (message: string) => void }) {
  const [sessions, setSessions] = useState<Array<{ id: string; created_at: string; last_seen_at: string; expires_at: string; revoked_at: string | null }>>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  useEffect(() => {
    if (!member || !canManage) return;
    fetch(`/api/admin/staff/${encodeURIComponent(member.id)}/sessions`, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => setSessions(data?.sessions ?? []))
      .catch(() => setSessions([]));
  }, [member, canManage]);
  if (!member) return <V2Card><Typography variant="subtitle2">Select a staff member</Typography></V2Card>;
  async function createResetLink() {
    if (!member) return;
    setSecurityLoading(true);
    try {
      const response = await fetch(`/api/admin/staff/${encodeURIComponent(member.id)}/reset-link`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error((data.errors ?? ["Could not create reset link."]).join(" "));
      await navigator.clipboard?.writeText(data.resetLink ?? "");
      onNotice("Reset link created and copied. No email was sent.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not create reset link.");
    } finally {
      setSecurityLoading(false);
    }
  }
  async function revokeSession(sessionId?: string) {
    if (!member) return;
    if (!window.confirm(sessionId ? "Revoke this session?" : "Revoke all sessions for this staff member?")) return;
    const suffix = sessionId ? `?session=${encodeURIComponent(sessionId)}` : "";
    const response = await fetch(`/api/admin/staff/${encodeURIComponent(member.id)}/sessions${suffix}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      onError((data.errors ?? ["Could not revoke session."]).join(" "));
      return;
    }
    onNotice(sessionId ? "Session revoked." : "All sessions revoked.");
    setSessions(current => sessionId ? current.map(item => item.id === sessionId ? { ...item, revoked_at: new Date().toISOString() } : item) : []);
  }
  async function resetMfa() {
    if (!member || !window.confirm("Disable MFA for this staff member?")) return;
    const response = await fetch(`/api/admin/staff/${encodeURIComponent(member.id)}/mfa`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      onError((data.errors ?? ["Could not reset MFA."]).join(" "));
      return;
    }
    onNotice("MFA disabled for this staff member.");
  }
  return <Box sx={{ border: 1, borderColor: "divider", borderRadius: 3, p: 2, minWidth: 0 }}>
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
      <Box>
        <Typography variant="overline" color="text.secondary">Profile</Typography>
        <Typography variant="h6" sx={{ fontWeight: 950 }}>{member.name}</Typography>
        <Typography variant="body2" color="text.secondary">@{member.username} · {member.email || "No email"}</Typography>
      </Box>
      {canManage ? <V2Button size="small" variant="outlined" onClick={onEdit}>View/Edit</V2Button> : null}
    </Stack>
    <Divider sx={{ my: 1.6 }} />
    <Stack sx={{ gap: 0.75 }}>
      <DetailLine label="Role" value={roleLabels[member.role]} />
      <DetailLine label="Status" value={member.isActive ? "Active" : "Inactive"} />
      <DetailLine label="Last Login" value={dateLabel(member.lastLoginAt)} />
      <DetailLine label="Created" value={dateLabel(member.createdAt)} />
      <DetailLine label="Updated" value={dateLabel(member.updatedAt)} />
      <DetailLine label="Created By" value={member.createdBy || "—"} />
    </Stack>
    <Divider sx={{ my: 1.6 }} />
    {canManage ? <>
      <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 1 }}>Security</Typography>
      <Stack sx={{ gap: 1 }}>
        <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap" }}>
          <V2Button size="small" variant="outlined" loading={securityLoading} onClick={createResetLink}>Create Reset Link</V2Button>
          <V2Button size="small" variant="outlined" onClick={resetMfa}>Disable MFA</V2Button>
          <V2Button size="small" variant="outlined" onClick={() => revokeSession()}>Revoke All Sessions</V2Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">MFA status is server-owned; reset links and sessions are never emailed or faked.</Typography>
        {sessions.map(session => <Stack key={session.id} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">Created {dateLabel(session.created_at)} · last seen {dateLabel(session.last_seen_at)}</Typography>
          <Stack direction="row" sx={{ gap: 0.75 }}>
            <Chip size="small" label={session.revoked_at ? "Revoked" : "Active"} color={session.revoked_at ? "default" : "success"} />
            {!session.revoked_at ? <V2Button size="small" variant="outlined" onClick={() => revokeSession(session.id)}>Revoke Session</V2Button> : null}
          </Stack>
        </Stack>)}
        {!sessions.length ? <Typography variant="caption" color="text.secondary">No active sessions reported.</Typography> : null}
      </Stack>
      <Divider sx={{ my: 1.6 }} />
    </> : null}
    <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 1 }}>Permissions</Typography>
    <Stack direction="row" sx={{ gap: 0.7, flexWrap: "wrap" }}>
      {permissionGroups.map(group => {
        const count = group.permissions.filter(key => member.permissions[key]).length;
        return <Chip key={group.title} size="small" label={`${group.title}: ${count}`} sx={{ fontWeight: 800 }} />;
      })}
    </Stack>
  </Box>;
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
    <Typography variant="caption" sx={{ fontWeight: 850, textAlign: "right" }}>{value}</Typography>
  </Stack>;
}

function PermissionEditor({ permissions, onChange }: { permissions: Record<AdminPermission, boolean>; onChange: (key: AdminPermission, value: boolean) => void }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
    {permissionGroups.map(group => <Box key={group.title} sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.25 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 0.75 }}>{group.title}</Typography>
      <Stack sx={{ gap: 0.1 }}>
        {group.permissions.map(key => <FormControlLabel key={key}
          control={<Checkbox size="small" checked={Boolean(permissions[key])} onChange={event => onChange(key, event.target.checked)} />}
          label={<Typography variant="body2">{permissionLabels[key]}</Typography>}
        />)}
      </Stack>
    </Box>)}
  </Box>;
}

function ActivityLog({ logs }: { logs: StaffActivityLog[] }) {
  return <Box sx={{ border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
    {logs.map(log => <Box key={log.id} sx={{ display: "grid", gridTemplateColumns: "minmax(11rem, 1fr) minmax(12rem, 1fr) minmax(12rem, 1.4fr) 10rem", gap: 1.5, px: 1.5, py: 1.15, borderTop: 1, borderColor: "divider", "&:first-of-type": { borderTop: 0 } }}>
      <Typography variant="body2" sx={{ fontWeight: 850 }}>{log.actorName || log.staffId || "System"}</Typography>
      <Typography variant="body2">{log.action}</Typography>
      <Typography variant="caption" color="text.secondary">{safeActivitySummary(log) || `${log.targetType || "record"} ${log.targetId || ""}`}</Typography>
      <Typography variant="caption" color="text.secondary">{dateLabel(log.createdAt)}</Typography>
    </Box>)}
    {!logs.length ? <Box sx={{ py: 7, textAlign: "center" }}><ShieldCheck size={28} /><Typography variant="h6" sx={{ mt: 1 }}>No activity logs found</Typography><Typography color="text.secondary">Real staff activity will appear here.</Typography></Box> : null}
  </Box>;
}
