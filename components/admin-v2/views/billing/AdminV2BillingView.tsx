"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Box, Button, Chip, Collapse, Stack, Typography } from "@mui/material";
import {
  Banknote,
  BarChart3,
  ChevronDown,
  Coins,
  Download,
  FileBarChart,
  FileText,
  Receipt,
  RefreshCcw,
  ShieldAlert,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import type { AdminV2BillingModuleCard, AdminV2BillingResult, AdminV2BillingSummaryMetric } from "@/lib/admin-v2/billing/billing-metrics";
import { formatAdminV2Money } from "@/lib/admin-v2/finance/money";

type BillingModuleTitle = AdminV2BillingModuleCard["title"];
type IssueKind = AdminV2BillingResult["reconciliation"]["items"][number]["kind"];
type IssueFilter = "all" | IssueKind;

const moduleIcons = {
  Invoices: FileText,
  Transactions: Receipt,
  Refunds: RefreshCcw,
  Reports: FileBarChart,
  Expenses: Banknote,
} as const;

const moduleDisplayLabels: Record<BillingModuleTitle, string> = {
  Invoices: "Invoices",
  Transactions: "Payments",
  Refunds: "Refunds",
  Reports: "Reports",
  Expenses: "Expenses",
};

const moduleSource = {
  Invoices: "invoices",
  Transactions: "transactions",
  Refunds: "refunds",
  Reports: "analytics",
  Expenses: "expenses",
} as const satisfies Record<BillingModuleTitle, keyof AdminV2BillingResult["sources"]>;

const kpiIcons = {
  "Eligible Order Value": WalletCards,
  "Recorded Payments": Receipt,
  "Known Due": Banknote,
  "Recorded Refunds": RefreshCcw,
  "Recorded Expenses": Coins,
  "Issued Invoices": FileText,
} as const;

const issueLabels = {
  total_mismatch: "Amount mismatch",
  missing_due_snapshot: "Missing due snapshot",
  delivery_status_mismatch: "Delivery mismatch",
  cod_delivered_unpaid: "COD unpaid",
} as const satisfies Record<IssueKind, string>;

const issueFilterOptions: Array<{ value: IssueFilter; label: string }> = [
  { value: "all", label: "All issues" },
  { value: "total_mismatch", label: "Amount" },
  { value: "missing_due_snapshot", label: "Missing due" },
  { value: "delivery_status_mismatch", label: "Delivery" },
  { value: "cod_delivered_unpaid", label: "COD" },
];

const reportCapabilities = ["Sales", "Orders", "Products", "Customers", "Reviews", "Discounts & delivery fees"];

function formatMetric(metric: Pick<AdminV2BillingSummaryMetric, "value" | "kind" | "available" | "displayValue">) {
  if (metric.displayValue) return metric.displayValue;
  if (!metric.available) return "Unavailable";
  if (metric.value === null) return "Available";
  return metric.kind === "currency" ? formatAdminV2Money(metric.value) : metric.value.toLocaleString("en-US");
}

function sourceAlerts(data: AdminV2BillingResult) {
  return Object.entries(data.sources)
    .filter(([, source]) => source.limitation)
    .map(([key, source]) => ({ key, ...source }));
}

function isHighlightedFinancialNotice(message: string) {
  return /differ|RPC|incomplete|missing|cancelled|courier-held|unpaid|unavailable|failed/i.test(message);
}

function FinancialNotices({
  notes,
  sources,
}: {
  notes: string[];
  sources: ReturnType<typeof sourceAlerts>;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const notices = useMemo(() => {
    const combined = [
      ...sources.map((source) => ({
        message: source.limitation,
        severity: source.available ? "warning" as const : "error" as const,
      })),
      ...notes.map((message) => ({
        message,
        severity: isHighlightedFinancialNotice(message) ? "warning" as const : "info" as const,
      })),
    ].filter((notice): notice is { message: string; severity: "error" | "warning" | "info" } => Boolean(notice.message));

    return combined.filter(
      (notice, index) => combined.findIndex((candidate) => candidate.message === notice.message) === index
    );
  }, [notes, sources]);
  const highlightedNotices = notices.filter((notice) => notice.severity !== "info");

  if (notices.length === 0) return null;

  return (
    <Box
      component="section"
      aria-labelledby="billing-financial-notices-title"
      sx={{
        px: { xs: 1.6, md: 2.1 },
        py: { xs: 1.45, md: 1.7 },
        borderTop: "1px solid rgba(255,255,255,0.09)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background:
          "linear-gradient(90deg, rgba(245,158,11,0.075), rgba(255,77,184,0.045) 46%, rgba(49,230,212,0.04))",
      }}
    >
      <Stack spacing={1.2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
        >
          <Stack direction="row" spacing={1.15} sx={{ alignItems: "flex-start", minWidth: 0 }}>
            <Box
              sx={{
                mt: 0.1,
                width: 34,
                height: 34,
                flex: "0 0 auto",
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                color: highlightedNotices.length > 0 ? "rgba(251,191,36,0.96)" : "rgba(49,230,212,0.92)",
                background: highlightedNotices.length > 0 ? "rgba(245,158,11,0.12)" : "rgba(49,230,212,0.10)",
              }}
            >
              <TriangleAlert size={17} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
                <Typography id="billing-financial-notices-title" component="h2" variant="subtitle1" sx={{ color: "rgba(255,255,255,0.96)", fontWeight: 950 }}>
                  Financial notices
                </Typography>
                <Chip
                  size="small"
                  label={`${notices.length} ${notices.length === 1 ? "notice" : "notices"}`}
                  sx={{
                    height: 24,
                    color: highlightedNotices.length > 0 ? "rgba(255,237,213,0.95)" : "rgba(207,250,254,0.92)",
                    borderColor: highlightedNotices.length > 0 ? "rgba(251,191,36,0.30)" : "rgba(49,230,212,0.26)",
                    background: highlightedNotices.length > 0 ? "rgba(245,158,11,0.09)" : "rgba(49,230,212,0.07)",
                    fontWeight: 850,
                  }}
                  variant="outlined"
                />
              </Stack>
              <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: "rgba(226,213,236,0.66)", lineHeight: 1.4 }}>
                Finance guidance and review notes; actionable reconciliation counts remain in the control center above.
              </Typography>
            </Box>
          </Stack>

          <Button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls="billing-financial-notices-details"
            endIcon={
              <ChevronDown
                size={16}
                style={{ transform: detailsOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }}
              />
            }
            sx={{
              minHeight: 32,
              px: 1.15,
              alignSelf: { xs: "flex-start", md: "center" },
              color: "rgba(243,232,250,0.86)",
              fontSize: "0.76rem",
              fontWeight: 900,
              textTransform: "none",
              "&:hover": { background: "rgba(255,255,255,0.05)" },
            }}
          >
            {detailsOpen ? "Hide details" : "Show details"}
          </Button>
        </Stack>

        {!detailsOpen && highlightedNotices.length > 0 ? (
          <Stack component="ul" spacing={0} sx={{ p: 0, m: 0, listStyle: "none" }}>
            {highlightedNotices.slice(0, 2).map((notice) => (
              <Stack
                component="li"
                key={notice.message}
                direction="row"
                spacing={1}
                sx={{ py: 0.75, borderTop: "1px solid rgba(255,255,255,0.065)", alignItems: "flex-start" }}
              >
                <Box sx={{ mt: "0.48rem", width: 5, height: 5, borderRadius: 999, flex: "0 0 auto", bgcolor: notice.severity === "error" ? "#fb7185" : "#fbbf24" }} />
                <Typography variant="body2" sx={{ color: "rgba(247,239,248,0.84)", lineHeight: 1.45 }}>
                  {notice.message}
                </Typography>
              </Stack>
            ))}
            {highlightedNotices.length > 2 ? (
              <Typography component="li" variant="caption" sx={{ py: 0.75, color: "rgba(255,237,213,0.78)" }}>
                +{highlightedNotices.length - 2} additional highlighted notices. Show details to review all guidance.
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        <Collapse in={detailsOpen} timeout={180}>
          <Stack id="billing-financial-notices-details" spacing={0} sx={{ borderTop: highlightedNotices.length > 0 ? "1px solid rgba(255,255,255,0.065)" : 0 }}>
            {notices.map((notice) => (
              <Stack
                key={`${notice.severity}-${notice.message}`}
                direction="row"
                spacing={1}
                sx={{ py: 0.72, borderBottom: "1px solid rgba(255,255,255,0.055)", alignItems: "flex-start" }}
              >
                <Typography variant="caption" sx={{ minWidth: 50, color: notice.severity === "error" ? "rgba(251,113,133,0.90)" : notice.severity === "warning" ? "rgba(251,191,36,0.88)" : "rgba(49,230,212,0.82)", fontWeight: 900, textTransform: "uppercase" }}>
                  {notice.severity}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(226,213,236,0.72)", lineHeight: 1.5 }}>
                  {notice.message}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
    : "Not provided";
}

function GlassSection({
  children,
  ariaLabel,
  sx,
}: {
  children: ReactNode;
  ariaLabel?: string;
  sx?: Record<string, unknown>;
}) {
  return (
    <Box
      aria-label={ariaLabel}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: { xs: 2.5, md: 3 },
        border: 0,
        background:
          "linear-gradient(135deg, rgba(20, 12, 35, 0.56), rgba(12, 11, 29, 0.38) 58%, rgba(7, 25, 38, 0.32))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
        backdropFilter: "blur(14px) saturate(1.12)",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function KpiStrip({ metrics }: { metrics: AdminV2BillingSummaryMetric[] }) {
  return (
    <Box
      aria-label="Finance summary bar"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" },
        overflow: "hidden",
        borderRadius: { xs: 2.5, md: 3 },
        background:
          "linear-gradient(90deg, rgba(24, 12, 39, 0.78), rgba(43, 15, 54, 0.60) 45%, rgba(8, 32, 48, 0.58))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 18px 60px rgba(0,0,0,0.20)",
        backdropFilter: "blur(16px)",
      }}
    >
      {metrics.map((metric, index) => {
        const Icon = kpiIcons[metric.label as keyof typeof kpiIcons] ?? Banknote;
        return (
          <Stack
            key={metric.label}
            spacing={0.8}
            sx={{
              minWidth: 0,
              px: { xs: 1.25, sm: 1.8, md: 2.1 },
              py: { xs: 1.3, md: 1.55 },
              borderTop: { xs: index < 2 ? 0 : "1px solid rgba(255,255,255,0.08)", md: index < 3 ? 0 : "1px solid rgba(255,255,255,0.08)", xl: 0 },
              borderLeft: { xs: index % 2 === 0 ? 0 : "1px solid rgba(255,255,255,0.08)", md: index % 3 === 0 ? 0 : "1px solid rgba(255,255,255,0.08)", xl: index === 0 ? 0 : "1px solid rgba(255,255,255,0.08)" },
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 31,
                  height: 31,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: metric.available ? "rgba(255, 113, 205, 0.96)" : "rgba(251, 191, 36, 0.94)",
                  background: metric.available
                    ? "linear-gradient(135deg, rgba(255,77,184,0.18), rgba(49,230,212,0.10))"
                    : "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(255,77,184,0.08))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
                }}
              >
                <Icon size={15} />
              </Box>
              <Typography variant="caption" sx={{ color: "rgba(239,229,245,0.68)", fontWeight: 850, lineHeight: 1.15 }}>
                {metric.label}
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.98)", fontWeight: 950, lineHeight: 1, letterSpacing: "-0.04em", whiteSpace: "nowrap" }}>
              {formatMetric(metric)}
            </Typography>
            <Typography variant="caption" sx={{ display: { xs: "none", sm: "block" }, color: "rgba(221,207,230,0.58)", lineHeight: 1.35 }}>
              {metric.helper}
            </Typography>
          </Stack>
        );
      })}
    </Box>
  );
}

function TruthfulTrendPanel({ available }: { available: boolean }) {
  return (
    <GlassSection
      ariaLabel="Financial trends unavailable"
      sx={{
        minHeight: 0,
        p: { xs: 1.6, md: 2 },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(255,77,184,0.10), transparent 36%), radial-gradient(circle at 88% 20%, rgba(49,230,212,0.10), transparent 26%)",
          pointerEvents: "none",
        },
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 0.8, md: 2 }} sx={{ position: "relative", zIndex: 1, alignItems: { md: "center" } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: "0 0 auto" }}>
          <BarChart3 size={18} color="rgba(49,230,212,0.84)" />
          <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.96)", fontWeight: 950 }}>
            Financial trends
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: "rgba(236,226,244,0.70)", maxWidth: 900 }}>
          {available
            ? "Real all-time snapshots are available, but a dated finance series is not. No trend line or growth history is inferred."
            : "Finance snapshot sources are unavailable, so Billing cannot present a trend summary. No trend line or growth history is inferred."}
        </Typography>
      </Stack>
    </GlassSection>
  );
}

function LedgerPreview({ data }: { data: AdminV2BillingResult }) {
  return (
    <GlassSection>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.18fr 0.82fr" } }}>
      <Box sx={{ p: { xs: 1.6, md: 2.15 } }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.96)", fontWeight: 950 }}>Recent invoices</Typography>
              <Typography variant="caption" sx={{ color: "rgba(222,208,232,0.64)" }}>Persistent issued invoice snapshots.</Typography>
            </Box>
            <V2Button href="/admin-v2/invoices" size="small" variant="outlined">Open Invoices</V2Button>
          </Stack>
          {!data.sources.invoices.available ? (
            <Alert severity="warning">Invoice data is unavailable. Billing cannot determine whether invoice records are empty.</Alert>
          ) : data.tables.invoices.length === 0 ? (
            <Alert severity="info" sx={{ bgcolor: "rgba(56,189,248,0.10)", color: "rgba(239,248,255,0.92)" }}>No invoice records exist yet.</Alert>
          ) : (
            <Stack component="ul" spacing={0} sx={{ p: 0, m: 0, listStyle: "none" }}>
              {data.tables.invoices.map((invoice) => (
                <Stack
                  component="li"
                  key={invoice.id || invoice.invoiceNumber}
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  sx={{ py: 1.15, borderTop: "1px solid rgba(255,255,255,0.07)", justifyContent: "space-between", gap: 2 }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 900, overflowWrap: "anywhere" }}>{invoice.invoiceNumber}</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(222,208,232,0.62)" }}>{invoice.orderReference} · {formatDate(invoice.issuedAt)}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.96)", fontWeight: 950, whiteSpace: "nowrap" }}>{formatAdminV2Money(invoice.totalAmount, invoice.currencyCode)}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          p: { xs: 1.6, md: 2.15 },
          borderTop: { xs: "1px solid rgba(255,255,255,0.08)", lg: 0 },
          borderLeft: { lg: "1px solid rgba(255,255,255,0.08)" },
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.96)", fontWeight: 950 }}>Payment ledger</Typography>
              <Typography variant="caption" sx={{ color: "rgba(222,208,232,0.64)" }}>Recorded payments only; due is not cash received.</Typography>
            </Box>
            <V2Button href="/admin-v2/transactions" size="small" variant="outlined">Open Transactions</V2Button>
          </Stack>
          {!data.sources.transactions.available ? (
            <Alert severity="warning">Payment ledger data is unavailable. Billing cannot determine whether ledger entries are empty.</Alert>
          ) : data.tables.transactions.length === 0 ? (
            <Alert severity="info" sx={{ bgcolor: "rgba(56,189,248,0.10)", color: "rgba(239,248,255,0.92)" }}>No payment ledger entries exist yet.</Alert>
          ) : (
            <Stack component="ul" spacing={0} sx={{ p: 0, m: 0, listStyle: "none" }}>
              {data.tables.transactions.map((transaction) => (
                <Stack
                  component="li"
                  key={transaction.id || transaction.transactionReference}
                  direction="row"
                  spacing={1}
                  sx={{ py: 1.15, borderTop: "1px solid rgba(255,255,255,0.07)", justifyContent: "space-between", gap: 2 }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 900, overflowWrap: "anywhere" }}>{transaction.transactionReference || "Payment record"}</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(222,208,232,0.62)" }}>{transaction.orderReference} · {transaction.status || "unknown"} · {formatDate(transaction.occurredAt || transaction.recordedAt)}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.96)", fontWeight: 950, whiteSpace: "nowrap" }}>{formatAdminV2Money(transaction.amount, transaction.currencyCode)}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>
      </Box>
    </GlassSection>
  );
}

function ReconciliationWorkspace({ data }: { data: AdminV2BillingResult }) {
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("all");
  const [visibleCount, setVisibleCount] = useState(50);
  const filteredIssues = useMemo(
    () => data.reconciliation.items.filter((issue) => issueFilter === "all" || issue.kind === issueFilter),
    [data.reconciliation.items, issueFilter]
  );
  const counts = [
    { label: "Amount mismatches", value: data.reconciliation.arithmeticMismatchCount },
    { label: "Missing due snapshots", value: data.reconciliation.missingDueSnapshotCount },
    { label: "Delivery mismatches", value: data.reconciliation.deliveryStatusMismatchCount },
    { label: "Delivered COD unpaid", value: data.reconciliation.codDeliveredUnpaidCount },
  ];

  return (
    <GlassSection sx={{ p: { xs: 1.6, md: 2.25 } }}>
      <Stack spacing={1.7}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { md: "flex-start" } }}>
          <Stack direction="row" spacing={1.25}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                color: data.reconciliation.issueCount > 0 ? "rgba(251,191,36,0.96)" : "rgba(74,222,128,0.96)",
                background: "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(49,230,212,0.10))",
              }}
            >
              <ShieldAlert size={19} />
            </Box>
            <Box>
              <Typography component="h2" variant="subtitle1" sx={{ color: "rgba(255,255,255,0.97)", fontWeight: 950 }}>
                Reconciliation control center
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(230,216,238,0.68)", maxWidth: 780 }}>
                Actual order, delivery, COD and invoice exceptions. These are review queues, not automatic financial rewrites.
              </Typography>
            </Box>
          </Stack>
          <V2Button href="/admin-v2/orders" variant="contained" size="small">Open Orders</V2Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
            borderTop: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {counts.map((item, index) => (
            <Box
              key={item.label}
              sx={{
                px: { xs: 0.8, sm: 1.25 },
                py: 1.15,
                borderLeft: { xs: index % 2 === 0 ? 0 : "1px solid rgba(255,255,255,0.07)", lg: index === 0 ? 0 : "1px solid rgba(255,255,255,0.07)" },
                borderTop: { xs: index < 2 ? 0 : "1px solid rgba(255,255,255,0.07)", lg: 0 },
              }}
            >
              <Typography variant="caption" sx={{ color: "rgba(229,218,238,0.66)", fontWeight: 850 }}>{item.label}</Typography>
              <Typography variant="h5" sx={{ color: "rgba(255,255,255,0.98)", fontWeight: 950, letterSpacing: "-0.04em" }}>{item.value.toLocaleString("en-US")}</Typography>
            </Box>
          ))}
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          {issueFilterOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              onClick={() => setIssueFilter(option.value)}
              sx={{
                minHeight: 30,
                px: 1.2,
                borderRadius: 999,
                color: issueFilter === option.value ? "rgba(255,255,255,0.98)" : "rgba(229,218,238,0.72)",
                border: "1px solid",
                borderColor: issueFilter === option.value ? "rgba(255,77,184,0.46)" : "rgba(255,255,255,0.08)",
                background: issueFilter === option.value ? "rgba(255,77,184,0.14)" : "rgba(255,255,255,0.035)",
                fontSize: "0.74rem",
                fontWeight: 850,
              }}
            >
              {option.label}
            </Button>
          ))}
        </Stack>

        {filteredIssues.length === 0 ? (
          <Alert severity={data.reconciliation.items.length === 0 ? "success" : "info"} sx={{ bgcolor: "rgba(34,197,94,0.10)", color: "rgba(236,253,245,0.92)" }}>
            {data.reconciliation.items.length === 0 ? "No open order-level reconciliation exceptions were loaded." : "No issues match the selected filter."}
          </Alert>
        ) : (
          <Stack component="ul" spacing={0} sx={{ p: 0, m: 0, listStyle: "none" }}>
            {filteredIssues.slice(0, visibleCount).map((issue) => (
              <Stack
                component="li"
                key={`${issue.orderReference}-${issue.kind}`}
                direction={{ xs: "column", lg: "row" }}
                spacing={1}
                sx={{ py: 1.25, borderTop: "1px solid rgba(255,255,255,0.07)", justifyContent: "space-between", gap: 2 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 900, overflowWrap: "anywhere" }}>{issue.orderReference}</Typography>
                    <Chip size="small" label={issueLabels[issue.kind]} sx={{ color: "rgba(255,237,213,0.95)", borderColor: "rgba(251,191,36,0.34)", background: "rgba(245,158,11,0.12)" }} variant="outlined" />
                  </Stack>
                  <Typography variant="caption" sx={{ color: "rgba(229,218,238,0.66)" }}>{issue.message}</Typography>
                </Box>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: { xs: "space-between", lg: "flex-end" }, flexWrap: "wrap" }}>
                  <Typography variant="caption" sx={{ color: "rgba(229,218,238,0.62)" }}>
                    {issue.status || "Unknown"} / {issue.deliveryStatus || "no delivery"} / {issue.paymentStatus || "no payment"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.94)", fontWeight: 900 }}>
                    {issue.differenceAmount !== null ? formatAdminV2Money(issue.differenceAmount, issue.currencyCode) : issue.dueAmount !== null ? formatAdminV2Money(issue.dueAmount, issue.currencyCode) : "Review"}
                  </Typography>
                  <V2Button href={`/admin-v2/orders/${encodeURIComponent(issue.orderReference)}`} size="small" variant="text">Review</V2Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
        {filteredIssues.length > visibleCount ? (
          <Button
            type="button"
            onClick={() => setVisibleCount((current) => current + 50)}
            sx={{ alignSelf: "flex-start", color: "rgba(255,113,205,0.96)", textTransform: "none", fontWeight: 850 }}
          >
            Show more ({(filteredIssues.length - visibleCount).toLocaleString("en-US")} remaining)
          </Button>
        ) : null}
      </Stack>
    </GlassSection>
  );
}

function ModulePreview({
  module,
  unavailable,
}: {
  module: AdminV2BillingModuleCard;
  unavailable: boolean;
}) {
  const Icon = moduleIcons[module.title];

  return (
    <Box
      sx={{
        px: { xs: 0.25, md: 0.5 },
        py: { xs: 0.6, md: 0.8 },
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <Stack spacing={1.35}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { md: "flex-start" } }}>
          <Stack direction="row" spacing={1.35} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                color: "rgba(255,113,205,0.95)",
                background: "linear-gradient(135deg, rgba(255,77,184,0.18), rgba(49,230,212,0.10))",
              }}
            >
              <Icon size={20} />
            </Box>
            <Box sx={{ minWidth: 0, maxWidth: 680 }}>
              <Typography component="h3" variant="h6" sx={{ color: "rgba(255,255,255,0.98)", fontWeight: 950, lineHeight: 1.1 }}>
                {moduleDisplayLabels[module.title]}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.65, color: "rgba(230,216,238,0.70)" }}>
                {module.description}
              </Typography>
            </Box>
          </Stack>

          <V2Button href={module.href} variant="contained" size="small" sx={{ minWidth: 148 }}>
            Open full module
          </V2Button>
        </Stack>

        {unavailable ? (
          <Alert severity="warning" sx={{ bgcolor: "rgba(245,158,11,0.12)", color: "rgba(255,247,237,0.92)" }}>
            This Billing preview is unavailable because its underlying source could not be loaded.
          </Alert>
        ) : module.title === "Reports" ? (
          <Stack spacing={1.1} sx={{ maxWidth: 780 }}>
            <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.96)", fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              Analytics summary/export workspace
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(230,216,238,0.70)", maxWidth: 710 }}>
              Sanitized CSV export is available for supported operational report types without creating saved report history or scheduled reports.
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(222,208,232,0.62)", fontWeight: 850, lineHeight: 1.7 }}>
              Supported: {reportCapabilities.join(" · ")}
            </Typography>
          </Stack>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.max(module.figures.length, 1)}, minmax(0, 1fr))` },
              columnGap: { xs: 2, md: 5 },
              rowGap: 2,
              maxWidth: 820,
            }}
          >
            {module.figures.map((figure) => (
              <Box key={figure.label} sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ display: "block", color: "rgba(222,208,232,0.64)", fontWeight: 850, letterSpacing: "0.01em" }}>
                  {figure.label}
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.45, color: "rgba(255,255,255,0.98)", fontWeight: 950, letterSpacing: "-0.045em", lineHeight: 1 }}>
                  {formatMetric(figure)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

export function AdminV2BillingView({ data, mode = "overview" }: { data: AdminV2BillingResult; mode?: "overview" | "diagnostics" }) {
  const isDiagnostics = mode === "diagnostics";
  const alerts = sourceAlerts(data);
  const allFailed = Object.values(data.sources).every((source) => !source.available);
  const [activeModule, setActiveModule] = useState<BillingModuleTitle>(data.modules[0]?.title ?? "Invoices");
  const selectedModule = data.modules.find((module) => module.title === activeModule) ?? data.modules[0];
  const selectedSource = selectedModule ? data.sources[moduleSource[selectedModule.title]] : null;

  return (
    <Box
      component="section"
      aria-labelledby="admin-v2-billing-title"
      className="aev-admin-v2-billing-v3"
      sx={{
        position: "relative",
        overflow: "hidden",
        mx: { xs: -2, md: -3 },
        my: { xs: -2, md: -3 },
        minHeight: "calc(100vh - 96px)",
        px: { xs: 2, md: 3, xl: 4 },
        py: { xs: 2, md: 3, xl: 3.5 },
        color: "rgba(255,255,255,0.94)",
        backgroundColor: "#060717",
        backgroundImage: `
          radial-gradient(circle at 82% 12%, rgba(255,77,184,0.18), transparent 30%),
          radial-gradient(circle at 14% 2%, rgba(49,230,212,0.12), transparent 26%),
          linear-gradient(180deg, rgba(5,7,18,0.40), rgba(5,7,18,0.92))
        `,
        backgroundRepeat: "no-repeat",
        backgroundSize: "auto, auto, auto",
        backgroundPosition: "center, center, center",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(5,7,18,0.86) 0%, rgba(8,8,24,0.50) 38%, rgba(5,7,18,0.28) 100%), radial-gradient(circle at 76% 28%, rgba(255,77,184,0.18), transparent 35%)",
        },
        "& > *": { position: "relative", zIndex: 1 },
      }}
    >
      <Stack spacing={{ xs: 2, lg: 2.35 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { lg: "flex-end" } }}>
          <Box sx={{ maxWidth: 780 }}>
            <Typography variant="overline" sx={{ color: "rgba(49,230,212,0.78)", fontWeight: 950, letterSpacing: "0.18em" }}>
              Admin V2 · {isDiagnostics ? "Finance diagnostics" : "Finance workspace"}
            </Typography>
            <Typography id="admin-v2-billing-title" component="h1" variant="h3" sx={{ mt: 0.5, color: "rgba(255,255,255,0.99)", fontWeight: 950, letterSpacing: "-0.055em", lineHeight: 1 }}>
              {isDiagnostics ? "Finance Diagnostics" : "Billing & Finance"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "rgba(235,224,243,0.72)", maxWidth: 700 }}>
              {isDiagnostics
                ? "Review order reconciliation exceptions and finance source guidance. These are read-only findings, not automatic accounting corrections."
                : "Invoices, payments, refunds, expenses and operational finance in one workspace."}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            {isDiagnostics ? (
              <V2Button href="/admin-v2/billing" variant="outlined">Back to Billing</V2Button>
            ) : (
              <>
                <V2Button href="/admin-v2/invoices" variant="outlined" startIcon={<FileText size={15} />}>Open Invoices</V2Button>
                <V2Button href="/admin-v2/transactions" variant="contained" startIcon={<Receipt size={15} />}>Record Payment</V2Button>
                <V2Button href="/admin-v2/reports" variant="outlined" startIcon={<Download size={15} />}>Export Reports</V2Button>
              </>
            )}
          </Stack>
        </Stack>

        {allFailed ? (
          <Alert severity="error">Finance data is unavailable. Billing does not substitute fake zeroes for failed sources.</Alert>
        ) : null}
        {isDiagnostics ? (
          <>
            <ReconciliationWorkspace data={data} />
            <FinancialNotices notes={data.notes} sources={alerts} />
            <Typography variant="caption" sx={{ color: "rgba(222,208,232,0.70)" }}>
              Existing historical orders are owner-confirmed test records. No per-order test/live designation is persisted; never treat these records as verified sales.
            </Typography>
          </>
        ) : (
          <>
        <KpiStrip metrics={data.summary} />

        <TruthfulTrendPanel available={data.sources.analytics.available} />

        <Box
          role="tablist"
          aria-label="Billing finance modules"
          sx={{
            display: "flex",
            gap: { xs: 2.4, md: 3.5 },
            alignItems: "center",
            overflowX: "auto",
            borderBottom: "1px solid rgba(255,255,255,0.09)",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {data.modules.map((module) => {
            const selected = module.title === activeModule;
            const Icon = moduleIcons[module.title];
            return (
              <Button
                key={module.title}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveModule(module.title)}
                sx={{
                  minWidth: "max-content",
                  minHeight: 42,
                  px: 0,
                  borderRadius: 0,
                  color: selected ? "rgba(255,255,255,0.98)" : "rgba(229,218,238,0.62)",
                  background: "transparent",
                  borderBottom: "2px solid",
                  borderColor: selected ? "rgba(255,77,184,0.92)" : "transparent",
                  fontWeight: selected ? 950 : 800,
                  textTransform: "none",
                  gap: 0.8,
                  "&:hover": { background: "transparent", color: "rgba(255,255,255,0.95)" },
                }}
              >
                <Icon size={15} />
                {moduleDisplayLabels[module.title]}
              </Button>
            );
          })}
        </Box>

        {selectedModule ? <ModulePreview module={selectedModule} unavailable={Boolean(selectedSource && !selectedSource.available)} /> : null}

        <LedgerPreview data={data} />

        <Box component="section" aria-label="Finance diagnostics access" sx={{ borderTop: "1px solid rgba(255,255,255,0.10)", pt: 1.5 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.4} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.94)", fontWeight: 900 }}>
                Finance diagnostics
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(222,208,232,0.68)" }}>
                {data.reconciliation.issueCount.toLocaleString("en-US")} reconciliation flags · Historical test records are included in these totals.
              </Typography>
            </Box>
            <V2Button href="/admin-v2/billing/diagnostics" variant="outlined" size="small" startIcon={<ShieldAlert size={15} />}>
              View Diagnostics
            </V2Button>
          </Stack>
        </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
