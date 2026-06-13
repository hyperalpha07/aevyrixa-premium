"use client";

import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu as MenuIcon, Moon, Search, Settings, Store, Sun, User, WandSparkles } from "lucide-react";
import { useState } from "react";
import type { AdminSessionUser } from "@/app/lib/admin-permissions";
import { V2IconButton } from "@/components/admin-v2/shared/V2IconButton";
import { useAdminV2Theme } from "@/components/admin-v2/theme/AdminV2ThemeProvider";
import { roleLabels } from "@/app/lib/admin-permissions";

type AdminV2TopbarProps = {
  session: AdminSessionUser;
  onOpenMobileNav: () => void;
  onToggleCollapse: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  notificationCount: number;
};

export function AdminV2Topbar({
  session,
  onOpenMobileNav,
  onToggleCollapse,
  onOpenSearch,
  onOpenNotifications,
  notificationCount,
}: AdminV2TopbarProps) {
  const router = useRouter();
  const { mode, setMode } = useAdminV2Theme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.push("/admin/login");
    router.refresh();
  }

  const nextMode = mode === "dark" ? "light" : mode === "light" ? "system" : "dark";

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: "blur(14px)",
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(11,16,32,0.76)" : "rgba(247,244,251,0.78)"),
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ minHeight: 72, gap: 1.2 }}>
        <Box sx={{ display: { xs: "inline-flex", lg: "none" } }}>
          <V2IconButton label="Open navigation" onClick={onOpenMobileNav}>
            <MenuIcon size={20} />
          </V2IconButton>
        </Box>
        <Box sx={{ display: { xs: "none", lg: "inline-flex" } }}>
          <V2IconButton label="Collapse navigation" onClick={onToggleCollapse}>
            <MenuIcon size={20} />
          </V2IconButton>
        </Box>
        <Button
          onClick={onOpenSearch}
          startIcon={<Search size={17} />}
          sx={{
            justifyContent: "flex-start",
            color: "text.secondary",
            borderColor: "divider",
            flex: { xs: 1, md: "0 1 360px" },
            maxWidth: 420,
          }}
          variant="outlined"
        >
          Search
        </Button>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Button component={Link} href="/" target="_blank" startIcon={<Store size={17} />} color="inherit">
              Storefront
            </Button>
          </Box>
          <V2IconButton label={`Theme mode: ${mode}`} onClick={() => setMode(nextMode)}>
            {mode === "dark" ? <Moon size={20} /> : mode === "light" ? <Sun size={20} /> : <WandSparkles size={20} />}
          </V2IconButton>
          <V2IconButton label="Notifications" onClick={onOpenNotifications}>
            <Badge badgeContent={notificationCount} color="error">
              <Bell size={20} />
            </Badge>
          </V2IconButton>
          <V2IconButton label="Profile menu" onClick={(event) => setAnchorEl(event.currentTarget)}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14 }}>
              {session.displayName.slice(0, 1).toUpperCase()}
            </Avatar>
          </V2IconButton>
        </Stack>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <Box sx={{ px: 2, py: 1.5, minWidth: 230 }}>
            <Typography variant="subtitle2">{session.displayName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {roleLabels[session.role] ?? "Admin"}
            </Typography>
          </Box>
          <Divider />
          <MenuItem component={Link} href="/admin-v2/staff" onClick={() => setAnchorEl(null)}>
            <User size={17} style={{ marginRight: 10 }} />
            Profile
          </MenuItem>
          <MenuItem component={Link} href="/admin-v2/settings" onClick={() => setAnchorEl(null)}>
            <Settings size={17} style={{ marginRight: 10 }} />
            Account settings
          </MenuItem>
          <MenuItem onClick={() => setMode(nextMode)}>
            <WandSparkles size={17} style={{ marginRight: 10 }} />
            Theme settings
          </MenuItem>
          <MenuItem component={Link} href="/" target="_blank" onClick={() => setAnchorEl(null)}>
            <Store size={17} style={{ marginRight: 10 }} />
            Storefront
          </MenuItem>
          <Divider />
          <MenuItem onClick={logout}>
            <LogOut size={17} style={{ marginRight: 10 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
