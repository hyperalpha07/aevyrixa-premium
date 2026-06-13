"use client";

import {
  Box,
  Chip,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AdminSessionUser } from "@/app/lib/admin-permissions";
import { AdminV2Logo } from "@/components/admin-v2/layouts/AdminV2Logo";
import { adminV2Navigation, type AdminV2NavigationItem } from "@/configs/admin-v2/navigation";
import { canAccessAdminV2Module } from "@/lib/admin-v2/permissions";
import { useAdminV2Motion } from "@/components/admin-v2/motion";
import { adminV2Motion, adminV2Transition } from "@/components/admin-v2/motion/motion-config";

type AdminV2SidebarProps = {
  session: AdminSessionUser;
  collapsed: boolean;
  onNavigate?: () => void;
};

function itemVisible(session: AdminSessionUser, item: AdminV2NavigationItem): boolean {
  const own = item.module ? canAccessAdminV2Module(session, item.module) : true;
  const children = item.children?.some((child) => itemVisible(session, child)) ?? false;
  return own || children;
}

function isActive(pathname: string, item: AdminV2NavigationItem) {
  if (!item.href) return false;
  if (item.href === "/admin-v2/dashboard") return pathname === item.href || pathname === "/admin-v2";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function childActive(pathname: string, item: AdminV2NavigationItem): boolean {
  return isActive(pathname, item) || Boolean(item.children?.some((child) => childActive(pathname, child)));
}

function SidebarItem({
  item,
  session,
  collapsed,
  depth = 0,
  onNavigate,
}: {
  item: AdminV2NavigationItem;
  session: AdminSessionUser;
  collapsed: boolean;
  depth?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { startRouteProgress, reducedMotion } = useAdminV2Motion();
  const visibleChildren = item.children?.filter((child) => itemVisible(session, child)) ?? [];
  const hasChildren = visibleChildren.length > 0;
  const active = isActive(pathname, item) || visibleChildren.some((child) => childActive(pathname, child));
  const [open, setOpen] = useState(active);
  const Icon = item.icon;
  const navigates = Boolean(item.href && (!hasChildren || collapsed));
  const tooltipTitle = hasChildren
    ? `${item.label}: ${visibleChildren.map((child) => child.label).join(", ")}`
    : item.label;

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  const button = (
    <ListItemButton
      component={navigates ? Link : "button"}
      href={navigates ? item.href : undefined}
      onClick={() => {
        if (navigates) {
          startRouteProgress();
          onNavigate?.();
          return;
        }
        if (hasChildren) setOpen((current) => !current);
      }}
      aria-current={isActive(pathname, item) ? "page" : undefined}
      aria-expanded={hasChildren && !collapsed ? open : undefined}
      aria-label={collapsed ? tooltipTitle : undefined}
      selected={active}
      sx={{
        minHeight: 42,
        borderRadius: 2,
        px: collapsed ? 1.25 : 1.5,
        pl: collapsed ? 1.25 : 1.5 + depth * 2,
        justifyContent: collapsed ? "center" : "flex-start",
        mb: 0.5,
        transition: adminV2Transition(["background-color", "color", "transform"], adminV2Motion.duration.micro),
        "&:hover": {
          transform: reducedMotion ? "none" : "translate3d(2px, 0, 0)",
        },
        "&.Mui-focusVisible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
        "&.Mui-selected": {
          color: "primary.main",
          bgcolor: (theme) => (theme.palette.mode === "dark" ? "primary.main" : "primary.main"),
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? `${theme.palette.primary.main}24` : `${theme.palette.primary.main}12`,
        },
      }}
    >
      {Icon ? (
        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: "inherit" }}>
          <Icon size={19} />
        </ListItemIcon>
      ) : null}
      {!collapsed ? (
        <>
          <ListItemText
            primary={item.label}
            slotProps={{ primary: { variant: "body2", sx: { fontWeight: active ? 700 : 600 } } }}
          />
          {item.badge ? <Chip size="small" label={item.badge} color="primary" /> : null}
          {hasChildren ? (
            <ChevronRight
              size={16}
              style={{
                transform: open ? "rotate(90deg)" : "rotate(0deg)",
                transition: reducedMotion ? "none" : "transform 160ms cubic-bezier(0.2, 0, 0, 1)",
              }}
            />
          ) : null}
        </>
      ) : null}
    </ListItemButton>
  );

  return (
    <>
      {collapsed ? (
        <Tooltip title={tooltipTitle} placement="right" enterDelay={250}>
          <span>{button}</span>
        </Tooltip>
      ) : (
        button
      )}
      {hasChildren && !collapsed ? (
        <Collapse in={open} timeout={reducedMotion ? 0 : 180} unmountOnExit>
          <List disablePadding>
            {visibleChildren.map((child) => (
              <SidebarItem
                key={`${child.label}-${child.href}`}
                item={child}
                session={session}
                collapsed={collapsed}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </List>
        </Collapse>
      ) : null}
    </>
  );
}

export function AdminV2Sidebar({ session, collapsed, onNavigate }: AdminV2SidebarProps) {
  const sections = useMemo(
    () =>
      adminV2Navigation
        .map((section) => ({ ...section, items: section.items.filter((item) => itemVisible(session, item)) }))
        .filter((section) => section.items.length > 0),
    [session]
  );

  return (
    <Stack sx={{ height: "100%", overflow: "hidden" }}>
      <Box sx={{ px: collapsed ? 1.25 : 2.5, py: 2.2 }}>
        <AdminV2Logo collapsed={collapsed} />
      </Box>
      <Divider />
      <Box sx={{ px: collapsed ? 1 : 1.5, py: 1.5, overflowY: "auto", overflowX: "hidden", flex: 1 }}>
        {sections.map((section) => (
          <Box key={section.heading} sx={{ mb: 2 }}>
            {!collapsed ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", px: 1.5, py: 1, fontWeight: 800, textTransform: "uppercase" }}
              >
                {section.heading}
              </Typography>
            ) : (
              <Tooltip title={section.heading} placement="right">
                <Divider sx={{ mx: 1, my: 1.25 }} />
              </Tooltip>
            )}
            <List disablePadding>
              {section.items.map((item) => (
                <SidebarItem
                  key={`${item.label}-${item.href}`}
                  item={item}
                  session={session}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
