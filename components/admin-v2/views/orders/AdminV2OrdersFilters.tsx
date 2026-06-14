"use client";

import { Badge, Box, Drawer, Grid, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Filter, RotateCcw, X } from "lucide-react";
import { deliveryStatuses, orderStatuses, paymentMethods, paymentStatuses } from "@/app/lib/order-types";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2Input } from "@/components/admin-v2/forms/V2Input";
import { V2Select } from "@/components/admin-v2/forms/V2Select";
import {
  activeFilterCount,
  emptyOrderFilters,
  orderSortOptions,
  type AdminV2OrderFilters,
} from "@/components/admin-v2/views/orders/utils";

type Props = {
  filters: AdminV2OrderFilters;
  onChange: (filters: AdminV2OrderFilters) => void;
  drawerOpen: boolean;
  onDrawerOpen: () => void;
  onDrawerClose: () => void;
};

const allOption = { label: "All", value: "all" };

function FilterFields({ filters, onChange }: Pick<Props, "filters" | "onChange">) {
  const update = (key: keyof AdminV2OrderFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <V2Input
          label="Search"
          value={filters.q}
          onChange={(event) => update("q", event.target.value)}
          placeholder="Reference, customer, phone, email"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <V2Select
          label="Order status"
          value={filters.status}
          onChange={(event) => update("status", event.target.value)}
          options={[allOption, ...orderStatuses.map((status) => ({ label: status, value: status }))]}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <V2Select
          label="Payment method"
          value={filters.payment}
          onChange={(event) => update("payment", event.target.value)}
          options={[allOption, ...paymentMethods.map((method) => ({ label: method, value: method }))]}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <V2Select
          label="Payment status"
          value={filters.paymentStatus}
          onChange={(event) => update("paymentStatus", event.target.value)}
          options={[allOption, ...paymentStatuses.map((status) => ({ label: status, value: status }))]}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <V2Select
          label="Delivery status"
          value={filters.delivery}
          onChange={(event) => update("delivery", event.target.value)}
          options={[allOption, ...deliveryStatuses.map((status) => ({ label: status.replace(/_/g, " "), value: status }))]}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <V2Input label="From" type="date" value={filters.from} onChange={(event) => update("from", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <V2Input label="To" type="date" value={filters.to} onChange={(event) => update("to", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <V2Select
          label="Sort"
          value={filters.sort}
          onChange={(event) => update("sort", event.target.value)}
          options={[...orderSortOptions]}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", height: "100%" }}>
          <V2Button
            variant="outlined"
            startIcon={<RotateCcw size={16} />}
            disabled={activeFilterCount(filters) === 0}
            onClick={() => onChange(emptyOrderFilters)}
          >
            Clear filters
          </V2Button>
          <Tooltip title="Filtering is applied locally to the authorized Supabase order result set.">
            <Typography variant="caption" color="text.secondary">
              {activeFilterCount(filters)} active
            </Typography>
          </Tooltip>
        </Stack>
      </Grid>
    </Grid>
  );
}

export function AdminV2OrdersFilters({ filters, onChange, drawerOpen, onDrawerOpen, onDrawerClose }: Props) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const count = activeFilterCount(filters);

  if (compact) {
    return (
      <>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1">Filters</Typography>
          <Badge badgeContent={count} color="primary">
            <V2Button variant="outlined" startIcon={<Filter size={16} />} onClick={onDrawerOpen}>
              Filters
            </V2Button>
          </Badge>
        </Stack>
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={onDrawerClose}
          slotProps={{ paper: { sx: { width: { xs: "100vw", sm: 430 }, p: 3 } } }}
        >
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Order filters</Typography>
            <IconButton aria-label="Close filters" onClick={onDrawerClose}>
              <X size={18} />
            </IconButton>
          </Stack>
          <FilterFields filters={filters} onChange={onChange} />
        </Drawer>
      </>
    );
  }

  return (
    <V2Card>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Filters
        </Typography>
        <FilterFields filters={filters} onChange={onChange} />
      </Box>
    </V2Card>
  );
}
