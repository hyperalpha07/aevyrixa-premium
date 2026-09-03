type AdminV2NavigationTarget = {
  href?: string;
  module?: string;
};

export function isAdminV2NavigationItemActive(
  pathname: string,
  item: AdminV2NavigationTarget
) {
  if (!item.href) return false;
  if (item.href === "/admin-v2/dashboard") {
    return pathname === item.href || pathname === "/admin-v2";
  }
  if (item.href === "/admin-v2/products" && item.module === "products") {
    return (
      pathname === item.href ||
      (pathname.startsWith(`${item.href}/`) && pathname !== `${item.href}/new`)
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
