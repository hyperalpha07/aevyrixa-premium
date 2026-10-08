"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Alert,
  Box,
  Chip,
  ClickAwayListener,
  Drawer,
  List,
  ListItemButton,
  Paper,
  Popper,
  Stack,
  Typography,
} from "@mui/material";
import { AlertTriangle, FileSearch, RefreshCw, ShieldCheck } from "lucide-react";
import type { StaffActivityLog } from "@/app/lib/admin-staff";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { V2SearchField } from "@/components/admin-v2/shared/V2SearchField";
import {
  actorLabel,
  auditFilterOptions,
  auditLogMetrics,
  humanizeAction,
  humanizeTarget,
  isSecurityEvent,
  queryAuditLogs,
  sanitizeMetadata,
  sortAuditLogsNewestFirst,
  summarizeMetadata,
  type AuditLogFilters,
  type AuditLogTimeRange,
} from "@/lib/admin-v2/audit-logs/audit-log-query";

type StaffPayload = {
  logs?: StaffActivityLog[];
  nextCursor?: string | null;
  filters?: { actions: string[]; actors: string[]; targetTypes: string[] };
  errors?: string[];
};

const timeRanges: Array<[AuditLogTimeRange, string]> = [
  ["all", "All time"],
  ["24h", "Last 24 hours"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
];

function dateLabel(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function readAuditLogs(filters: AuditLogFilters, cursor?: string | null): Promise<StaffPayload> {
  const params = new URLSearchParams({
    query: filters.query,
    action: filters.action,
    actor: filters.actor,
    targetType: filters.targetType,
    timeRange: filters.timeRange,
    limit: "50",
  });
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, { cache: "no-store" });
  const data = (await response.json()) as StaffPayload;
  if (!response.ok) throw new Error((data.errors ?? ["Audit logs could not be loaded."]).join(" "));
  return data;
}

function metadataText(metadata: unknown) {
  const summary = summarizeMetadata(metadata);
  return summary || "No additional metadata.";
}

export function AdminV2AuditLogsView() {
  const [logs, setLogs] = useState<StaffActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [serverOptions, setServerOptions] = useState<{ actions: string[]; actors: string[]; targetTypes: string[] }>({ actions: [], actors: [], targetTypes: [] });
  const [filters, setFilters] = useState<AuditLogFilters>({
    query: "",
    action: "all",
    actor: "all",
    targetType: "all",
    timeRange: "all",
  });

  async function load(cursor?: string | null) {
    setLoading(true);
    setError("");
    try {
      const data = await readAuditLogs(filters, cursor);
      const next = sortAuditLogsNewestFirst(data.logs ?? []);
      setLogs((current) => cursor ? [...current, ...next] : next);
      setNextCursor(data.nextCursor ?? null);
      if (data.filters) setServerOptions(data.filters);
      setSelectedId((current) => current || next[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit logs could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [filters.action, filters.actor, filters.targetType, filters.timeRange]);

  const options = useMemo(() => {
    const local = auditFilterOptions(logs);
    return {
      actions: serverOptions.actions.length ? serverOptions.actions : local.actions,
      actors: serverOptions.actors.length ? serverOptions.actors : local.actors,
      targetTypes: serverOptions.targetTypes.length ? serverOptions.targetTypes : local.targetTypes,
    };
  }, [logs, serverOptions]);
  const metrics = useMemo(() => auditLogMetrics(logs), [logs]);
  const filtered = useMemo(() => queryAuditLogs(logs, filters), [logs, filters]);
  const selected = logs.find((log) => log.id === selectedId) ?? null;

  return (
    <Box
      sx={{
        height: { lg: "calc(100dvh - 104px)" },
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: { lg: "hidden" },
      }}
    >
      <V2PageHeader
        title="Audit Logs"
        description="Review administrative activity, security events, and staff changes."
        actions={<Stack direction="row" sx={{ gap: 1 }}><V2Button href="/admin-v2/staff" variant="outlined">View Staff</V2Button><V2Button href={`/api/admin/audit-logs/export?${new URLSearchParams(filters).toString()}`} variant="outlined">Export CSV</V2Button></Stack>}
      />

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <V2Card sx={{ mb: 2, flexShrink: 0 }}>
        <Stack direction="row" sx={{ gap: 0, flexWrap: "nowrap" }}>
          {([
            ["Total Events", metrics.total],
            ["Actors", metrics.actors],
            ["Security Events", metrics.securityEvents],
            ["Recent 24h", metrics.recent24h],
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

      <V2Card
        sx={{
          flex: { lg: 1 },
          minHeight: 0,
          overflow: "hidden",
          "& .MuiCardContent-root": {
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Stack direction={{ xs: "column", xl: "row" }} sx={{ gap: 1, alignItems: { xl: "center" }, mb: 2 }}>
          <Box component="form" onSubmit={(event) => event.preventDefault()} sx={{ minWidth: { xl: 330 } }}>
            <V2SearchField
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder="Search actor, action, target, or metadata"
              slotProps={{ htmlInput: { "aria-label": "Search audit logs" } }}
              sx={{ width: "100%" }}
            />
          </Box>
          <AuditFilterDropdown
            label="Action"
            value={filters.action}
            displayValue={filters.action === "all" ? "All actions" : humanizeAction(filters.action)}
            minWidth={190}
            options={[["all", "All actions"], ...options.actions.map((action) => [action, humanizeAction(action)] as [string, string])]}
            onChange={(action) => setFilters((current) => ({ ...current, action }))}
          />
          <AuditFilterDropdown
            label="Actor"
            value={filters.actor}
            displayValue={filters.actor === "all" ? "All actors" : filters.actor}
            minWidth={180}
            options={[["all", "All actors"], ...options.actors.map((actor) => [actor, actor] as [string, string])]}
            onChange={(actor) => setFilters((current) => ({ ...current, actor }))}
          />
          <AuditFilterDropdown
            label="Target"
            value={filters.targetType}
            displayValue={filters.targetType === "all" ? "All targets" : humanizeAction(filters.targetType)}
            minWidth={160}
            options={[["all", "All targets"], ...options.targetTypes.map((targetType) => [targetType, humanizeAction(targetType)] as [string, string])]}
            onChange={(targetType) => setFilters((current) => ({ ...current, targetType }))}
          />
          <AuditFilterDropdown
            label="Time"
            value={filters.timeRange}
            displayValue={timeRanges.find(([value]) => value === filters.timeRange)?.[1] ?? "All time"}
            minWidth={155}
            options={timeRanges}
            onChange={(timeRange) => setFilters((current) => ({ ...current, timeRange: timeRange as AuditLogTimeRange }))}
          />
          <V2Button variant="outlined" startIcon={<RefreshCw size={15} />} disabled={loading} onClick={() => { void load(); }} sx={{ ml: { xl: "auto" } }}>
            Refresh
          </V2Button>
        </Stack>

        <Box sx={{ flex: 1, minHeight: 0, overflowX: "auto", border: 1, borderColor: "divider", borderRadius: 3 }}>
          <Box sx={{ minWidth: 980, height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "9.5rem minmax(11rem, 1fr) minmax(13rem, 1.2fr) minmax(13rem, 1.2fr) minmax(18rem, 1.7fr)",
                gap: 1,
                px: 1.5,
                py: 1,
                bgcolor: "rgba(124,77,255,0.055)",
                position: "sticky",
                top: 0,
                zIndex: 1,
                flexShrink: 0,
              }}
            >
              {["Time", "Actor", "Action", "Target", "Details"].map((label) => (
                <Typography key={label} variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                  {label}
                </Typography>
              ))}
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {filtered.map((log) => {
                const security = isSecurityEvent(log);
                return (
                  <Box
                    key={log.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(log.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(log.id);
                      }
                    }}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "9.5rem minmax(11rem, 1fr) minmax(13rem, 1.2fr) minmax(13rem, 1.2fr) minmax(18rem, 1.7fr)",
                      gap: 1,
                      px: 1.5,
                      py: 1.1,
                      alignItems: "center",
                      borderTop: 1,
                      borderColor: "divider",
                      cursor: "pointer",
                      bgcolor: selectedId === log.id ? "rgba(124,77,255,0.075)" : security ? "rgba(237,108,2,0.055)" : "transparent",
                      "&:hover": { bgcolor: security ? "rgba(237,108,2,0.075)" : "rgba(124,77,255,0.045)" },
                      "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">{dateLabel(log.createdAt)}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {actorLabel(log)}
                    </Typography>
                    <Stack direction="row" sx={{ alignItems: "center", gap: 0.7, minWidth: 0 }}>
                      {security ? <AlertTriangle size={15} color="#ed6c02" /> : null}
                      <Typography variant="body2" sx={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {humanizeAction(log.action)}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {humanizeTarget(log.targetType, log.targetId)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {metadataText(log.metadata)}
                    </Typography>
                  </Box>
                );
              })}

              {!filtered.length ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <FileSearch size={30} />
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 950 }}>{logs.length ? "No audit logs match" : "No audit logs found"}</Typography>
                  <Typography color="text.secondary">{logs.length ? "Try another search or filter." : "Real administrative activity will appear here."}</Typography>
                </Box>
              ) : null}
              {nextCursor ? <Box sx={{ py: 1.5, textAlign: "center", borderTop: 1, borderColor: "divider" }}><V2Button variant="outlined" loading={loading} onClick={() => { void load(nextCursor); }}>Load More</V2Button></Box> : null}
            </Box>
            </Box>
          </Box>
      </V2Card>

      <AuditLogDrawer log={selected} onClose={() => setSelectedId("")} />
    </Box>
  );
}

function AuditFilterDropdown({
  label,
  value,
  displayValue,
  options,
  minWidth,
  onChange,
}: {
  label: string;
  value: string;
  displayValue: string;
  options: Array<readonly [string, string]>;
  minWidth: number;
  onChange: (value: string) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  function selectValue(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLDivElement>, nextValue: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectValue(nextValue);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ minWidth, position: "relative" }}>
        <Box
          component="button"
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${label} filter`}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleTriggerKeyDown}
          sx={(theme) => ({
            width: "100%",
            minHeight: 40,
            border: "1px solid",
            borderColor: open ? "primary.main" : "rgba(99, 99, 99, 0.72)",
            borderRadius: "8px",
            bgcolor: "action.hover",
            color: "text.primary",
            px: 1.5,
            py: 0.65,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: 1,
            textAlign: "left",
            cursor: "pointer",
            boxShadow: open ? `0 0 0 3px ${theme.palette.primary.main}1f` : "none",
            "&:hover": { borderColor: "text.primary" },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
          })}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.05 }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.35 }}>
              {displayValue}
            </Typography>
          </Box>
          <Typography aria-hidden="true" sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1 }}>
            ▾
          </Typography>
        </Box>

        <Popper
          open={open}
          anchorEl={triggerRef.current}
          placement="bottom-start"
          popperOptions={{
            strategy: "fixed",
            modifiers: [
              { name: "offset", options: { offset: [0, 4] } },
              { name: "preventOverflow", options: { padding: 8 } },
            ],
          }}
          sx={{ zIndex: (theme) => theme.zIndex.modal + 1, width: triggerRef.current?.getBoundingClientRect().width ?? minWidth }}
        >
          <Paper
            elevation={8}
            sx={{
              mt: 0,
              width: "100%",
              maxHeight: 320,
              overflowY: "auto",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <List dense role="listbox" aria-label={`${label} options`} sx={{ py: 0.5 }}>
              {options.map(([optionValue, optionLabel]) => (
                <ListItemButton
                  key={optionValue}
                  role="option"
                  selected={optionValue === value}
                  onClick={() => selectValue(optionValue)}
                  onKeyDown={(event) => handleOptionKeyDown(event, optionValue)}
                  sx={{ minHeight: 34 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: optionValue === value ? 850 : 500 }}>
                    {optionLabel}
                  </Typography>
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

function AuditLogDrawer({ log, onClose }: { log: StaffActivityLog | null; onClose: () => void }) {
  const sanitized = useMemo(() => sanitizeMetadata(log?.metadata ?? {}), [log]);
  const metadataEntries = useMemo(() => {
    if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) return [];
    return Object.entries(sanitized as Record<string, unknown>);
  }, [sanitized]);

  return (
    <Drawer
      anchor="right"
      open={Boolean(log)}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 460 }, maxWidth: "100%", overflowY: "auto" } } }}
    >
      {log ? (
        <Stack sx={{ p: 3, gap: 2 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Audit event</Typography>
              <Typography variant="h5" sx={{ fontWeight: 950 }}>{humanizeAction(log.action)}</Typography>
              {isSecurityEvent(log) ? <Chip size="small" color="warning" label="Security event" sx={{ mt: 1, fontWeight: 850 }} /> : null}
            </Box>
            <V2Button variant="outlined" size="small" onClick={onClose}>Close</V2Button>
          </Stack>

          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
            {[
              ["Event ID", log.id],
              ["Timestamp", dateLabel(log.createdAt)],
              ["Actor", actorLabel(log)],
              ["Action", log.action || "unknown"],
              ["Target type", log.targetType || "No target type"],
              ["Target ID", log.targetId || "No target ID"],
            ].map(([label, value], index) => (
              <Stack key={label} direction="row" sx={{ justifyContent: "space-between", gap: 2, px: 1.5, py: 1, borderTop: index ? 1 : 0, borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 850 }}>{label}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 850, textAlign: "right", wordBreak: "break-word" }}>{value}</Typography>
              </Stack>
            ))}
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 1 }}>Safe metadata</Typography>
            {metadataEntries.length ? (
              <Stack sx={{ gap: 0.8 }}>
                {metadataEntries.map(([key, value]) => (
                  <Box key={key} sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.15 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 900 }}>{key}</Typography>
                    <Typography component="pre" variant="caption" sx={{ display: "block", m: 0, mt: 0.4, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
                      {typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null
                        ? String(value)
                        : JSON.stringify(value, null, 2)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.4 }}>
                <Typography variant="body2" color="text.secondary">No additional metadata.</Typography>
              </Box>
            )}
          </Box>

          <Stack direction="row" sx={{ gap: 0.7, alignItems: "center", color: "text.secondary" }}>
            <ShieldCheck size={16} />
            <Typography variant="caption">Audit logs are read-only in Admin V2.</Typography>
          </Stack>
        </Stack>
      ) : null}
    </Drawer>
  );
}
