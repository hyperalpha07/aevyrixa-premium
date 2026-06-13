"use client";

import {
  Dialog,
  DialogContent,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminSessionUser } from "@/app/lib/admin-permissions";
import { adminV2Routes } from "@/configs/admin-v2/routes";
import { canAccessAdminV2Module } from "@/lib/admin-v2/permissions";

type AdminV2CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  session: AdminSessionUser;
};

export function AdminV2CommandPalette({ open, onClose, session }: AdminV2CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return adminV2Routes
      .filter((route) => !route.path.includes("[") && canAccessAdminV2Module(session, route.module))
      .filter((route) =>
        normalized
          ? `${route.title} ${route.description} ${route.path}`.toLowerCase().includes(normalized)
          : true
      )
      .slice(0, 10);
  }, [query, session]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages, products, orders, customers"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            },
          }}
        />
        <List sx={{ mt: 1 }}>
          {results.map((route) => (
            <ListItemButton
              key={route.path}
              onClick={() => {
                router.push(route.path);
                onClose();
                setQuery("");
              }}
              sx={{ borderRadius: 2 }}
            >
              <ListItemText primary={route.title} secondary={route.path} />
            </ListItemButton>
          ))}
        </List>
        <Stack spacing={0.5} sx={{ px: 1, pb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Page route search is active.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Product, order, and customer record search connection pending.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
