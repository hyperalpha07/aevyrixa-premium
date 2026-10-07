"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircle2, GitCompareArrows, LockKeyhole, RefreshCw, ShieldCheck, UsersRound, XCircle } from "lucide-react";
import {
  adminPermissionKeys,
  permissionGroups,
  permissionLabels,
  roleLabels,
  type AdminPermission,
  type AdminRole,
} from "@/app/lib/admin-permissions";
import type { AdminStaffRecord } from "@/app/lib/admin-staff";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import {
  buildRoleSummaries,
  compareRoles,
  groupedRolePermissions,
  ownerRoleKey,
  roleDirectoryOrder,
  rolePurposes,
  rolesMetrics,
  type RoleSummary,
} from "@/lib/admin-v2/roles/roles-query";

type StaffPayload = {
  staff?: AdminStaffRecord[];
  errors?: string[];
};

type RoleRecord = {
  key: string;
  name: string;
  description: string | null;
  permissions: Record<AdminPermission, boolean>;
  is_system: boolean;
  is_active: boolean;
};

const comparableRoles: AdminRole[] = ["manager", "order_staff", "product_staff", "support_staff", "viewer"];

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

function dateLabel(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function accessLabel(summary: RoleSummary) {
  if (summary.accessLevel === "full") return "Full access";
  if (summary.accessLevel === "privileged") return "Privileged";
  if (summary.accessLevel === "read_only") return "Read-only";
  return "Focused";
}

function staffIdentity(member: AdminStaffRecord) {
  return `@${member.username}${member.email ? ` · ${member.email}` : " · No email"}`;
}

function adminPermissionCount(permissions: Record<AdminPermission, boolean>) {
  return adminPermissionKeys.filter((key) => permissions[key] === true).length;
}
export function AdminV2RolesView() {
  const [staff, setStaff] = useState<AdminStaffRecord[]>([]);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("manager");
  const [compareA, setCompareA] = useState<AdminRole>("manager");
  const [compareB, setCompareB] = useState<AdminRole>("support_staff");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [nextStaff, nextRoles] = await Promise.all([readStaff(), readRoles()]);
      setStaff(nextStaff);
      setRoles(nextRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Staff usage data unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function createCustomRole() {
    const key = window.prompt("Custom role key (lowercase slug)");
    if (!key) return;
    const name = window.prompt("Role name") ?? key;
    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, name, permissions: {} }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error((data.errors ?? ["Could not create role."]).join(" "));
      setNotice("Custom role created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create role.");
    }
  }

  async function toggleRole(role: RoleRecord) {
    try {
      const response = await fetch(`/api/admin/roles/${encodeURIComponent(role.key)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: role.name, description: role.description, permissions: role.permissions, isActive: !role.is_active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error((data.errors ?? ["Could not update role."]).join(" "));
      setNotice(role.is_active ? "Custom role deactivated." : "Custom role activated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role.");
    }
  }

  async function deleteRole(role: RoleRecord) {
    if (!window.confirm(`Delete custom role ${role.name}? Assigned roles will be rejected by the server.`)) return;
    const response = await fetch(`/api/admin/roles/${encodeURIComponent(role.key)}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError((data.errors ?? ["Could not delete role."]).join(" "));
      return;
    }
    setNotice("Custom role deleted.");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  const summaries = useMemo(() => buildRoleSummaries(staff), [staff]);
  const metrics = useMemo(() => rolesMetrics(staff), [staff]);
  const ownerSummary = summaries.find((summary) => summary.role === ownerRoleKey)!;
  const directory = summaries.filter((summary) => summary.role !== ownerRoleKey);
  const selected = summaries.find((summary) => summary.role === selectedRole) ?? directory[0];
  const selectedStaff = staff.filter((member) => member.role === selected.role);
  const selectedPermissions = groupedRolePermissions(selected.role);
  const comparison = compareRoles(compareA, compareB);

  return (
    <>
      <V2PageHeader
        title="Roles"
        description="Review built-in staff roles, default access, and team usage."
        actions={<Stack direction="row" sx={{ gap: 1 }}>
          <V2Button variant="contained" onClick={createCustomRole}>Create Custom Role</V2Button>
          <V2Button href="/admin-v2/staff" variant="outlined">View Staff</V2Button>
        </Stack>}
      />

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert> : null}

      <V2Card sx={{ mb: 2 }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>Role Management</Typography>
          <V2Button size="small" variant="outlined" onClick={createCustomRole}>Create Role</V2Button>
        </Stack>
        <Stack sx={{ gap: 1 }}>
          {roles.map(role => {
            const assigned = staff.filter(member => member.role === role.key).length;
            return <Stack key={role.key} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{role.name}</Typography>
                <Typography variant="caption" color="text.secondary">{role.key} · {adminPermissionCount(role.permissions)} permissions · {assigned} assigned</Typography>
              </Box>
              <Stack direction="row" sx={{ gap: 0.75, alignItems: "center" }}>
                <Chip size="small" label={role.is_system ? "Protected System Role" : role.is_active ? "Active custom role" : "Disabled custom role"} color={role.is_system ? "default" : role.is_active ? "success" : "warning"} />
                {!role.is_system ? <V2Button size="small" variant="outlined" onClick={() => toggleRole(role)}>{role.is_active ? "Deactivate" : "Activate"}</V2Button> : null}
                {!role.is_system ? <V2Button size="small" variant="outlined" onClick={() => deleteRole(role)}>Delete</V2Button> : null}
              </Stack>
            </Stack>;
          })}
        </Stack>
      </V2Card>

      <V2Card sx={{ mb: 2 }}>
        <Stack direction="row" sx={{ gap: 0, flexWrap: "nowrap" }}>
          {([
            ["Built-in Roles", metrics.builtInRoles],
            ["Active Staff", metrics.activeStaff],
            ["Privileged Roles", metrics.privilegedRoles],
            ["Unknown Roles", metrics.unknownRoleCount],
          ] as Array<[string, number]>).map(([label, value], index) => (
            <Box
              key={label}
              sx={{
                flex: 1,
                minWidth: 0,
                px: index ? 2.5 : 0,
                borderLeft: index ? 1 : 0,
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 800 }}>
                {label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 950 }}>{value}</Typography>
            </Box>
          ))}
        </Stack>
      </V2Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.1fr) minmax(23rem, 0.9fr)" }, gap: 2 }}>
        <Stack sx={{ gap: 2 }}>
          <V2Card>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>Role directory</Typography>
                <Typography variant="body2" color="text.secondary">Built-in governance roles sourced from the existing permission system.</Typography>
              </Box>
              <V2Button variant="outlined" startIcon={<RefreshCw size={15} />} disabled={loading} onClick={() => { void load(); }}>Refresh</V2Button>
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
              {directory.map((summary) => (
                <RoleCard
                  key={summary.role}
                  summary={summary}
                  selected={selected.role === summary.role}
                  onSelect={() => setSelectedRole(summary.role)}
                />
              ))}
            </Box>
          </V2Card>

          <V2Card>
            <Stack direction={{ xs: "column", md: "row" }} sx={{ gap: 1.5, alignItems: { md: "center" }, justifyContent: "space-between" }}>
              <Stack direction="row" sx={{ gap: 1.25, alignItems: "center" }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "rgba(124,77,255,0.1)", color: "primary.main" }}>
                  <LockKeyhole size={21} />
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Protected System Role</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 950 }}>{ownerSummary.label}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap" }}>
                <Chip size="small" color="primary" label="Protected" sx={{ fontWeight: 850 }} />
                <Chip size="small" label="Full access" sx={{ fontWeight: 850 }} />
                <Chip size="small" label={`${ownerSummary.permissionCount} permissions`} sx={{ fontWeight: 850 }} />
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Owner access is controlled by the existing environment/admin authentication and is not created or edited from this workspace.
            </Typography>
          </V2Card>

          <RoleComparisonCard
            roleA={compareA}
            roleB={compareB}
            onRoleA={setCompareA}
            onRoleB={setCompareB}
            shared={comparison.shared}
            onlyA={comparison.onlyA}
            onlyB={comparison.onlyB}
          />
        </Stack>

        <V2Card sx={{ alignSelf: "start", position: { xl: "sticky" }, top: { xl: 88 } }}>
          <RoleDetail summary={selected} staff={selectedStaff} groupedPermissions={selectedPermissions} />
        </V2Card>
      </Box>
    </>
  );
}

function RoleCard({ summary, selected, onSelect }: { summary: RoleSummary; selected: boolean; onSelect: () => void }) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      sx={{
        border: 1,
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 3,
        p: 1.75,
        cursor: "pointer",
        bgcolor: selected ? "rgba(124,77,255,0.07)" : "background.paper",
        transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: "0 16px 38px rgba(35, 22, 80, 0.12)",
          transform: "translateY(-1px)",
        },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 },
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1.5, alignItems: "flex-start" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>{summary.label}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>{summary.role}</Typography>
        </Box>
        <Chip size="small" label={accessLabel(summary)} color={summary.accessLevel === "privileged" ? "primary" : "default"} sx={{ fontWeight: 850 }} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2, minHeight: 42 }}>
        {summary.purpose}
      </Typography>
      <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", mt: 1.5 }}>
        <Chip size="small" icon={<UsersRound size={14} />} label={`${summary.assignedStaff} assigned`} sx={{ fontWeight: 800 }} />
        <Chip size="small" label={`${summary.activeStaff} active`} sx={{ fontWeight: 800 }} />
        <Chip size="small" label={`${summary.permissionCount} defaults`} sx={{ fontWeight: 800 }} />
      </Stack>
    </Box>
  );
}

function RoleDetail({
  summary,
  staff,
  groupedPermissions,
}: {
  summary: RoleSummary;
  staff: AdminStaffRecord[];
  groupedPermissions: ReturnType<typeof groupedRolePermissions>;
}) {
  return (
    <Stack sx={{ gap: 2 }}>
      <Box>
        <Typography variant="overline" color="text.secondary">Overview</Typography>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 950 }}>{summary.label}</Typography>
            <Typography variant="body2" color="text.secondary">{summary.role}</Typography>
          </Box>
          <Chip size="small" label="Built-in" sx={{ fontWeight: 850 }} />
        </Stack>
      </Box>

      <Stack sx={{ gap: 0.75 }}>
        <DetailLine label="Role type" value={summary.protected ? "Protected system" : "Built-in"} />
        <DetailLine label="Assigned staff" value={String(summary.assignedStaff)} />
        <DetailLine label="Active staff" value={String(summary.activeStaff)} />
        <DetailLine label="Default access" value={`${summary.permissionCount} permissions`} />
        <DetailLine label="Access level" value={accessLabel(summary)} />
      </Stack>

      <Divider />

      <Box>
        <Typography variant="overline" color="text.secondary">Default access</Typography>
        <Stack sx={{ gap: 1 }}>
          {groupedPermissions.map((group) => (
            <Box key={group.title} sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.25 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1, mb: 0.75 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>{group.title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>
                  {group.permissions.filter((item) => item.enabled).length}/{group.permissions.length}
                </Typography>
              </Stack>
              <Stack sx={{ gap: 0.4 }}>
                {group.permissions.map(({ permission, enabled }) => (
                  <Stack key={permission} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Typography variant="caption" color={enabled ? "text.primary" : "text.secondary"} sx={{ fontWeight: enabled ? 800 : 600 }}>
                      {permissionLabels[permission]}
                    </Typography>
                    {enabled ? <CheckCircle2 size={15} color="#2e7d32" /> : <XCircle size={15} color="#9aa0aa" />}
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="overline" color="text.secondary">Assigned staff</Typography>
          <V2Button href={summary.role === "owner" ? "/admin-v2/staff" : `/admin-v2/staff?role=${summary.role}`} size="small" variant="outlined">
            View Staff
          </V2Button>
        </Stack>
        <Stack sx={{ gap: 0.85, mt: 1 }}>
          {staff.map((member) => (
            <Box key={member.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.1 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>{member.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {staffIdentity(member)}
                  </Typography>
                </Box>
                <Chip size="small" color={member.isActive ? "success" : "default"} label={member.isActive ? "Active" : "Inactive"} />
              </Stack>
              <Typography variant="caption" color="text.secondary">Last login: {dateLabel(member.lastLoginAt)}</Typography>
            </Box>
          ))}
          {!staff.length ? (
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.4, textAlign: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 850 }}>No staff assigned</Typography>
              <Typography variant="caption" color="text.secondary">Real staff assigned to this role will appear here.</Typography>
            </Box>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );
}

function RoleComparisonCard({
  roleA,
  roleB,
  onRoleA,
  onRoleB,
  shared,
  onlyA,
  onlyB,
}: {
  roleA: AdminRole;
  roleB: AdminRole;
  onRoleA: (role: AdminRole) => void;
  onRoleB: (role: AdminRole) => void;
  shared: AdminPermission[];
  onlyA: AdminPermission[];
  onlyB: AdminPermission[];
}) {
  return (
    <V2Card>
      <Stack direction={{ xs: "column", md: "row" }} sx={{ gap: 1.5, alignItems: { md: "center" }, justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
            <GitCompareArrows size={18} />
            <Typography variant="h6" sx={{ fontWeight: 950 }}>Compare roles</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">Compare default permissions from the existing role definitions.</Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
          <TextField select size="small" label="Role A" value={roleA} onChange={(event) => onRoleA(event.target.value as AdminRole)} sx={{ minWidth: 160 }}>
            {comparableRoles.map((role) => <MenuItem key={role} value={role}>{roleLabels[role]}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Role B" value={roleB} onChange={(event) => onRoleB(event.target.value as AdminRole)} sx={{ minWidth: 160 }}>
            {comparableRoles.map((role) => <MenuItem key={role} value={role}>{roleLabels[role]}</MenuItem>)}
          </TextField>
        </Stack>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: 1.25 }}>
        <PermissionSet title="Shared access" permissions={shared} tone="shared" />
        <PermissionSet title={`Only ${roleLabels[roleA]}`} permissions={onlyA} tone="a" />
        <PermissionSet title={`Only ${roleLabels[roleB]}`} permissions={onlyB} tone="b" />
      </Box>
    </V2Card>
  );
}

function PermissionSet({ title, permissions, tone }: { title: string; permissions: AdminPermission[]; tone: "shared" | "a" | "b" }) {
  const color = tone === "shared" ? "rgba(46,125,50,0.08)" : tone === "a" ? "rgba(124,77,255,0.08)" : "rgba(2,136,209,0.08)";
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.25, bgcolor: color }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 0.75 }}>{title}</Typography>
      <Stack sx={{ gap: 0.55 }}>
        {permissions.map((permission) => (
          <Typography key={permission} variant="caption" sx={{ fontWeight: 800 }}>
            {permissionLabels[permission]}
          </Typography>
        ))}
        {!permissions.length ? <Typography variant="caption" color="text.secondary">No unique permissions.</Typography> : null}
      </Stack>
    </Box>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>{label}</Typography>
      <Typography variant="caption" sx={{ fontWeight: 850, textAlign: "right" }}>{value}</Typography>
    </Stack>
  );
}
