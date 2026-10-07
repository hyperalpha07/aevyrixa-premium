"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Divider,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { CheckCircle2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
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
import { V2SearchField } from "@/components/admin-v2/shared/V2SearchField";

type StaffPayload = { staff?: AdminStaffRecord[]; errors?: string[] };

type RoleRecord = {
  key: string;
  name: string;
  description: string | null;
  permissions: Record<AdminPermission, boolean>;
  is_system: boolean;
  is_active: boolean;
};

type ViewMode = "roles" | "overrides" | "compare";
type OverrideChoice = "inherit" | "allow" | "deny";

type LocalOverrides = Partial<Record<AdminPermission, OverrideChoice>>;

async function readStaff(): Promise<AdminStaffRecord[]> {
  const response = await fetch("/api/admin/staff", { cache: "no-store" });
  const data = (await response.json()) as StaffPayload;
  if (!response.ok) throw new Error((data.errors ?? ["Staff access data unavailable."]).join(" "));
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

function roleDefault(role: RoleRecord | undefined, permission: AdminPermission) {
  return Boolean(role?.permissions?.[permission]);
}

function staffOverrideChoice(member: AdminStaffRecord | undefined, role: RoleRecord | undefined, permission: AdminPermission): OverrideChoice {
  if (!member) return "inherit";
  const actual = member.permissions?.[permission] === true;
  const defaultGranted = roleDefault(role, permission);
  if (actual === defaultGranted) return "inherit";
  return actual ? "allow" : "deny";
}

function effectiveValue(defaultGranted: boolean, override: OverrideChoice) {
  if (override === "allow") return true;
  if (override === "deny") return false;
  return defaultGranted;
}

function staffIdentity(member: AdminStaffRecord) {
  return `@${member.username}${member.email ? ` · ${member.email}` : " · No email"}`;
}

export function AdminV2PermissionsView() {
  const [staff, setStaff] = useState<AdminStaffRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("roles");
  const [selectedRoleKey, setSelectedRoleKey] = useState("manager");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [draftOverrides, setDraftOverrides] = useState<LocalOverrides>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [nextStaff, nextRoles] = await Promise.all([readStaff(), readRoles()]);
      setStaff(nextStaff);
      setRoles(nextRoles);
      setSelectedRoleKey((current) => nextRoles.some((role) => role.key === current) ? current : nextRoles[0]?.key ?? "manager");
      setSelectedStaffId((current) => current || nextStaff[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access data unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const selectedRole = roles.find((role) => role.key === selectedRoleKey) ?? roles[0];
  const selectedStaff = staff.find((member) => member.id === selectedStaffId) ?? staff[0];
  const selectedStaffRole = roles.find((role) => role.key === selectedStaff?.role);
  const filteredStaff = useMemo(() => {
    const term = staffSearch.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter((member) => [member.name, member.username, member.email, member.role].some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [staff, staffSearch]);

  useEffect(() => { setDraftOverrides({}); }, [selectedStaffId]);

  const roleGrants = selectedStaffRole ? permissionCount(selectedStaffRole.permissions) : 0;
  const explicitAllows = adminPermissionKeys.filter((permission) => (draftOverrides[permission] ?? staffOverrideChoice(selectedStaff, selectedStaffRole, permission)) === "allow").length;
  const explicitDenies = adminPermissionKeys.filter((permission) => (draftOverrides[permission] ?? staffOverrideChoice(selectedStaff, selectedStaffRole, permission)) === "deny").length;
  const effectiveGrants = adminPermissionKeys.filter((permission) => effectiveValue(roleDefault(selectedStaffRole, permission), draftOverrides[permission] ?? staffOverrideChoice(selectedStaff, selectedStaffRole, permission))).length;
  const dirty = Object.keys(draftOverrides).length > 0;

  async function saveOverrides() {
    if (!selectedStaff) return;
    setSaving(true);
    setError("");
    const payload = adminPermissionKeys.reduce((result, permission) => {
      const value = draftOverrides[permission];
      if (value === "inherit") result[permission] = null;
      if (value === "allow") result[permission] = true;
      if (value === "deny") result[permission] = false;
      return result;
    }, {} as Record<string, boolean | null>);
    const response = await fetch(`/api/admin/staff/${encodeURIComponent(selectedStaff.id)}/permissions`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ overrides: payload }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError((data.errors ?? ["Permission override was rejected."]).join(" "));
      return;
    }
    setNotice("Permission overrides saved.");
    setDraftOverrides({});
    await load();
  }

  return <>
    <V2PageHeader title="Permissions" description="Manage role permissions, explicit staff overrides, and compare access without changing the permission catalog." actions={<V2Button href="/admin-v2/staff" variant="outlined">Manage Staff Access</V2Button>} />
    <Box aria-hidden sx={{ height: 0, display: "flex", justifyContent: "flex-end", pr: 3, pointerEvents: "none" }}>
      <Box sx={{ width: 180, height: 84, mt: -9, borderRadius: "999px", opacity: 0.5, background: "radial-gradient(circle at 25% 40%, rgba(236,72,153,0.18), transparent 34%), radial-gradient(circle at 72% 34%, rgba(124,77,255,0.16), transparent 38%), linear-gradient(135deg, rgba(255,255,255,0.55), rgba(236,72,153,0.08))", filter: "blur(0.4px)" }} />
    </Box>
    {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
    {notice ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert> : null}

    <V2Card sx={{ mb: 2, overflow: "hidden", "& .MuiCardContent-root": { p: 0, "&:last-child": { pb: 0 } } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <Metric label="Permissions" value={adminPermissionKeys.length} helper="Catalog controlled" />
        <Metric label="Staff Roles" value={roles.filter((role) => role.is_system).length || 5} helper="Excludes owner" />
        <Metric label="Protected Owner" value="Full" helper="Environment principal" />
        <Metric label="Staff Overrides" value={staff.filter((member) => roles.some((role) => role.key === member.role) && adminPermissionKeys.some((permission) => staffOverrideChoice(member, roles.find((role) => role.key === member.role), permission) !== "inherit")).length} helper="Explicit differences" />
      </Box>
    </V2Card>

    <V2Card sx={{ minHeight: 620, maxHeight: { xl: "calc(100vh - 220px)" }, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, alignItems: "center", mb: 2 }}>
        <Tabs value={viewMode} onChange={(_, value) => setViewMode(value)} aria-label="Permission workspace tabs">
          <Tab value="roles" label="Role Permissions" />
          <Tab value="overrides" label="Staff Overrides" />
          <Tab value="compare" label="Compare Access" />
        </Tabs>
        <V2Button variant="outlined" startIcon={<RefreshCw size={15} />} disabled={loading} onClick={() => { void load(); }}>Refresh</V2Button>
      </Stack>
      <Box sx={{ minHeight: 0, flex: 1, overflow: "hidden" }}>
      {viewMode === "roles" ? <RolePermissionsView roles={roles} selectedRole={selectedRole} selectedKey={selectedRoleKey} onSelect={setSelectedRoleKey} onReload={load} onError={setError} onNotice={setNotice} /> : null}
      {viewMode === "overrides" ? <StaffOverridesView staff={filteredStaff} search={staffSearch} onSearch={setStaffSearch} selectedStaff={selectedStaff} selectedStaffRole={selectedStaffRole} selectedStaffId={selectedStaffId} onSelectStaff={setSelectedStaffId} draftOverrides={draftOverrides} onDraftOverrides={setDraftOverrides} roleGrants={roleGrants} explicitAllows={explicitAllows} explicitDenies={explicitDenies} effectiveGrants={effectiveGrants} dirty={dirty} saving={saving} onSave={saveOverrides} /> : null}
      {viewMode === "compare" ? <CompareMatrix roles={roles} /> : null}
      </Box>
    </V2Card>
  </>;
}

function Metric({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return <Box sx={{ px: 1.35, py: 1, borderRight: 1, borderColor: "divider", "&:last-of-type": { borderRight: 0 } }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.65, fontWeight: 850 }}>{label}</Typography>
    <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.15 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{helper}</Typography>
  </Box>;
}

function RolePermissionsView({ roles, selectedRole, selectedKey, onSelect, onReload, onError, onNotice }: { roles: RoleRecord[]; selectedRole?: RoleRecord; selectedKey: string; onSelect: (key: string) => void; onReload: () => Promise<void>; onError: (value: string) => void; onNotice: (value: string) => void }) {
  const [openGroup, setOpenGroup] = useState(permissionGroups[0]?.title ?? "");
  const [draftPermissions, setDraftPermissions] = useState<Record<AdminPermission, boolean> | null>(null);
  useEffect(() => {
    setDraftPermissions(null);
    setOpenGroup(permissionGroups[0]?.title ?? "");
  }, [selectedRole?.key]);
  const workingPermissions = draftPermissions ?? selectedRole?.permissions;
  const dirty = Boolean(draftPermissions);
  function setDraftPermission(permission: AdminPermission, enabled: boolean) {
    if (!selectedRole || selectedRole.is_system) return;
    setDraftPermissions({ ...(draftPermissions ?? selectedRole.permissions), [permission]: enabled });
  }
  async function saveRolePermissions() {
    if (!selectedRole || selectedRole.is_system) return;
    const response = await fetch(`/api/admin/roles/${encodeURIComponent(selectedRole.key)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: selectedRole.name, description: selectedRole.description, permissions: draftPermissions ?? selectedRole.permissions, isActive: selectedRole.is_active }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      onError((data.errors ?? ["Role permission update was rejected."]).join(" "));
      return;
    }
    onNotice("Role permissions updated.");
    setDraftPermissions(null);
    await onReload();
  }
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "20rem minmax(0, 1fr)" }, gap: 2, minHeight: 0, height: "100%" }}>
    <Stack sx={{ gap: 0.25, minHeight: 0, overflow: "auto", pr: 0.5 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 1, py: 1, bgcolor: "rgba(124,77,255,0.035)" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Owner</Typography>
        <Typography variant="caption" color="text.secondary">Protected full access · read-only</Typography>
      </Box>
      {roles.map((role) => <Box component="button" type="button" key={role.key} onClick={() => onSelect(role.key)} sx={{ width: "100%", textAlign: "left", border: 0, borderLeft: 3, borderLeftColor: selectedKey === role.key ? "primary.main" : "transparent", borderBottom: 1, borderColor: "divider", p: 1.05, bgcolor: selectedKey === role.key ? "rgba(124,77,255,0.07)" : "transparent", cursor: "pointer", "&:hover": { bgcolor: "rgba(124,77,255,0.04)" }, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}><Typography variant="body2" sx={{ fontWeight: 900 }}>{role.name}</Typography><Chip size="small" label={role.is_system ? "System" : "Custom"} /></Stack>
        <Typography variant="caption" color="text.secondary">{permissionCount(role.permissions)} / {adminPermissionKeys.length} enabled</Typography>
      </Box>)}
    </Stack>
    {selectedRole && workingPermissions ? <Stack sx={{ gap: 1.25, minHeight: 0, overflow: "hidden" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
        <Box><Typography variant="h6" sx={{ fontWeight: 950 }}>{selectedRole.name}</Typography><Typography variant="body2" color="text.secondary">{selectedRole.key} · {selectedRole.is_system ? "System Role" : selectedRole.is_active ? "Active custom role" : "Disabled custom role"}</Typography></Box>
        <Stack direction="row" sx={{ gap: 0.75 }}><Chip size="small" label={`${permissionCount(selectedRole.permissions)} / ${adminPermissionKeys.length} enabled`} /><Chip size="small" label={selectedRole.is_system ? "Read-only" : "Editable"} color={selectedRole.is_system ? "default" : "primary"} /></Stack>
      </Stack>
      {selectedRole.is_system ? <Alert severity="info">Built-in role permissions are read-only. Custom roles can be edited here.</Alert> : null}
      {!selectedRole.is_system ? <Stack direction="row" sx={{ gap: 1, justifyContent: "flex-end" }}>
        {dirty ? <Chip size="small" label="Unsaved changes" color="warning" /> : null}
        <V2Button size="small" variant="outlined" disabled={!dirty} onClick={() => setDraftPermissions(null)}>Reset</V2Button>
        <V2Button size="small" variant="contained" disabled={!dirty} onClick={() => { void saveRolePermissions(); }}>Save Changes</V2Button>
      </Stack> : null}
      <Stack sx={{ gap: 0.75, minHeight: 0, overflow: "auto", pr: 0.5, overscrollBehavior: "contain" }}>
        {permissionGroups.map((group) => <PermissionModule key={group.title} title={group.title} permissions={group.permissions} values={workingPermissions} open={openGroup === group.title} editable={!selectedRole.is_system} onToggle={() => setOpenGroup((current) => current === group.title ? "" : group.title)} onChange={setDraftPermission} />)}
      </Stack>
    </Stack> : null}
  </Box>;
}

function PermissionModule({ title, permissions, values, open, editable, onToggle, onChange }: { title: string; permissions: AdminPermission[]; values: Record<AdminPermission, boolean>; open: boolean; editable: boolean; onToggle: () => void; onChange?: (permission: AdminPermission, enabled: boolean) => void }) {
  const enabled = permissions.filter((permission) => values[permission]).length;
  const pct = Math.round((enabled / permissions.length) * 100);
  return <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
    <Box component="button" type="button" onClick={onToggle} sx={{ width: "100%", border: 0, bgcolor: open ? "rgba(124,77,255,0.055)" : "transparent", cursor: "pointer", px: 1.25, py: 1, textAlign: "left", "&:hover": { bgcolor: "rgba(124,77,255,0.04)" } }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.1 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: "999px", display: "grid", placeItems: "center", bgcolor: "rgba(124,77,255,0.10)", color: "primary.main", fontWeight: 950 }}>{title.slice(0, 1)}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>{enabled} / {permissions.length}</Typography>
          </Stack>
          <Box sx={{ mt: 0.55, height: 5, borderRadius: 999, bgcolor: "rgba(124,77,255,0.10)", overflow: "hidden" }}><Box sx={{ width: `${pct}%`, height: "100%", bgcolor: "primary.main", opacity: 0.65 }} /></Box>
        </Box>
      </Stack>
    </Box>
    {open ? <Box sx={{ maxHeight: 340, overflowY: "auto", overscrollBehavior: "contain", borderTop: 1, borderColor: "divider" }}>
      {permissions.map((permission) => <Stack key={permission} direction="row" sx={{ alignItems: "center", gap: 1, px: 1.25, py: 0.72, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" sx={{ fontWeight: 820 }}>{permissionLabels[permission]}</Typography><Typography variant="caption" color="text.secondary">{permission}</Typography></Box>
        {editable ? <Checkbox size="small" checked={Boolean(values[permission])} onChange={(event) => onChange?.(permission, event.target.checked)} /> : values[permission] ? <CheckCircle2 size={16} color="#2e7d32" /> : <XCircle size={16} color="#9aa0aa" />}
      </Stack>)}
    </Box> : null}
  </Box>;
}

function StaffOverridesView({ staff, search, onSearch, selectedStaff, selectedStaffRole, selectedStaffId, onSelectStaff, draftOverrides, onDraftOverrides, roleGrants, explicitAllows, explicitDenies, effectiveGrants, dirty, saving, onSave }: { staff: AdminStaffRecord[]; search: string; onSearch: (value: string) => void; selectedStaff?: AdminStaffRecord; selectedStaffRole?: RoleRecord; selectedStaffId: string; onSelectStaff: (id: string) => void; draftOverrides: LocalOverrides; onDraftOverrides: (value: LocalOverrides) => void; roleGrants: number; explicitAllows: number; explicitDenies: number; effectiveGrants: number; dirty: boolean; saving: boolean; onSave: () => void }) {
  const [openGroup, setOpenGroup] = useState(permissionGroups[0]?.title ?? "");
  useEffect(() => { setOpenGroup(permissionGroups[0]?.title ?? ""); }, [selectedStaff?.id]);
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "20rem minmax(0, 1fr)" }, gap: 2, height: "100%", minHeight: 0 }}>
    <Stack sx={{ gap: 0.5, minHeight: 0, overflow: "auto", pr: 0.5 }}>
      <V2SearchField value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search staff" slotProps={{ htmlInput: { "aria-label": "Search staff overrides" } }} />
      {staff.map((member) => <Box component="button" type="button" key={member.id} onClick={() => onSelectStaff(member.id)} sx={{ width: "100%", textAlign: "left", border: 0, borderLeft: 3, borderLeftColor: selectedStaffId === member.id ? "primary.main" : "transparent", borderBottom: 1, borderColor: "divider", p: 1.05, bgcolor: selectedStaffId === member.id ? "rgba(124,77,255,0.07)" : "transparent", cursor: "pointer", "&:hover": { bgcolor: "rgba(124,77,255,0.04)" } }}>
        <Typography variant="body2" sx={{ fontWeight: 900 }}>{member.name}</Typography><Typography variant="caption" color="text.secondary">{staffIdentity(member)}</Typography>
      </Box>)}
    </Stack>
    {selectedStaff ? <Stack sx={{ gap: 1.2, minHeight: 0, overflow: "hidden" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
        <Box><Typography variant="h6" sx={{ fontWeight: 950 }}>{selectedStaff.name}</Typography><Typography variant="body2" color="text.secondary">@{selectedStaff.username} · {selectedStaff.role} · {selectedStaff.isActive ? "Active" : "Inactive"}</Typography></Box>
        <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", justifyContent: "flex-end" }}><Chip size="small" label={`Role grants: ${roleGrants}`} /><Chip size="small" label={`Allows: ${explicitAllows}`} color={explicitAllows ? "success" : "default"} /><Chip size="small" label={`Denies: ${explicitDenies}`} color={explicitDenies ? "warning" : "default"} /><Chip size="small" label={`Effective: ${effectiveGrants}`} /></Stack>
      </Stack>
      <Stack direction="row" sx={{ gap: 1, justifyContent: "flex-end" }}>{dirty ? <Chip label="Unsaved changes" color="warning" /> : null}<V2Button variant="outlined" disabled={!dirty || saving} onClick={() => onDraftOverrides({})}>Cancel Changes</V2Button><V2Button variant="contained" loading={saving} disabled={!dirty} onClick={onSave}>Save Changes</V2Button></Stack>
      <Stack sx={{ minHeight: 0, overflow: "auto", overscrollBehavior: "contain" }}>
      {permissionGroups.map((group) => {
        const enabled = group.permissions.filter((permission) => effectiveValue(roleDefault(selectedStaffRole, permission), draftOverrides[permission] ?? staffOverrideChoice(selectedStaff, selectedStaffRole, permission))).length;
        return <Box key={group.title} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box component="button" type="button" onClick={() => setOpenGroup((current) => current === group.title ? "" : group.title)} sx={{ width: "100%", border: 0, cursor: "pointer", px: 1.25, py: 1, textAlign: "left", bgcolor: openGroup === group.title ? "rgba(124,77,255,0.055)" : "transparent" }}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{group.title}</Typography><Typography variant="caption" color="text.secondary">{enabled}/{group.permissions.length}</Typography></Stack></Box>
        {openGroup === group.title ? <Box sx={{ maxHeight: 340, overflowY: "auto", borderTop: 1, borderColor: "divider" }}>{group.permissions.map((permission) => {
          const baseline = roleDefault(selectedStaffRole, permission);
          const current = draftOverrides[permission] ?? staffOverrideChoice(selectedStaff, selectedStaffRole, permission);
          const effective = effectiveValue(baseline, current);
          return <Stack key={permission} direction="row" sx={{ alignItems: "center", gap: 1.25, px: 1.25, py: 0.72, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
            <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" sx={{ fontWeight: 850 }}>{permissionLabels[permission]}</Typography><Typography variant="caption" color="text.secondary">{permission}</Typography></Box>
            <Typography variant="caption" sx={{ width: 70, color: baseline ? "success.main" : "text.secondary", fontWeight: 850 }}>{baseline ? "Allow" : "Deny"}</Typography>
            <ToggleButtonGroup exclusive size="small" value={current} onChange={(_, value) => { if (value) onDraftOverrides({ ...draftOverrides, [permission]: value }); }} aria-label={`${permission} override`}><ToggleButton value="inherit">Inherit</ToggleButton><ToggleButton value="allow">Allow</ToggleButton><ToggleButton value="deny">Deny</ToggleButton></ToggleButtonGroup>
            <Typography variant="caption" sx={{ width: 74, color: effective ? "success.main" : "text.secondary", fontWeight: 850 }}>{effective ? "Allowed" : "Denied"}</Typography>
          </Stack>;
        })}</Box> : null}
      </Box>;})}
      </Stack>
    </Stack> : <Alert severity="info">Select a staff member to edit explicit overrides.</Alert>}
  </Box>;
}

function CompareMatrix({ roles }: { roles: RoleRecord[] }) {
  const [roleA, setRoleA] = useState(roles[0]?.key ?? "");
  const [roleB, setRoleB] = useState(roles[1]?.key ?? roles[0]?.key ?? "");
  const [open, setOpen] = useState(false);
  const a = roles.find((role) => role.key === roleA) ?? roles[0];
  const b = roles.find((role) => role.key === roleB) ?? roles[1] ?? roles[0];
  const shared = adminPermissionKeys.filter((permission) => a?.permissions[permission] && b?.permissions[permission]).length;
  const onlyA = adminPermissionKeys.filter((permission) => a?.permissions[permission] && !b?.permissions[permission]).length;
  const onlyB = adminPermissionKeys.filter((permission) => !a?.permissions[permission] && b?.permissions[permission]).length;
  return <Stack sx={{ gap: 1.5 }}>
    <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
      <TextField select size="small" label="Role A" value={roleA} onChange={(event) => setRoleA(event.target.value)} sx={{ minWidth: 220 }}>{roles.map((role) => <MenuItem key={role.key} value={role.key}>{role.name}</MenuItem>)}</TextField>
      <TextField select size="small" label="Role B" value={roleB} onChange={(event) => setRoleB(event.target.value)} sx={{ minWidth: 220 }}>{roles.map((role) => <MenuItem key={role.key} value={role.key}>{role.name}</MenuItem>)}</TextField>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(7rem, 1fr))", gap: 1, flex: 1 }}>
        <Metric label="Shared" value={shared} helper="Both roles" />
        <Metric label="Only Role A" value={onlyA} helper={a?.name ?? "Role A"} />
        <Metric label="Only Role B" value={onlyB} helper={b?.name ?? "Role B"} />
      </Box>
    </Stack>
    <Box><V2Button variant="outlined" onClick={() => setOpen((current) => !current)}>{open ? "Hide detailed matrix" : "Open detailed matrix"}</V2Button></Box>
    {open ? <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, overflow: "hidden" }}>
      <Box sx={{ overflow: "auto", maxHeight: 450 }}><Box sx={{ minWidth: 920 }}>
        <Box sx={{ position: "sticky", top: 0, zIndex: 1, display: "grid", gridTemplateColumns: `minmax(18rem, 1.3fr) repeat(${roles.length + 1}, minmax(7rem, 0.6fr))`, gap: 1, px: 1.25, py: 0.8, bgcolor: "rgba(248,247,252,0.98)", borderBottom: 1, borderColor: "divider" }}><Typography variant="caption" sx={{ fontWeight: 900 }}>Permission</Typography><Typography variant="caption" sx={{ textAlign: "center", fontWeight: 900 }}>Owner</Typography>{roles.map((role) => <Typography key={role.key} variant="caption" sx={{ textAlign: "center", fontWeight: 900 }}>{role.name}</Typography>)}</Box>
        {adminPermissionKeys.map((permission) => <Box key={permission} sx={{ display: "grid", gridTemplateColumns: `minmax(18rem, 1.3fr) repeat(${roles.length + 1}, minmax(7rem, 0.6fr))`, gap: 1, px: 1.25, py: 0.75, borderTop: 1, borderColor: "divider" }}><Box sx={{ position: "sticky", left: 0, bgcolor: "background.paper" }}><Typography variant="body2" sx={{ fontWeight: 850 }}>{permissionLabels[permission]}</Typography><Typography variant="caption" color="text.secondary">{permission}</Typography></Box><Box sx={{ textAlign: "center" }}><ShieldCheck size={16} color="#7c4dff" /></Box>{roles.map((role) => <Box key={role.key} sx={{ textAlign: "center" }}>{role.permissions[permission] ? <CheckCircle2 size={16} color="#2e7d32" /> : <XCircle size={16} color="#9aa0aa" />}</Box>)}</Box>)}
      </Box></Box>
    </Box> : null}
  </Stack>;
}
