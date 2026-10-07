"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Collapse,
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
import { CheckCircle2, ChevronDown, GitCompareArrows, LockKeyhole, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import {
  adminPermissionKeys,
  permissionGroups,
  permissionLabels,
  type AdminPermission,
} from "@/app/lib/admin-permissions";
import type { AdminStaffRecord } from "@/app/lib/admin-staff";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

type StaffPayload = { staff?: AdminStaffRecord[]; errors?: string[] };

type RoleRecord = {
  key: string;
  name: string;
  description: string | null;
  permissions: Record<AdminPermission, boolean>;
  is_system: boolean;
  is_active: boolean;
};

type RoleDraft = {
  key: string;
  name: string;
  description: string;
  isActive: boolean;
  permissions: Record<AdminPermission, boolean>;
};

const systemStaffRoleCount = 5;

async function readStaff(): Promise<AdminStaffRecord[]> {
  const response = await fetch("/api/admin/staff", { cache: "no-store" });
  const data = (await response.json()) as StaffPayload;
  if (!response.ok) throw new Error((data.errors ?? ["Staff usage data unavailable."]).join(" "));
  return data.staff ?? [];
}

async function readRoles(): Promise<RoleRecord[]> {
  const response = await fetch("/api/admin/roles", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error((data.errors ?? ["Roles unavailable."]).join(" "));
  return data.roles ?? [];
}

function permissionCount(permissions: Record<AdminPermission, boolean>) {
  return adminPermissionKeys.filter((key) => permissions[key] === true).length;
}

function assignedStaff(staff: AdminStaffRecord[], roleKey: string) {
  return staff.filter((member) => member.role === roleKey);
}

function emptyPermissionMap() {
  return adminPermissionKeys.reduce((result, key) => {
    result[key] = false;
    return result;
  }, {} as Record<AdminPermission, boolean>);
}

function draftFromRole(role?: RoleRecord): RoleDraft {
  return {
    key: role?.key ?? "",
    name: role?.name ?? "",
    description: role?.description ?? "",
    isActive: role?.is_active ?? true,
    permissions: role?.permissions ?? emptyPermissionMap(),
  };
}

function rolePurpose(role: RoleRecord) {
  if (!role.is_system) return role.description || "Custom access profile managed by your admin team.";
  if (role.key === "manager") return "Broad operations lead for orders, products, support, storefront, analytics, and activity.";
  if (role.key === "order_staff") return "Order operations for fulfilment, courier updates, invoices, notes, and exports.";
  if (role.key === "product_staff") return "Catalog operations for products, media, merchandising, reviews, and categories.";
  if (role.key === "support_staff") return "Customer care access for live support visibility, replies, and conversation closing.";
  if (role.key === "viewer") return "Read-mostly operational visibility without mutation-heavy access.";
  return "Protected system role.";
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
}

export function AdminV2RolesView() {
  const [staff, setStaff] = useState<AdminStaffRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [selectedKey, setSelectedKey] = useState("manager");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [draft, setDraft] = useState<RoleDraft>(draftFromRole());
  const [dialogError, setDialogError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [nextStaff, nextRoles] = await Promise.all([readStaff(), readRoles()]);
      setStaff(nextStaff);
      setRoles(nextRoles);
      setSelectedKey((current) => nextRoles.some((role) => role.key === current) ? current : nextRoles[0]?.key ?? "manager");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access data unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const directory = useMemo(() => [...roles]
    .filter((role) => {
      const term = roleSearch.trim().toLowerCase();
      if (!term) return true;
      return [role.name, role.key, role.description].some((value) => String(value ?? "").toLowerCase().includes(term));
    })
    .sort((a, b) => Number(b.is_system) - Number(a.is_system) || a.name.localeCompare(b.name)), [roles, roleSearch]);
  const selected = directory.find((role) => role.key === selectedKey) ?? directory[0];
  const selectedStaff = selected ? assignedStaff(staff, selected.key) : [];
  const customRoles = roles.filter((role) => !role.is_system);
  const activeStaff = staff.filter((member) => member.isActive).length;

  function openCreate() {
    setEditingRole(null);
    setDraft(draftFromRole());
    setDialogError("");
    setEditorOpen(true);
  }

  function openEdit(role: RoleRecord) {
    setEditingRole(role);
    setDraft(draftFromRole(role));
    setDialogError("");
    setEditorOpen(true);
  }

  async function saveRole() {
    setDialogError("");
    const key = slugify(draft.key);
    const name = draft.name.trim();
    if (!editingRole && !/^[a-z][a-z0-9_]{1,63}$/.test(key)) {
      setDialogError("Role key must be a lowercase slug starting with a letter.");
      return;
    }
    if (!name) {
      setDialogError("Role name is required.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(editingRole ? `/api/admin/roles/${encodeURIComponent(editingRole.key)}` : "/api/admin/roles", {
        method: editingRole ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key,
          name,
          description: draft.description,
          permissions: draft.permissions,
          isActive: draft.isActive,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((data.errors ?? ["Role could not be saved."]).join(" "));
      setNotice(editingRole ? "Custom role updated." : "Custom role created.");
      setEditorOpen(false);
      await load();
      setSelectedKey(data.role?.key ?? key);
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Role could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRole(role: RoleRecord) {
    try {
      const response = await fetch(`/api/admin/roles/${encodeURIComponent(role.key)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: role.name, description: role.description, permissions: role.permissions, isActive: !role.is_active }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((data.errors ?? ["Could not update role."]).join(" "));
      setNotice(role.is_active ? "Custom role deactivated." : "Custom role activated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role.");
    }
  }

  async function deleteRole() {
    if (!deleteTarget) return;
    setSaving(true);
    const response = await fetch(`/api/admin/roles/${encodeURIComponent(deleteTarget.key)}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError((data.errors ?? ["Could not delete role."]).join(" "));
      setDeleteTarget(null);
      return;
    }
    setNotice("Custom role deleted.");
    setDeleteTarget(null);
    await load();
  }

  return (
    <>
      <V2PageHeader
        title="Roles"
        description="Manage staff role templates, custom access profiles, and protected owner context."
        actions={<V2Button variant="contained" onClick={openCreate}>Create Custom Role</V2Button>}
      />
      <Box aria-hidden sx={{ height: 0, display: "flex", justifyContent: "flex-end", pr: 3, pointerEvents: "none" }}>
        <Box sx={{ width: 180, height: 84, mt: -9, borderRadius: "999px", opacity: 0.5, background: "radial-gradient(circle at 25% 40%, rgba(236,72,153,0.18), transparent 34%), radial-gradient(circle at 72% 34%, rgba(124,77,255,0.16), transparent 38%), linear-gradient(135deg, rgba(255,255,255,0.55), rgba(236,72,153,0.08))", filter: "blur(0.4px)" }} />
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert> : null}

      <V2Card sx={{ mb: 2, overflow: "hidden", "& .MuiCardContent-root": { p: 0, "&:last-child": { pb: 0 } } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <MetricCard label="System Roles" value={systemStaffRoleCount} helper="Staff DB roles only" />
        <MetricCard label="Custom Roles" value={customRoles.length} helper="Real custom roles" />
        <MetricCard label="Active Staff" value={activeStaff} helper="Current active accounts" />
      </Box>
      </V2Card>

      <V2Card sx={{ mb: 2, "& .MuiCardContent-root": { py: 1.35, "&:last-child": { pb: 1.35 } } }}>
        <Stack direction="row" sx={{ gap: 1.4, alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" sx={{ gap: 1.2, alignItems: "center" }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "999px", display: "grid", placeItems: "center", bgcolor: "rgba(124,77,255,0.10)", color: "primary.main" }}><LockKeyhole size={18} /></Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Owner</Typography>
              <Typography variant="body2" color="text.secondary">Protected principal - full access - environment authenticated</Typography>
            </Box>
          </Stack>
          <Chip size="small" color="primary" label="Not a staff role" sx={{ fontWeight: 850 }} />
        </Stack>
      </V2Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "21rem minmax(0, 1fr)" }, gap: 2, minHeight: 620, maxHeight: { xl: "calc(100vh - 230px)" } }}>
        <V2Card sx={{ minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "center", mb: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>Role directory</Typography>
              <Typography variant="body2" color="text.secondary">System and custom roles from the real Roles API.</Typography>
            </Box>
            <V2Button size="small" variant="outlined" startIcon={<RefreshCw size={15} />} disabled={loading} onClick={() => { void load(); }}>Refresh</V2Button>
          </Stack>
          <TextField size="small" value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} placeholder="Search roles" sx={{ mb: 1 }} />
          <Stack sx={{ gap: 0, minHeight: 0, overflow: "auto", mx: -2, px: 2, pb: 1 }}>
            {directory.map((role) => <RoleDirectoryRow key={role.key} role={role} staff={staff} selected={selected?.key === role.key} onSelect={() => setSelectedKey(role.key)} />)}
          </Stack>
        </V2Card>

        {selected ? <V2Card sx={{ minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <RoleDetail role={selected} staff={selectedStaff} onEdit={() => openEdit(selected)} onToggle={() => toggleRole(selected)} onDelete={() => setDeleteTarget(selected)} />
          <Divider sx={{ my: 2 }} />
          <Box>
            <V2Button variant="outlined" startIcon={<GitCompareArrows size={16} />} endIcon={<ChevronDown size={15} style={{ transform: compareOpen ? "rotate(180deg)" : "none" }} />} onClick={() => setCompareOpen((current) => !current)}>
              Compare Access
            </V2Button>
            <Collapse in={compareOpen} unmountOnExit>
              <CompareAccess roles={directory} />
            </Collapse>
          </Box>
        </V2Card> : null}
      </Box>

      <RoleEditorDialog
        open={editorOpen}
        draft={draft}
        editingRole={editingRole}
        error={dialogError}
        saving={saving}
        onClose={() => setEditorOpen(false)}
        onSave={saveRole}
        onDraft={setDraft}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth aria-labelledby="delete-role-title">
        <DialogTitle id="delete-role-title">Delete custom role?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">The server will reject deletion if this role is assigned to staff.</Typography>
          <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 900 }}>{deleteTarget?.name}</Typography>
        </DialogContent>
        <DialogActions>
          <V2Button variant="outlined" onClick={() => setDeleteTarget(null)}>Cancel</V2Button>
          <V2Button color="error" variant="contained" loading={saving} onClick={deleteRole}>Delete Role</V2Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return <Box sx={{ px: 1.5, py: 1.1, borderRight: 1, borderColor: "divider", "&:last-of-type": { borderRight: 0 } }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 850 }}>{label}</Typography>
    <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.1 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{helper}</Typography>
  </Box>;
}

function RoleDirectoryRow({ role, staff, selected, onSelect }: { role: RoleRecord; staff: AdminStaffRecord[]; selected: boolean; onSelect: () => void }) {
  const assigned = assignedStaff(staff, role.key).length;
  return <Box component="button" type="button" onClick={onSelect} sx={{ width: "100%", textAlign: "left", border: 0, borderLeft: 3, borderLeftColor: selected ? "primary.main" : "transparent", borderBottom: 1, borderColor: "divider", p: 1.1, bgcolor: selected ? "rgba(124,77,255,0.07)" : "transparent", cursor: "pointer", "&:hover": { bgcolor: "rgba(124,77,255,0.045)" }, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 } }}>
    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 900 }}>{role.name}</Typography>
        <Typography variant="caption" color="text.secondary">{role.key}</Typography>
      </Box>
      <Chip size="small" label={role.is_system ? "System" : "Custom"} color={role.is_system ? "default" : "primary"} sx={{ fontWeight: 850 }} />
    </Stack>
    <Stack direction="row" sx={{ gap: 0.9, flexWrap: "wrap", mt: 0.7 }}>
      <Typography variant="caption" color="text.secondary">{permissionCount(role.permissions)} permissions</Typography>
      <Typography variant="caption" color="text.secondary">{assigned} assigned</Typography>
      {!role.is_active ? <Chip size="small" color="warning" label="Disabled" sx={{ fontWeight: 800 }} /> : null}
    </Stack>
  </Box>;
}

function RoleDetail({ role, staff, onEdit, onToggle, onDelete }: { role: RoleRecord; staff: AdminStaffRecord[]; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  const [openGroup, setOpenGroup] = useState(permissionGroups[0]?.title ?? "");
  const count = permissionCount(role.permissions);
  return <Stack sx={{ gap: 1.4, minHeight: 0, overflow: "hidden", flex: 1 }}>
    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
      <Box>
        <Typography variant="overline" color="text.secondary">Selected role</Typography>
        <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-0.03em" }}>{role.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>{rolePurpose(role)}</Typography>
      </Box>
      <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <Chip size="small" label={role.is_system ? "System" : "Custom"} color={role.is_system ? "default" : "primary"} sx={{ fontWeight: 850 }} />
        <Chip size="small" label={role.is_active ? "Active" : "Disabled"} color={role.is_active ? "success" : "warning"} sx={{ fontWeight: 850 }} />
      </Stack>
    </Stack>

    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 1 }}>
      <MiniStat label="Key" value={role.key} />
      <MiniStat label="Assigned Staff" value={String(staff.length)} />
      <MiniStat label="Permissions" value={`${count} / ${adminPermissionKeys.length}`} />
      <MiniStat label="Type" value={role.is_system ? "Protected" : "Editable"} />
    </Box>

    {role.is_system ? <Alert severity="info" icon={<ShieldCheck size={18} />}>System roles are protected and read-only. Create a custom role to edit permission sets.</Alert> : <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
      <V2Button variant="contained" onClick={onEdit}>Edit</V2Button>
      <V2Button variant="outlined" onClick={onToggle}>{role.is_active ? "Deactivate" : "Activate"}</V2Button>
      <V2Button variant="outlined" color="error" onClick={onDelete}>Delete</V2Button>
    </Stack>}

    <Box sx={{ minHeight: 0, overflow: "hidden" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 950, mb: 0.75 }}>Permission modules</Typography>
      <Stack sx={{ gap: 0, minHeight: 0, overflow: "auto", overscrollBehavior: "contain", maxHeight: { xl: "calc(100vh - 520px)" } }}>
        {permissionGroups.map((group) => <PermissionGroupRows key={group.title} title={group.title} permissions={group.permissions} rolePermissions={role.permissions} open={openGroup === group.title} onToggle={() => setOpenGroup((current) => current === group.title ? "" : group.title)} />)}
      </Stack>
    </Box>
  </Stack>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.15, bgcolor: "rgba(124,77,255,0.025)", minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 850 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</Typography>
  </Box>;
}

function PermissionGroupRows({ title, permissions, rolePermissions, open, onToggle }: { title: string; permissions: AdminPermission[]; rolePermissions: Record<AdminPermission, boolean>; open: boolean; onToggle: () => void }) {
  const enabled = permissions.filter((permission) => rolePermissions[permission]).length;
  return <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
    <Box component="button" type="button" onClick={onToggle} sx={{ width: "100%", border: 0, bgcolor: open ? "rgba(124,77,255,0.055)" : "transparent", cursor: "pointer", px: 1.25, py: 1, textAlign: "left", "&:hover": { bgcolor: "rgba(124,77,255,0.04)" } }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>{enabled}/{permissions.length}</Typography>
      </Stack>
      <Box sx={{ mt: 0.6, height: 5, borderRadius: 999, bgcolor: "rgba(124,77,255,0.10)", overflow: "hidden" }}><Box sx={{ width: `${Math.round((enabled / permissions.length) * 100)}%`, height: "100%", bgcolor: "primary.main", opacity: 0.65 }} /></Box>
    </Box>
    {open ? <Box sx={{ maxHeight: 340, overflowY: "auto", borderTop: 1, borderColor: "divider" }}>
      {permissions.map((permission) => <Stack key={permission} direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1, px: 1.25, py: 0.72, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 820 }}>{permissionLabels[permission]}</Typography>
          <Typography variant="caption" color="text.secondary">{permission}</Typography>
        </Box>
        {rolePermissions[permission] ? <CheckCircle2 size={16} color="#2e7d32" /> : <XCircle size={16} color="#9aa0aa" />}
      </Stack>)}
    </Box> : null}
  </Box>;
}

function RoleEditorDialog({ open, draft, editingRole, error, saving, onClose, onSave, onDraft }: { open: boolean; draft: RoleDraft; editingRole: RoleRecord | null; error: string; saving: boolean; onClose: () => void; onSave: () => void; onDraft: (draft: RoleDraft) => void }) {
  const isEditing = Boolean(editingRole);
  const normalizedKey = slugify(draft.key || draft.name);
  function updatePermission(permission: AdminPermission, enabled: boolean) {
    onDraft({ ...draft, permissions: { ...draft.permissions, [permission]: enabled } });
  }
  function setGroup(groupPermissions: AdminPermission[], enabled: boolean) {
    const next = { ...draft.permissions };
    for (const permission of groupPermissions) next[permission] = enabled;
    onDraft({ ...draft, permissions: next });
  }
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-labelledby="role-editor-title">
    <DialogTitle id="role-editor-title">{isEditing ? "Edit Custom Role" : "Create Custom Role"}</DialogTitle>
    <DialogContent dividers>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Stack sx={{ gap: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
          <TextField label="Role name" value={draft.name} onChange={(event) => onDraft({ ...draft, name: event.target.value, key: isEditing ? draft.key : slugify(event.target.value) })} autoFocus />
          <TextField label="Role key" value={isEditing ? draft.key : normalizedKey} onChange={(event) => onDraft({ ...draft, key: slugify(event.target.value) })} disabled={isEditing} helperText={isEditing ? "Role key is immutable." : "Lowercase stable slug."} />
          <TextField label="Description" value={draft.description} onChange={(event) => onDraft({ ...draft, description: event.target.value })} multiline minRows={2} sx={{ gridColumn: { md: "1 / -1" } }} />
          <FormControlLabel control={<Switch checked={draft.isActive} onChange={(event) => onDraft({ ...draft, isActive: event.target.checked })} />} label={draft.isActive ? "Active role" : "Disabled role"} />
        </Box>
        <Divider />
        <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Grouped permissions</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25 }}>
          {permissionGroups.map((group) => <Box key={group.title} sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.25 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1, mb: 0.6 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{group.title}</Typography>
              <Stack direction="row" sx={{ gap: 0.5 }}>
                <V2Button size="small" variant="text" onClick={() => setGroup(group.permissions, true)}>Select All</V2Button>
                <V2Button size="small" variant="text" onClick={() => setGroup(group.permissions, false)}>Clear</V2Button>
              </Stack>
            </Stack>
            <Stack sx={{ gap: 0.1 }}>
              {group.permissions.map((permission) => <FormControlLabel key={permission} control={<Checkbox size="small" checked={Boolean(draft.permissions[permission])} onChange={(event) => updatePermission(permission, event.target.checked)} />} label={<Box><Typography variant="body2" sx={{ fontWeight: 750 }}>{permissionLabels[permission]}</Typography><Typography variant="caption" color="text.secondary">{permission}</Typography></Box>} />)}
            </Stack>
          </Box>)}
        </Box>
      </Stack>
    </DialogContent>
    <DialogActions>
      <V2Button variant="outlined" onClick={onClose}>Cancel</V2Button>
      <V2Button variant="contained" loading={saving} onClick={onSave}>{isEditing ? "Save Changes" : "Create Role"}</V2Button>
    </DialogActions>
  </Dialog>;
}

function CompareAccess({ roles }: { roles: RoleRecord[] }) {
  return <Box sx={{ mt: 1.5, border: 1, borderColor: "divider", borderRadius: 2.5, overflow: "hidden" }}>
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: 820 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: `minmax(16rem, 1.2fr) repeat(${roles.length}, minmax(7rem, 0.6fr))`, gap: 1, px: 1.25, py: 0.8, bgcolor: "rgba(124,77,255,0.055)" }}>
          <Typography variant="caption" sx={{ fontWeight: 900 }}>Permission</Typography>
          {roles.map((role) => <Typography key={role.key} variant="caption" sx={{ textAlign: "center", fontWeight: 900 }}>{role.name}</Typography>)}
        </Box>
        {adminPermissionKeys.map((permission) => <Box key={permission} sx={{ display: "grid", gridTemplateColumns: `minmax(16rem, 1.2fr) repeat(${roles.length}, minmax(7rem, 0.6fr))`, gap: 1, px: 1.25, py: 0.7, borderTop: 1, borderColor: "divider" }}>
          <Box><Typography variant="body2" sx={{ fontWeight: 800 }}>{permissionLabels[permission]}</Typography><Typography variant="caption" color="text.secondary">{permission}</Typography></Box>
          {roles.map((role) => <Box key={role.key} sx={{ textAlign: "center" }}>{role.permissions[permission] ? <CheckCircle2 size={16} color="#2e7d32" /> : <XCircle size={16} color="#9aa0aa" />}</Box>)}
        </Box>)}
      </Box>
    </Box>
  </Box>;
}
