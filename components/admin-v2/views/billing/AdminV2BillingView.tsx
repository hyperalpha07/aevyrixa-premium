"use client";

import { useState } from "react";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import { Banknote, FileBarChart, FileText, Receipt, RefreshCcw } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import type { AdminV2BillingModuleCard, AdminV2BillingResult, AdminV2BillingSummaryMetric } from "@/lib/admin-v2/billing/billing-metrics";

type BillingModuleTitle = AdminV2BillingModuleCard["title"];

const moduleIcons = {
  Invoices: FileText,
  Transactions: Receipt,
  Refunds: RefreshCcw,
  Reports: FileBarChart,
  Expenses: Banknote,
} as const;

const kpiIcons = {
  "Payable Sales": Banknote,
  "Recorded Payments": Receipt,
  "Recorded Due": Banknote,
  "Recorded Refunds": RefreshCcw,
  "Recorded Expenses": Banknote,
  "Issued Invoices": FileText,
} as const;

const moduleSource = {
  Invoices: "invoices",
  Transactions: "transactions",
  Refunds: "refunds",
  Reports: "analytics",
  Expenses: "expenses",
} as const satisfies Record<BillingModuleTitle, keyof AdminV2BillingResult["sources"]>;

const reportCapabilities = ["Sales", "Orders", "Products", "Customers", "Reviews", "Discounts & delivery fees"];

const moduleMetricLabels: Partial<Record<BillingModuleTitle, Record<string, string>>> = {
  Invoices: {
    Issued: "Issued invoices",
    "Invoiced value": "Total invoiced value",
  },
  Transactions: {
    Recorded: "Recorded payments",
    "Voided / failed": "Voided payments",
  },
};

const moduleMetricSupport: Partial<Record<BillingModuleTitle, Record<string, string>>> = {
  Invoices: {
    Issued: "Persisted invoice records",
    "Invoiced value": "Issued invoice totals",
  },
  Transactions: {
    Recorded: "Active payment ledger",
    "Voided / failed": "Historical corrections",
  },
  Refunds: {
    "Refunded orders": "Orders with refund state",
    "Refunded amount": "Recorded refund value",
  },
  Expenses: {
    Active: "Active expense ledger",
    "Expense value": "Recorded expense value",
  },
};

function formatMetric(metric: Pick<AdminV2BillingSummaryMetric, "value" | "kind" | "available" | "displayValue">) {
  if (metric.displayValue) return metric.displayValue;
  if (!metric.available) return "Unavailable";
  if (metric.value === null) return "Available";
  return metric.kind === "currency" ? formatCurrency(metric.value) : metric.value.toLocaleString("en-US");
}

function sourceAlerts(data: AdminV2BillingResult) {
  return Object.entries(data.sources)
    .filter(([, source]) => source.limitation)
    .map(([key, source]) => ({ key, ...source }));
}

function KpiStrip({ metrics }: { metrics: AdminV2BillingSummaryMetric[] }) {
  return (
    <V2Card
      sx={{
        borderColor: "rgba(124, 58, 237, 0.12)",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,248,255,0.94) 54%, rgba(246,251,255,0.92) 100%)",
        boxShadow: "0 16px 42px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.88)",
        "& .MuiCardContent-root": {
          p: 0,
          "&:last-child": { pb: 0 },
        },
      }}
    >
      <Box
        aria-label="Finance summary bar"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0, 1fr))" },
          gap: { xs: 0, md: 0.5 },
          minHeight: { md: 86 },
          px: { md: 0.65 },
          py: { md: 0.55 },
        }}
      >
        {metrics.map((metric, index) => {
          const Icon = kpiIcons[metric.label as keyof typeof kpiIcons] ?? Banknote;
          return (
            <Stack
              key={metric.label}
              direction="row"
              spacing={1.25}
              sx={{
                alignItems: "center",
                minWidth: 0,
                px: { xs: 1.65, md: 1.4 },
                py: { xs: 1.25, md: 1.15 },
                borderTop: { xs: index === 0 ? 0 : "1px solid", md: 0 },
                borderColor: "rgba(124, 58, 237, 0.08)",
                borderRadius: { md: 2.25 },
                backgroundColor: { md: "rgba(255,255,255,0.34)" },
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1.5,
                  flex: "0 0 auto",
                  display: "grid",
                  placeItems: "center",
                  color: metric.available ? "primary.main" : "warning.main",
                  background:
                    metric.available
                      ? "linear-gradient(135deg, rgba(124,58,237,0.13), rgba(56,189,248,0.08))"
                      : "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(124,58,237,0.06))",
                }}
              >
                <Icon size={15} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.68rem", fontWeight: 800, lineHeight: 1.15 }}>
                  {metric.label}
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 0.3, fontWeight: 950, lineHeight: 1.05, whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
                  {formatMetric(metric)}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>
    </V2Card>
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
  const metricLabels = moduleMetricLabels[module.title] ?? {};
  const metricSupport = moduleMetricSupport[module.title] ?? {};

  return (
    <Stack spacing={2.25}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2.25} sx={{ justifyContent: "space-between", alignItems: { md: "flex-start" } }}>
        <Stack direction="row" spacing={1.35} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.25,
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
              color: "primary.main",
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(56,189,248,0.10))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 10px 24px rgba(124,58,237,0.10)",
            }}
          >
            <Icon size={20} />
          </Box>
          <Box sx={{ minWidth: 0, maxWidth: 620 }}>
            <Typography component="h3" variant="h6" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
              {module.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65 }}>
              {module.description}
            </Typography>
          </Box>
        </Stack>

        <V2Button href={module.href} variant="contained" size="small" sx={{ minWidth: 148, boxShadow: "0 10px 24px rgba(124,58,237,0.18)" }}>
          Open full module
        </V2Button>
      </Stack>

      {unavailable ? (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          This Billing preview is unavailable because its underlying source could not be loaded.
        </Alert>
      ) : module.title === "Reports" ? (
        <Stack spacing={1.1} sx={{ maxWidth: 760 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: "-0.015em", lineHeight: 1.18 }}>
            Analytics summary/export workspace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 690 }}>
            Sanitized CSV export is available for supported operational report types without creating saved report history or scheduled reports.
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 850, lineHeight: 1.7 }}>
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
            maxWidth: 780,
          }}
        >
          {module.figures.map((figure, index) => (
            <Box
              key={figure.label}
              sx={{
                minWidth: 0,
                py: { xs: index === 0 ? 0 : 0.5, sm: 0 },
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", fontWeight: 850, letterSpacing: "0.01em" }}>
                {metricLabels[figure.label] ?? figure.label}
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.45, fontWeight: 950, letterSpacing: "-0.045em", lineHeight: 1 }}>
                {formatMetric(figure)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.6, fontWeight: 700 }}>
                {metricSupport[figure.label] ?? "Existing operational source"}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}

export function AdminV2BillingView({ data }: { data: AdminV2BillingResult }) {
  const alerts = sourceAlerts(data);
  const allFailed = Object.values(data.sources).every((source) => !source.available);
  const [activeModule, setActiveModule] = useState<BillingModuleTitle>(data.modules[0]?.title ?? "Invoices");
  const selectedModule = data.modules.find((module) => module.title === activeModule) ?? data.modules[0];
  const selectedSource = selectedModule ? data.sources[moduleSource[selectedModule.title]] : null;

  return (
    <Box component="section" aria-labelledby="admin-v2-billing-title">
      <V2PageHeader
        title="Billing"
        titleId="admin-v2-billing-title"
        titleComponent="h1"
        description="Finance overview across invoices, payments, refunds and reporting."
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Billing" }]}
      />

      <Stack spacing={1.5}>
        {allFailed ? (
          <Alert severity="error">Finance data is unavailable. Billing does not substitute fake zeroes for failed sources.</Alert>
        ) : null}
        {alerts.map((alert) => (
          <Alert key={alert.key} severity={alert.available ? "warning" : "error"} sx={{ py: 0.5 }}>
            {alert.limitation}
          </Alert>
        ))}

        <KpiStrip metrics={data.summary} />

        <V2Card
          sx={{
            borderColor: "rgba(124, 58, 237, 0.14)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,248,255,0.95) 50%, rgba(245,250,255,0.92) 100%)",
            boxShadow: "0 20px 54px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.88)",
            "& .MuiCardContent-root": {
              p: { xs: 1.6, md: 2.4 },
              "&:last-child": { pb: { xs: 1.6, md: 2.4 } },
            },
          }}
        >
          <Stack spacing={2.2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
              <Box>
                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 950, letterSpacing: "-0.02em" }}>
                  Main Financial Overview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Focused read-only preview across invoices, payments, refunds and reports.
                </Typography>
              </Box>
            </Stack>

            {selectedModule ? <ModulePreview module={selectedModule} unavailable={Boolean(selectedSource && !selectedSource.available)} /> : null}

            <Divider sx={{ borderColor: "rgba(124,58,237,0.10)" }} />

            <Box
              role="tablist"
              aria-label="Billing finance modules"
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: { xs: 1, md: 2.25 },
                alignItems: "center",
              }}
            >
              {data.modules.map((module) => {
                const selected = module.title === activeModule;
                return (
                  <Button
                    key={module.title}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    disableRipple
                    onClick={() => setActiveModule(module.title)}
                    sx={{
                      minWidth: 0,
                      minHeight: 34,
                      px: 0,
                      py: 0.45,
                      borderRadius: 0,
                      color: selected ? "primary.main" : "text.secondary",
                      backgroundColor: "transparent",
                      fontSize: "0.79rem",
                      fontWeight: selected ? 950 : 850,
                      letterSpacing: "0.01em",
                      position: "relative",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 1,
                        height: 2,
                        borderRadius: 999,
                        background: selected ? "linear-gradient(90deg, rgba(124,58,237,0.86), rgba(56,189,248,0.54))" : "transparent",
                      },
                      "&:hover": {
                        backgroundColor: "transparent",
                        color: selected ? "primary.main" : "text.primary",
                      },
                    }}
                  >
                    {module.title}
                  </Button>
                );
              })}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", pt: 0.15, maxWidth: 900 }}>
              Operational finance summary only — order due amounts are not an accounting receivables ledger, and payment status is not gateway settlement.
            </Typography>
          </Stack>
        </V2Card>
      </Stack>
    </Box>
  );
}
