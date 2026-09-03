import type { AdminSessionUser } from "@/app/lib/admin-permissions";
import type { OrderRecord } from "@/app/lib/order-types";
import type { ProductCatalogItem } from "@/app/lib/product-types";

export type AdminV2Session = AdminSessionUser;

export type AdminV2DashboardData = {
  orders: {
    available: boolean;
    count: number;
    revenue: number;
    pending: number;
    recent: OrderRecord[];
    source: string;
  };
  products: {
    available: boolean;
    count: number;
    active: number;
    draft: number;
    lowStock: number;
    source: string;
    items: ProductCatalogItem[];
  };
  reviews: {
    available: boolean;
    count: number;
    pending: number;
    source: string;
  };
  customers: {
    available: boolean;
    count: number;
    source: string;
  };
  support: {
    available: boolean;
    open: number;
    source: string;
  };
};
