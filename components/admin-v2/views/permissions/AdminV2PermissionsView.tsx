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
import { CheckCircle2, ChevronDown, KeyRound, RefreshCw, ShieldCheck, SlidersHorizontal, XCircle } from "lucide-react";
import {
  adminPermissionKeys,
  permissionGroups,
  permissionLabels,
  roleLabels,
  type AdminPermission,
} from "@/app/lib/admin-permissions";
import type { AdminStaffRecord } from "@/app/lib/admin-staff";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2SearchField } from "@/components/admin-v2/shared/V2SearchField";
import {
  buildPermissionMatrix,
  effectiveStaffAccess,
  permissionsMetrics,
  permissionRoleOrder,
  queryPermissionRows,
  roleCoverage,
  staffPermissionOverrides,
  type PermissionGrantFilter,
  type PermissionMatrixRow,
  type StaffPermissionOverride,
} from "@/lib/admin-v2/permissions/permissions-query";

type StaffPayload = {
  staff?: AdminStaffRecord[];
  errors?: string[];
};

type ViewMode = "matrix" | "overrides";

const groupFilters = ["all", ...permissionGroups.map((group) => group.title)] as const;
const firstPermissionGroup = permissionGroups[0]?.title ?? "Orders";
const grantFilters: Array<[PermissionGrantFilter, string]> = [
  ["all", "All access"],
  ["any", "Granted to any role"],
  ["normal_none", "Owner-only / none"],
  ["wide", "Widely granted"],
];

async function readStaff(): Promise<AdminStaffRecord[]> {
  const response = await fetch("/api/admin/staff", { cache: "no-store" });
  const data = (await response.json()) as StaffPayload;
  if (!response.ok) throw new Error((data.errors ?? ["Staff access data unavailable."]).join(" "));
  return data.staff ?? [];
}

function statusColor(value: boolean) {
  return value ? "success" : "default";
}

function staffIdentity(member: AdminStaffRecord) {
  return `@${member.username}${member.email ? ` · ${member.email}` : " · No email"}`;
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

export function AdminV2PermissionsView() {
  const [staff, setStaff] = useState<AdminStaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof groupFilters)[number]>("all");
  const [grantFilter, setGrantFilter] = useState<PermissionGrantFilter>("all");
  const [selectedPermission, setSelectedPermission] = useState<AdminPermission>("dashboard.view");
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    [firstPermissionGroup]: true,
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      setStaff(await readStaff());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Staff access data unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const matrix = useMemo(() => buildPermissionMatrix(), []);
  const filteredRows = useMemo(
    () => queryPermissionRows(matrix, query, group, grantFilter),
    [matrix, query, group, grantFilter]
  );
  const metrics = useMemo(() => permissionsMetrics(staff), [staff]);
  const coverage = useMemo(() => roleCoverage(), []);
  const overrides = useMemo(() => staffPermissionOverrides(staff), [staff]);
  const selectedRow = matrix.find((row) => row.permission === selectedPermission) ?? matrix[0];
  const selectedStaffAccess = useMemo(
    () => effectiveStaffAccess(staff, selectedRow.permission),
    [staff, selectedRow.permission]
  );

  return (
    <>
      <V2PageHeader
        title="Permissions"
        description="Review role defaults, effective staff access, and permission coverage."
        actions={<V2Button href="/admin-v2/staff" variant="outlined">Manage Staff Access</V2Button>}
      />

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <V2Card sx={{ mb: 2 }}>
        <Stack direction="row" sx={{ gap: 0, flexWrap: "nowrap" }}>
          {([
            ["Total Permissions", metrics.totalPermissions],
            ["Permission Groups", metrics.permissionGroups],
            ["Built-in Roles", metrics.builtInRoles],
            ["Staff Overrides", metrics.staffOverrides],
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

      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mb: 2 }}>
        <V2Button variant={viewMode === "matrix" ? "contained" : "outlined"} startIcon={<KeyRound size={15} />} onClick={() => setViewMode("matrix")}>
          Permission Matrix
        </V2Button>
        <V2Button variant={viewMode === "overrides" ? "contained" : "outlined"} startIcon={<SlidersHorizontal size={15} />} onClick={() => setViewMode("overrides")}>
          Staff Overrides
        </V2Button>
        <V2Button variant="outlined" startIcon={<RefreshCw size={15} />} disabled={loading} onClick={() => { void load(); }} sx={{ ml: { md: "auto" } }}>
          Refresh
        </V2Button>
      </Stack>

      {viewMode === "matrix" ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.14fr) minmax(22rem, 0.86fr)" }, gap: 2 }}>
          <Stack sx={{ gap: 2 }}>
            <V2Card>
              <RoleCoverageCompact coverage={coverage} />

              <Stack direction={{ xs: "column", lg: "row" }} sx={{ gap: 1, alignItems: { lg: "center" }, mb: 1.5 }}>
                <Box component="form" onSubmit={(event) => event.preventDefault()} sx={{ minWidth: { lg: 320 } }}>
                  <V2SearchField
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search permission label or key"
                    slotProps={{ htmlInput: { "aria-label": "Search permissions" } }}
                    sx={{ width: "100%" }}
                  />
                </Box>
                <TextField select size="small" label="Group" value={group} onChange={(event) => setGroup(event.target.value as (typeof groupFilters)[number])} sx={{ minWidth: 180 }}>
                  {groupFilters.map((value) => <MenuItem key={value} value={value}>{value === "all" ? "All Groups" : value}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Coverage" value={grantFilter} onChange={(event) => setGrantFilter(event.target.value as PermissionGrantFilter)} sx={{ minWidth: 200 }}>
                  {grantFilters.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </TextField>
                <Typography variant="body2" color="text.secondary" sx={{ ml: { lg: "auto" } }}>{filteredRows.length} permissions</Typography>
              </Stack>

              <PermissionMatrix
                rows={filteredRows}
                allRows={matrix}
                query={query}
                group={group}
                expandedGroups={expandedGroups}
                onToggleGroup={(groupName) => setExpandedGroups((current) => ({ ...current, [groupName]: !current[groupName] }))}
                selectedPermission={selectedRow.permission}
                onSelect={(permission) => setSelectedPermission(permission)}
              />
            </V2Card>
          </Stack>

          <V2Card sx={{ alignSelf: "start", position: { lg: "sticky" }, top: { lg: 88 } }}>
            <PermissionDetail row={selectedRow} staffAccess={selectedStaffAccess} />
          </V2Card>
        </Box>
      ) : (
        <StaffOverridesView overrides={overrides} />
      )}
    </>
  );
}

function RoleCoverageCompact({
  coverage,
}: {
  coverage: ReturnType<typeof roleCoverage>;
}) {
  return (
    <Box sx={{ mb: 1.5, border: 1, borderColor: "divider", borderRadius: 2.5, overflow: "hidden", bgcolor: "rgba(124,77,255,0.035)" }}>
      <Stack direction={{ xs: "column", md: "row" }} sx={{ gap: 0 }}>
        {coverage.map((item, index) => (
          <Box
            key={item.role}
            sx={{
              flex: 1,
              minWidth: 0,
              px: 1.35,
              py: 1,
              borderLeft: { xs: 0, md: index ? 1 : 0 },
              borderTop: { xs: index ? 1 : 0, md: 0 },
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 900, lineHeight: 1.2, textTransform: "uppercase" }}>
              {item.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 950 }}>{item.count} / {item.total}</Typography>
          </Box>
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1.35, py: 0.7, borderTop: 1, borderColor: "divider" }}>
        Owner access is controlled by the protected admin authentication path and is always full access.
      </Typography>
    </Box>
  );
}

function PermissionMatrix({
  rows,
  allRows,
  query,
  group,
  expandedGroups,
  onToggleGroup,
  selectedPermission,
  onSelect,
}: {
  rows: PermissionMatrixRow[];
  allRows: PermissionMatrixRow[];
  query: string;
  group: string;
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (groupName: string) => void;
  selectedPermission: AdminPermission;
  onSelect: (permission: AdminPermission) => void;
}) {
  const configuredGroups = permissionGroups.map((permissionGroup) => permissionGroup.title);
  const displayGroups = allRows.some((row) => !configuredGroups.includes(row.group))
    ? [...configuredGroups, "Other"]
    : configuredGroups;
  const groupedRows = displayGroups
    .map((groupName) => ({
      groupName,
      rows: rows.filter((row) => row.group === groupName),
      totalRows: allRows.filter((row) => row.group === groupName),
    }))
    .filter((item) => item.rows.length > 0);
  const forceOpen = query.trim().length > 0 || group !== "all";

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 980 }}>
          <PermissionMatrixHeader />
          <Stack sx={{ gap: 0 }}>
            {groupedRows.map((item, index) => {
              const open = forceOpen || expandedGroups[item.groupName] === true;
              return (
                <PermissionGroupSection
                  key={item.groupName}
                  groupName={item.groupName}
                  rows={item.rows}
                  totalRows={item.totalRows.length}
                  open={open}
                  selectedPermission={selectedPermission}
                  onToggle={() => onToggleGroup(item.groupName)}
                  onSelect={onSelect}
                  forceOpen={forceOpen}
                  first={index === 0}
                />
              );
            })}
          </Stack>
          {!rows.length ? (
            <Box sx={{ py: 7, textAlign: "center" }}>
              <Typography variant="h6">No permissions found</Typography>
              <Typography color="text.secondary">Try a different search, group, or coverage filter.</Typography>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function PermissionMatrixHeader() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(18rem, 1.55fr) repeat(6, minmax(6.5rem, 0.72fr))",
        gap: 1,
        px: 1.25,
        py: 0.8,
        bgcolor: "rgba(124,77,255,0.055)",
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: "uppercase" }}>Permission</Typography>
      {permissionRoleOrder.map((role) => (
        <Typography key={role} variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: "uppercase", textAlign: "center" }}>
          {roleLabels[role]}
        </Typography>
      ))}
    </Box>
  );
}

function PermissionGroupSection({
  groupName,
  rows,
  totalRows,
  open,
  forceOpen,
  first,
  selectedPermission,
  onToggle,
  onSelect,
}: {
  groupName: string;
  rows: PermissionMatrixRow[];
  totalRows: number;
  open: boolean;
  forceOpen: boolean;
  first: boolean;
  selectedPermission: AdminPermission;
  onToggle: () => void;
  onSelect: (permission: AdminPermission) => void;
}) {
  const normalRoleTotal = permissionRoleOrder.length - 1;
  const normalRoleGrants = rows.reduce((sum, row) => sum + row.normalGrantCount, 0);
  const maxNormalRoleGrants = rows.length * normalRoleTotal;

  return (
    <Box sx={{ borderTop: first ? 0 : 1, borderColor: "divider" }}>
      <Box
        component="button"
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        disabled={forceOpen}
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(18rem, 1.55fr) repeat(6, minmax(6.5rem, 0.72fr))",
          gap: 1,
          alignItems: "center",
          px: 1.25,
          py: 0.85,
          border: 0,
          borderRadius: 0,
          cursor: forceOpen ? "default" : "pointer",
          color: "text.primary",
          bgcolor: open ? "rgba(124,77,255,0.055)" : "rgba(17,24,39,0.018)",
          textAlign: "left",
          "&:hover": { bgcolor: "rgba(124,77,255,0.07)" },
          "&:disabled": { color: "text.primary" },
          "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0 }}>
          <ChevronDown
            size={16}
            style={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 140ms ease",
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 950 }}>{groupName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {rows.length}{rows.length === totalRows ? "" : ` of ${totalRows}`} permissions
            </Typography>
          </Box>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ gridColumn: "span 6", textAlign: "right", fontWeight: 850 }}>
          {normalRoleGrants} / {maxNormalRoleGrants} non-owner role grants
        </Typography>
      </Box>
      {open ? rows.map((row) => (
        <PermissionMatrixRowItem
          key={row.permission}
          row={row}
          selected={selectedPermission === row.permission}
          onSelect={() => onSelect(row.permission)}
        />
      )) : null}
    </Box>
  );
}

function PermissionMatrixRowItem({
  row,
  selected,
  onSelect,
}: {
  row: PermissionMatrixRow;
  selected: boolean;
  onSelect: () => void;
}) {
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
        display: "grid",
        gridTemplateColumns: "minmax(18rem, 1.55fr) repeat(6, minmax(6.5rem, 0.72fr))",
        gap: 1,
        px: 1.25,
        py: 0.85,
        alignItems: "center",
        borderTop: 1,
        borderColor: "divider",
        cursor: "pointer",
        bgcolor: selected ? "rgba(124,77,255,0.075)" : "transparent",
        "&:hover": { bgcolor: "rgba(124,77,255,0.045)" },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 900, lineHeight: 1.25 }}>{row.label}</Typography>
        <Typography variant="caption" color="text.secondary">{row.permission}</Typography>
      </Box>
      {permissionRoleOrder.map((role) => (
        <Box key={role} sx={{ display: "flex", justifyContent: "center" }}>
          <GrantChip granted={row.grants[role]} label={role === "owner" ? "Full" : row.grants[role] ? "Yes" : "No"} />
        </Box>
      ))}
    </Box>
  );
}

function PermissionDetail({
  row,
  staffAccess,
}: {
  row: PermissionMatrixRow;
  staffAccess: ReturnType<typeof effectiveStaffAccess>;
}) {
  return (
    <Stack sx={{ gap: 2 }}>
      <Box>
        <Typography variant="overline" color="text.secondary">Overview</Typography>
        <Typography variant="h5" sx={{ fontWeight: 950 }}>{row.label}</Typography>
        <Typography variant="body2" color="text.secondary">{row.permission}</Typography>
        <Chip size="small" label={row.group} sx={{ mt: 1, fontWeight: 850 }} />
      </Box>

      <Divider />

      <Box>
        <Typography variant="overline" color="text.secondary">Default role access</Typography>
        <Stack sx={{ gap: 0.75, mt: 0.75 }}>
          {permissionRoleOrder.map((role) => (
            <Stack key={role} direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 850 }}>{roleLabels[role]}</Typography>
              <GrantChip granted={row.grants[role]} label={role === "owner" ? "Full access" : row.grants[role] ? "Yes" : "No"} />
            </Stack>
          ))}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography variant="overline" color="text.secondary">Real staff access</Typography>
        <Stack sx={{ gap: 0.85, mt: 0.75 }}>
          {staffAccess.map((access) => (
            <Box key={access.staff.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.1 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>{access.staff.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {staffIdentity(access.staff)}
                  </Typography>
                </Box>
                <Chip size="small" color={statusColor(access.staff.isActive)} label={access.staff.isActive ? "Active" : "Inactive"} />
              </Stack>
              <Stack direction="row" sx={{ gap: 0.7, flexWrap: "wrap", mt: 0.9 }}>
                <Chip size="small" label={roleLabels[access.staff.role]} sx={{ fontWeight: 800 }} />
                <GrantChip granted={access.granted} label={access.granted ? "Granted" : "Not granted"} />
                <Chip size="small" color={access.override ? "warning" : "default"} label={access.override ? "Custom override" : "Default"} sx={{ fontWeight: 800 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary">Last login: {dateLabel(access.staff.lastLoginAt)}</Typography>
            </Box>
          ))}
          {!staffAccess.length ? (
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.4, textAlign: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 850 }}>No staff records available</Typography>
              <Typography variant="caption" color="text.secondary">Real staff access will appear when staff data is available.</Typography>
            </Box>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );
}

function StaffOverridesView({ overrides }: { overrides: StaffPermissionOverride[] }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function saveOverride(staffId: string, permission: AdminPermission, value: "inherit" | "allow" | "deny") {
    setMessage("");
    setError("");
    const overridesPayload = value === "inherit" ? { [permission]: null } : { [permission]: value === "allow" };
    const response = await fetch(`/api/admin/staff/${encodeURIComponent(staffId)}/permissions`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ overrides: overridesPayload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError((data.errors ?? ["Permission override was rejected."]).join(" "));
      return;
    }
    setMessage("Permission override saved. Refresh to view the updated effective access.");
  }
  return (
    <V2Card>
      <Stack direction={{ xs: "column", md: "row" }} sx={{ gap: 1.5, alignItems: { md: "center" }, justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>Staff Overrides</Typography>
          <Typography variant="body2" color="text.secondary">Accounts whose explicit permission map differs from their built-in role defaults.</Typography>
        </Box>
        <V2Button href="/admin-v2/staff" variant="outlined">Manage Staff Access</V2Button>
      </Stack>
      {message ? <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setMessage("")}>{message}</Alert> : null}
      {error ? <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError("")}>{error}</Alert> : null}

      <Stack sx={{ gap: 1.25 }}>
        {overrides.map((override) => (
          <Box key={override.staff.id} sx={{ border: 1, borderColor: "divider", borderRadius: 3, p: 1.5 }}>
            <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", gap: 1.5 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>{override.staff.name}</Typography>
                <Typography variant="body2" color="text.secondary">{staffIdentity(override.staff)}</Typography>
                <Stack direction="row" sx={{ gap: 0.7, flexWrap: "wrap", mt: 0.85 }}>
                  <Chip size="small" label={roleLabels[override.staff.role]} sx={{ fontWeight: 850 }} />
                  <Chip size="small" color={statusColor(override.staff.isActive)} label={override.staff.isActive ? "Active" : "Inactive"} sx={{ fontWeight: 850 }} />
                  <Chip size="small" color="warning" label={`${override.differenceCount} custom differences`} sx={{ fontWeight: 850 }} />
                </Stack>
              </Box>
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.25, mt: 1.4 }}>
              <OverrideList title="Granted beyond default" permissions={override.grantedBeyondDefault} positive />
              <OverrideList title="Removed from default" permissions={override.removedFromDefault} />
            </Box>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mt: 1.4 }}>
              <TextField select size="small" label="Permission" defaultValue="dashboard.view" sx={{ minWidth: 220 }}>
                {adminPermissionKeys.map(permission => <MenuItem key={permission} value={permission}>{permissionLabels[permission]}</MenuItem>)}
              </TextField>
              <V2Button size="small" variant="outlined" onClick={(event) => {
                const root = event.currentTarget.parentElement;
                const input = root?.querySelector("input") as HTMLInputElement | null;
                const permission = (input?.value || "dashboard.view") as AdminPermission;
                void saveOverride(override.staff.id, permission, "inherit");
              }}>Set Inherit</V2Button>
              <V2Button size="small" variant="outlined" onClick={(event) => {
                const root = event.currentTarget.parentElement;
                const input = root?.querySelector("input") as HTMLInputElement | null;
                const permission = (input?.value || "dashboard.view") as AdminPermission;
                void saveOverride(override.staff.id, permission, "allow");
              }}>Allow</V2Button>
              <V2Button size="small" variant="outlined" onClick={(event) => {
                const root = event.currentTarget.parentElement;
                const input = root?.querySelector("input") as HTMLInputElement | null;
                const permission = (input?.value || "dashboard.view") as AdminPermission;
                void saveOverride(override.staff.id, permission, "deny");
              }}>Deny</V2Button>
            </Stack>
          </Box>
        ))}
        {!overrides.length ? (
          <Box sx={{ py: 8, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 3 }}>
            <ShieldCheck size={30} />
            <Typography variant="h6" sx={{ mt: 1, fontWeight: 950 }}>No custom staff overrides</Typography>
            <Typography color="text.secondary">Current staff permissions match their built-in role defaults.</Typography>
          </Box>
        ) : null}
      </Stack>
    </V2Card>
  );
}

function OverrideList({ title, permissions, positive }: { title: string; permissions: AdminPermission[]; positive?: boolean }) {
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.25, bgcolor: positive ? "rgba(46,125,50,0.06)" : "rgba(237,108,2,0.06)" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 0.75 }}>{title}</Typography>
      <Stack sx={{ gap: 0.55 }}>
        {permissions.map((permission) => (
          <Typography key={permission} variant="caption" sx={{ fontWeight: 800 }}>
            {permissionLabels[permission]}
          </Typography>
        ))}
        {!permissions.length ? <Typography variant="caption" color="text.secondary">None</Typography> : null}
      </Stack>
    </Box>
  );
}

function GrantChip({ granted, label }: { granted: boolean; label: string }) {
  return (
    <Chip
      size="small"
      icon={granted ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      color={granted ? "success" : "default"}
      label={label}
      sx={{ fontWeight: 850, minWidth: 72 }}
    />
  );
}
