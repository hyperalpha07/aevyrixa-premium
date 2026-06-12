"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Boxes,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Filter,
  Grid2X2,
  Inbox,
  List,
  Mail,
  MapPin,
  MessageCircle,
  MonitorDot,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  ThumbsUp,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { AdminConfirmModal } from "@/app/admin/components";
import { hasPermission, type AdminSessionUser } from "@/app/lib/admin-permissions";

type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";
type ReviewSourceType = "order-linked" | "customer-submitted" | "admin-added" | "imported";

type AdminReviewClientRecord = {
  id: string;
  productId: string;
  productSlug: string;
  orderId?: string;
  orderReference?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  rating: number;
  title?: string;
  body: string;
  mediaUrls: string[];
  status: ReviewStatus;
  sourceType: ReviewSourceType;
  verifiedPurchase: boolean;
  isFeatured: boolean;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
};

type AdminProductSummary = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  images: string[];
  deletedAt?: string;
};

type ReviewDraft = {
  productId: string;
  productSlug: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  mediaUrls: string[];
  status: ReviewStatus;
  sourceType: ReviewSourceType;
  isFeatured: boolean;
  adminNote: string;
  createdAt: string;
};

type SortMode = "newest" | "oldest" | "rating-high" | "rating-low";
type ViewMode = "detail" | "compact" | "grid";

const statuses: Array<"all" | ReviewStatus> = ["all", "pending", "approved", "hidden", "rejected"];
const statusLabels: Record<"all" | ReviewStatus, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  hidden: "Hidden",
  rejected: "Rejected",
};

const demoReviewCounts = { all: 1248, pending: 24, approved: 1082, hidden: 78, rejected: 64 };

const demoTrends: Record<ReviewStatus | "total", string> = {
  total: "+18.6% vs last 7 days",
  pending: "+12.5% vs last 7 days",
  approved: "+21.4% vs last 7 days",
  hidden: "+8.2% vs last 7 days",
  rejected: "+15.3% vs last 7 days",
};

const demoProductImages = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3CradialGradient id='g' cx='32%25' cy='15%25' r='85%25'%3E%3Cstop stop-color='%23ffd4dd'/%3E%3Cstop offset='.55' stop-color='%23f3b5c6'/%3E%3Cstop offset='1' stop-color='%23060913'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='12' fill='url(%23g)'/%3E%3Cpath d='M17 30c8 3 15 4 23 4s15-1 23-4l-5 30c-10 6-26 6-36 0L17 30Z' fill='%23080a0e'/%3E%3Cpath d='M24 34c10 5 22 5 32 0' fill='none' stroke='%23ffffff' stroke-opacity='.28' stroke-width='2'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23ffe0ca'/%3E%3Cstop offset='.45' stop-color='%23f6c5b4'/%3E%3Cstop offset='1' stop-color='%238b6ee8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='12' fill='url(%23g)'/%3E%3Cpath d='M18 20h44l-6 44H24L18 20Z' fill='%23fff7f4' fill-opacity='.92'/%3E%3Cpath d='M28 23c4 12 20 12 24 0' fill='none' stroke='%23d59a8e' stroke-width='3'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23f5b7c8'/%3E%3Cstop offset='.5' stop-color='%23a977ff'/%3E%3Cstop offset='1' stop-color='%230a1230'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='12' fill='url(%23g)'/%3E%3Cpath d='M15 32c11 4 17 5 25 5s14-1 25-5l-7 25c-8 8-28 8-36 0L15 32Z' fill='%23462f91'/%3E%3Cpath d='M22 36c13 5 23 5 36 0' fill='none' stroke='%23ffffff' stroke-opacity='.32' stroke-width='2'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23ffd9d9'/%3E%3Cstop offset='.6' stop-color='%23e9a7bb'/%3E%3Cstop offset='1' stop-color='%23071121'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='12' fill='url(%23g)'/%3E%3Cpath d='M21 18h38l-3 42c-8 5-24 5-32 0L21 18Z' fill='%23f5d0d6'/%3E%3Cpath d='M24 24c8 5 24 5 32 0' fill='none' stroke='%23bf748b' stroke-width='3'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3CradialGradient id='g' cx='35%25' cy='20%25' r='80%25'%3E%3Cstop stop-color='%23ffe1ea'/%3E%3Cstop offset='.55' stop-color='%23ffc0d1'/%3E%3Cstop offset='1' stop-color='%23080d19'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='12' fill='url(%23g)'/%3E%3Cpath d='M18 30c10 5 34 5 44 0l-8 32c-8 5-20 5-28 0L18 30Z' fill='%230b0c12'/%3E%3Cpath d='M28 31c5 5 19 5 24 0' fill='none' stroke='%23ffffff' stroke-opacity='.3' stroke-width='2'/%3E%3C/svg%3E",
];

const demoReviews: AdminReviewClientRecord[] = [
  {
    id: "RVW-778365",
    productId: "demo-premium-comfort-brief",
    productSlug: "premium-comfort-brief",
    orderReference: "AEV-PCB-1092",
    customerId: "demo-fatema",
    customerName: "Fatema J.",
    customerPhone: "fatema.j@example.com",
    rating: 4,
    title: "Feature Request",
    body: "Super comfortable and perfect for all-day wear. The fabric is soft and breathable. Highly recommended!",
    mediaUrls: [demoProductImages[0]],
    status: "pending",
    sourceType: "order-linked",
    verifiedPurchase: true,
    isFeatured: true,
    createdAt: "2026-05-19T10:31:00.000Z",
    updatedAt: "2026-05-19T10:31:00.000Z",
  },
  {
    id: "RVW-778366",
    productId: "demo-high-waist-3-pack",
    productSlug: "aevyrixa-high-waist-3-pack",
    orderReference: "AEV-HW3-2281",
    customerId: "demo-nusrat",
    customerName: "Nusrat A.",
    customerPhone: "nusrat.a@example.com",
    rating: 4,
    title: "Soft daily essential",
    body: "The fit is secure and the waistband feels supportive without digging in.",
    mediaUrls: [demoProductImages[1]],
    status: "pending",
    sourceType: "order-linked",
    verifiedPurchase: true,
    isFeatured: false,
    createdAt: "2026-05-19T10:23:00.000Z",
    updatedAt: "2026-05-19T10:24:00.000Z",
  },
  {
    id: "RVW-778367",
    productId: "demo-cotton-comfort-boyshort",
    productSlug: "cotton-comfort-boyshort",
    orderReference: "AEV-CCB-5518",
    customerId: "demo-sabrina",
    customerName: "Sabrina K.",
    customerPhone: "sabrina.k@example.com",
    rating: 4,
    title: "Breathable fabric",
    body: "Good coverage and very breathable for long work days.",
    mediaUrls: [demoProductImages[2]],
    status: "pending",
    sourceType: "customer-submitted",
    verifiedPurchase: false,
    isFeatured: false,
    createdAt: "2026-05-19T10:09:00.000Z",
    updatedAt: "2026-05-19T10:09:00.000Z",
  },
  {
    id: "RVW-778368",
    productId: "demo-seamless-period-panty",
    productSlug: "seamless-period-panty",
    orderReference: "AEV-SPP-3387",
    customerId: "demo-tanzida",
    customerName: "Tanzida R.",
    customerPhone: "tanzida.r@example.com",
    rating: 3,
    title: "Good but needs more colors",
    body: "Comfortable and invisible under clothing. More shades would be great.",
    mediaUrls: [demoProductImages[3]],
    status: "pending",
    sourceType: "order-linked",
    verifiedPurchase: true,
    isFeatured: false,
    createdAt: "2026-05-19T09:46:00.000Z",
    updatedAt: "2026-05-19T09:48:00.000Z",
  },
  {
    id: "RVW-778369",
    productId: "demo-maternity-support-brief",
    productSlug: "maternity-support-brief",
    orderReference: "AEV-MSB-8826",
    customerId: "demo-meherun",
    customerName: "Meherun N.",
    customerPhone: "meherun.n@example.com",
    rating: 4,
    title: "Supportive shape",
    body: "The support is gentle and the material still feels soft after washing.",
    mediaUrls: [demoProductImages[4]],
    status: "pending",
    sourceType: "order-linked",
    verifiedPurchase: true,
    isFeatured: false,
    createdAt: "2026-05-19T09:31:00.000Z",
    updatedAt: "2026-05-19T09:31:00.000Z",
  },
];

const demoProducts: AdminProductSummary[] = [
  { id: "demo-premium-comfort-brief", name: "Premium Comfort Brief", slug: "premium-comfort-brief", imageUrl: demoProductImages[0], images: [demoProductImages[0]] },
  { id: "demo-high-waist-3-pack", name: "Aevyrixa High Waist 3-Pack", slug: "aevyrixa-high-waist-3-pack", imageUrl: demoProductImages[1], images: [demoProductImages[1]] },
  { id: "demo-cotton-comfort-boyshort", name: "Cotton Comfort Boyshort", slug: "cotton-comfort-boyshort", imageUrl: demoProductImages[2], images: [demoProductImages[2]] },
  { id: "demo-seamless-period-panty", name: "Seamless Period Panty", slug: "seamless-period-panty", imageUrl: demoProductImages[3], images: [demoProductImages[3]] },
  { id: "demo-maternity-support-brief", name: "Maternity Support Brief", slug: "maternity-support-brief", imageUrl: demoProductImages[4], images: [demoProductImages[4]] },
];

const sourceLabels: Record<ReviewSourceType, string> = {
  "order-linked": "Order-linked",
  "customer-submitted": "Customer feedback",
  "admin-added": "Customer feedback",
  imported: "Curated feedback",
};

const metricAccents: Record<ReviewStatus | "total", string> = {
  total: "from-cyan-300/30 via-cyan-200/10 to-transparent text-cyan-100 border-cyan-200/20",
  pending: "from-amber-300/30 via-amber-200/10 to-transparent text-amber-100 border-amber-200/20",
  approved: "from-emerald-300/30 via-emerald-200/10 to-transparent text-emerald-100 border-emerald-200/20",
  hidden: "from-fuchsia-300/30 via-fuchsia-200/10 to-transparent text-fuchsia-100 border-fuchsia-200/20",
  rejected: "from-rose-300/30 via-rose-200/10 to-transparent text-rose-100 border-rose-200/20",
};

function emptyReviewDraft(products: AdminProductSummary[]): ReviewDraft {
  const product = products.find((item) => !item.deletedAt) ?? products[0];
  return {
    productId: product?.id ?? "",
    productSlug: product?.slug ?? "",
    customerName: "",
    rating: 5,
    title: "",
    body: "",
    mediaUrls: [""],
    status: "pending",
    sourceType: "admin-added",
    isFeatured: false,
    adminNote: "",
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

async function readReviewsFromApi() {
  try {
    const response = await fetch("/api/admin/reviews", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as {
      reviews?: AdminReviewClientRecord[];
    } | null;
    if (!response.ok || !Array.isArray(payload?.reviews)) return null;
    return payload.reviews;
  } catch {
    return null;
  }
}

async function updateReviewInApi(
  updates: Pick<AdminReviewClientRecord, "id"> &
    Partial<
      Pick<
        AdminReviewClientRecord,
        | "productId"
        | "productSlug"
        | "customerName"
        | "rating"
        | "title"
        | "body"
        | "mediaUrls"
        | "status"
        | "sourceType"
        | "isFeatured"
        | "adminNote"
        | "createdAt"
      >
    >
) {
  const response = await fetch("/api/admin/reviews", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(updates),
  });
  const payload = (await response.json().catch(() => null)) as {
    review?: AdminReviewClientRecord;
    errors?: string[];
  } | null;
  if (!response.ok || !payload?.review) {
    throw new Error(payload?.errors?.[0] ?? "Review could not be updated.");
  }
  return payload.review;
}

async function createReviewInApi(review: ReviewDraft) {
  const response = await fetch("/api/admin/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(review),
  });
  const payload = (await response.json().catch(() => null)) as {
    review?: AdminReviewClientRecord;
    errors?: string[];
  } | null;
  if (!response.ok || !payload?.review) {
    throw new Error(payload?.errors?.[0] ?? "Review could not be created.");
  }
  return payload.review;
}

async function deleteReviewInApi(id: string) {
  const response = await fetch("/api/admin/reviews", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const payload = (await response.json().catch(() => null)) as { errors?: string[] } | null;
  if (!response.ok) throw new Error(payload?.errors?.[0] ?? "Review could not be deleted.");
  return true;
}

function productForReview(review: AdminReviewClientRecord, products: AdminProductSummary[]) {
  return products.find(
    (product) =>
      product.id === review.productId ||
      product.slug === review.productSlug ||
      product.slug === review.productId
  );
}

function productImage(product?: AdminProductSummary, review?: AdminReviewClientRecord) {
  return product?.imageUrl || product?.images?.[0] || review?.mediaUrls?.[0] || "";
}

function formatDate(value?: string, withTime = true) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(date);
}

function relativeTime(value?: string) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No timestamp";
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hr ago`;
  return `${Math.floor(diffMs / day)} d ago`;
}

function validMediaUrls(urls: string[]) {
  return urls
    .map((url) => url.trim())
    .filter((url, index, list) => {
      if (!url || list.indexOf(url) !== index) return false;
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    })
    .slice(0, 3);
}

function sourceForSubmit(sourceType: ReviewSourceType): "admin-added" | "imported" {
  return sourceType === "imported" || sourceType === "customer-submitted" ? "imported" : "admin-added";
}

function publicLabel(review: AdminReviewClientRecord) {
  return review.sourceType === "order-linked" && review.verifiedPurchase
    ? "Verified Buyer"
    : "Customer feedback";
}

function Stars({ value, size = "h-3.5 w-3.5" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-300">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${star <= Math.round(value) ? "fill-current" : "text-white/24"}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function StatusPill({ status }: { status: ReviewStatus }) {
  const tone =
    status === "approved"
      ? "border-emerald-200/25 bg-emerald-300/10 text-emerald-100"
      : status === "hidden"
        ? "border-fuchsia-200/25 bg-fuchsia-300/10 text-fuchsia-100"
        : status === "rejected"
          ? "border-rose-200/25 bg-rose-300/10 text-rose-100"
          : "border-amber-200/25 bg-amber-300/10 text-amber-100";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${tone}`}>
      {statusLabels[status]}
    </span>
  );
}

function CommandSelect({
  value,
  onChange,
  children,
  label,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <label className={`relative min-w-0 ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#070d1c]/90 px-3 pr-9 text-xs font-medium text-white/78 outline-none transition hover:border-fuchsia-200/25 focus:border-cyan-200/45"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/38" />
    </label>
  );
}

function MiniSparkline({ tone }: { tone: keyof typeof metricAccents }) {
  const color =
    tone === "approved"
      ? "bg-emerald-300"
      : tone === "pending"
        ? "bg-amber-300"
        : tone === "hidden"
          ? "bg-fuchsia-300"
          : tone === "rejected"
            ? "bg-rose-300"
            : "bg-cyan-300";
  return (
    <div className="mt-4 flex h-8 items-end gap-1 opacity-80">
      {[28, 44, 38, 57, 46, 64, 42, 51, 48, 61, 54, 72].map((height, index) => (
        <span
          key={`${tone}-${index}`}
          className={`${color} w-full rounded-full shadow-[0_0_16px_currentColor]`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function ReviewMetricCard({
  label,
  value,
  trend,
  tone,
}: {
  label: string;
  value: number;
  trend: string;
  tone: keyof typeof metricAccents;
}) {
  return (
    <article className={`aev-admin-metric-card relative overflow-hidden rounded-[1.15rem] border bg-[#071022]/78 p-4 ${metricAccents[tone]}`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${metricAccents[tone].split(" text-")[0]}`} />
      <p className="text-xs font-medium text-white/52">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <strong className="text-2xl font-semibold text-white">{value.toLocaleString()}</strong>
        <span className="text-[0.68rem] font-semibold text-white/54">{trend}</span>
      </div>
      <MiniSparkline tone={tone} />
    </article>
  );
}

function ReviewThumb({ src, label, className = "" }: { src?: string; label: string; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] ${className || "h-12 w-12"}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <Boxes className="h-4 w-4 text-white/38" aria-hidden="true" />
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function ReviewActionButton({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: "approve" | "hide" | "reject" | "edit" | "delete";
}) {
  const classes = {
    approve: "border-emerald-200/24 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/16",
    hide: "border-amber-200/24 bg-amber-300/10 text-amber-100 hover:bg-amber-300/16",
    reject: "border-rose-200/24 bg-rose-300/10 text-rose-100 hover:bg-rose-300/16",
    edit: "border-violet-200/24 bg-violet-300/10 text-violet-100 hover:bg-violet-300/16",
    delete: "border-rose-200/28 bg-rose-400/10 text-rose-100 hover:bg-rose-400/16",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${classes[tone]}`}
    >
      {children}
    </button>
  );
}

function ReviewEditorModal({
  draft,
  setDraft,
  products,
  saving,
  error,
  title,
  onClose,
  onSubmit,
  canSave,
}: {
  draft: ReviewDraft;
  setDraft: React.Dispatch<React.SetStateAction<ReviewDraft>>;
  products: AdminProductSummary[];
  saving: boolean;
  error: string;
  title: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  canSave: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040b]/78 p-4 backdrop-blur-xl">
      <form
        onSubmit={onSubmit}
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[1.35rem] border border-cyan-200/18 bg-[#071021] p-5 shadow-[0_0_80px_rgba(160,80,255,0.22)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-100/58">Review console</p>
            <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-white/62 transition hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <CommandSelect
            label="Product"
            value={draft.productId}
            onChange={(value) => {
              const product = products.find((item) => item.id === value);
              setDraft((current) => ({ ...current, productId: product?.id ?? "", productSlug: product?.slug ?? "" }));
            }}
            className="md:col-span-2"
          >
            <option value="">Select product</option>
            {products.filter((product) => !product.deletedAt).map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </CommandSelect>
          <input
            value={draft.customerName}
            onChange={(event) => setDraft((current) => ({ ...current, customerName: event.target.value }))}
            placeholder="Customer display name"
            className="h-11 rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-200/45"
          />
          <CommandSelect label="Rating" value={String(draft.rating)} onChange={(value) => setDraft((current) => ({ ...current, rating: Number(value) }))}>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star</option>)}
          </CommandSelect>
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Review title"
            className="h-11 rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-200/45 md:col-span-2"
          />
          <textarea
            value={draft.body}
            onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
            rows={4}
            placeholder="Review content"
            className="resize-none rounded-xl border border-white/10 bg-black/24 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-200/45 md:col-span-2"
          />
          <input
            value={draft.mediaUrls[0] ?? ""}
            onChange={(event) => setDraft((current) => ({ ...current, mediaUrls: event.target.value ? [event.target.value] : [""] }))}
            placeholder="Media URL"
            className="h-11 rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-200/45 md:col-span-2"
          />
          <input
            type="date"
            value={draft.createdAt}
            onChange={(event) => setDraft((current) => ({ ...current, createdAt: event.target.value }))}
            className="h-11 rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-cyan-200/45"
          />
          <CommandSelect label="Status" value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value as ReviewStatus }))}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="hidden">Hidden</option>
            <option value="rejected">Rejected</option>
          </CommandSelect>
          <CommandSelect label="Source" value={draft.sourceType} onChange={(value) => setDraft((current) => ({ ...current, sourceType: value as ReviewSourceType }))}>
            <option value="admin-added">Customer feedback</option>
            <option value="imported">Curated customer feedback</option>
          </CommandSelect>
          <label className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white/68">
            <input
              type="checkbox"
              checked={draft.isFeatured}
              disabled={draft.status !== "approved"}
              onChange={(event) => setDraft((current) => ({ ...current, isFeatured: event.target.checked }))}
            />
            Feature after approval
          </label>
        </div>
        {error && <p className="mt-4 rounded-xl border border-rose-200/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/64 transition hover:text-white">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave || saving}
            className="rounded-xl border border-cyan-200/30 bg-cyan-300/12 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/18 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save review"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ReviewsCommandCenter({
  reviews,
  setReviews,
  products,
  session,
}: {
  reviews: AdminReviewClientRecord[];
  setReviews: (value: AdminReviewClientRecord[] | ((current: AdminReviewClientRecord[]) => AdminReviewClientRecord[])) => void;
  products: AdminProductSummary[];
  session: AdminSessionUser;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("pending");
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => emptyReviewDraft(products));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState<AdminReviewClientRecord | null>(null);

  const canModerate = hasPermission(session, "reviews.manage") || hasPermission(session, "reviews.moderate");
  const canFeature = hasPermission(session, "reviews.manage") || hasPermission(session, "reviews.feature");
  const canManage = hasPermission(session, "reviews.manage");
  const canEditReview = canModerate;
  const visualDemoMode = reviews.length === 0;
  const displayReviews = visualDemoMode ? demoReviews : reviews;
  const displayProducts = visualDemoMode ? demoProducts : products;

  useEffect(() => {
    if (draft.productId || products.length === 0) return;
    setDraft(emptyReviewDraft(products));
  }, [draft.productId, products]);

  const counts = useMemo(
    () =>
      displayReviews.reduce(
        (total, review) => {
          total.all += 1;
          total[review.status] += 1;
          return total;
        },
        { all: 0, pending: 0, approved: 0, hidden: 0, rejected: 0 }
      ),
    [displayReviews]
  );

  const displayCounts = visualDemoMode ? demoReviewCounts : counts;

  const reviewProducts = useMemo(
    () =>
      displayProducts.filter((product) =>
        displayReviews.some(
          (review) =>
            review.productId === product.id ||
            review.productSlug === product.slug ||
            review.productId === product.slug
        )
      ),
    [displayProducts, displayReviews]
  );

  const filteredReviews = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rating = ratingFilter === "all" ? 0 : Number(ratingFilter);
    return displayReviews
      .filter((review) => {
        if (statusFilter !== "all" && review.status !== statusFilter) return false;
        if (productFilter !== "all" && review.productId !== productFilter && review.productSlug !== productFilter) return false;
        if (sourceFilter !== "all" && review.sourceType !== sourceFilter) return false;
        if (rating && review.rating !== rating) return false;
        const product = productForReview(review, displayProducts);
        if (!term) return true;
        return [
          product?.name,
          product?.slug,
          review.productSlug,
          review.productId,
          review.customerName,
          review.customerPhone,
          review.orderReference,
          review.title,
          review.body,
          review.status,
          review.sourceType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((left, right) => {
        if (sortMode === "rating-high") return right.rating - left.rating;
        if (sortMode === "rating-low") return left.rating - right.rating;
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();
        return sortMode === "oldest" ? leftTime - rightTime : rightTime - leftTime;
      });
  }, [displayProducts, displayReviews, productFilter, query, ratingFilter, sortMode, sourceFilter, statusFilter]);

  useEffect(() => {
    if (filteredReviews.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredReviews.some((review) => review.id === selectedId)) {
      setSelectedId(filteredReviews[0].id);
    }
  }, [filteredReviews, selectedId]);

  const selectedReview = filteredReviews.find((review) => review.id === selectedId) ?? filteredReviews[0] ?? null;
  const selectedProduct = selectedReview ? productForReview(selectedReview, displayProducts) : undefined;
  const selectedImage = selectedReview ? productImage(selectedProduct, selectedReview) : "";

  const trendFor = (status?: ReviewStatus) => {
    if (visualDemoMode) return demoTrends[status ?? "total"];
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const pool = status ? reviews.filter((review) => review.status === status) : reviews;
    const current = pool.filter((review) => now - new Date(review.createdAt).getTime() <= sevenDays).length;
    const previous = pool.filter((review) => {
      const age = now - new Date(review.createdAt).getTime();
      return age > sevenDays && age <= sevenDays * 2;
    }).length;
    if (previous === 0) return current > 0 ? `+${current} vs last 7 days` : "Stable vs last 7 days";
    const change = Math.round(((current - previous) / previous) * 100);
    return `${change >= 0 ? "+" : ""}${change}% vs last 7 days`;
  };

  const saveReview = async (
    review: AdminReviewClientRecord,
    updates: Omit<Parameters<typeof updateReviewInApi>[0], "id">
  ) => {
    if (visualDemoMode) {
      setError("");
      setMessage("Demo visual mode: moderation controls are staged and real review data was not changed.");
      return;
    }
    setSavingId(review.id);
    setError("");
    setMessage("");
    try {
      const updated = await updateReviewInApi({ id: review.id, ...updates });
      const refreshedReviews = await readReviewsFromApi();
      setReviews(refreshedReviews ?? ((current) => current.map((item) => (item.id === updated.id ? updated : item))));
      setSelectedId(updated.id);
      setMessage("Review saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review could not be updated.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteReview = (review: AdminReviewClientRecord) => {
    if (visualDemoMode) {
      setError("");
      setMessage("Demo visual mode: delete is only a visual control until real reviews are available.");
      return;
    }
    if (!canEditReview) {
      setError("Missing review moderation permission.");
      setMessage("");
      return;
    }
    setReviewDeleteTarget(review);
  };

  const confirmDeleteReview = async () => {
    if (!reviewDeleteTarget) return;
    const review = reviewDeleteTarget;
    setSavingId(review.id);
    setError("");
    setMessage("");
    try {
      await deleteReviewInApi(review.id);
      const refreshedReviews = await readReviewsFromApi();
      setReviews(refreshedReviews ?? ((current) => current.filter((item) => item.id !== review.id)));
      setSelectedId(null);
      setReviewDeleteTarget(null);
      setMessage("Review deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review could not be deleted.");
    } finally {
      setSavingId(null);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyReviewDraft(products));
    setDraftError("");
    setEditorOpen(true);
  };

  const openEdit = (review: AdminReviewClientRecord) => {
    setEditingId(review.id);
    setDraft({
      productId: review.productId,
      productSlug: review.productSlug,
      customerName: review.customerName,
      rating: review.rating,
      title: review.title || "",
      body: review.body,
      mediaUrls: review.mediaUrls.length > 0 ? review.mediaUrls : [""],
      status: review.status,
      sourceType: review.sourceType === "order-linked" ? "admin-added" : review.sourceType,
      isFeatured: review.isFeatured,
      adminNote: review.adminNote || "",
      createdAt: review.createdAt.slice(0, 10),
    });
    setDraftError("");
    setEditorOpen(true);
  };

  const saveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const canSubmit = editingId ? canEditReview : canManage;
    if (!canSubmit) {
      setDraftError("Missing review management permission.");
      return;
    }
    const product = products.find((item) => item.id === draft.productId);
    const validation = [
      !product && !draft.productSlug.trim() ? "Select a product." : "",
      !draft.customerName.trim() ? "Customer display name is required." : "",
      !draft.body.trim() ? "Review content is required." : "",
    ].filter(Boolean);
    if (validation.length > 0) {
      setDraftError(validation.join(" "));
      return;
    }

    setSavingId(editingId || "new");
    setDraftError("");
    setError("");
    setMessage("");
    try {
      if (visualDemoMode && editingId) {
        setMessage("Demo visual mode: edit is staged and real review data was not changed.");
        setEditorOpen(false);
        setEditingId(null);
        setDraft(emptyReviewDraft(products));
        return;
      }
      const payload: ReviewDraft = {
        ...draft,
        productId: product?.id || "",
        productSlug: product?.slug || draft.productSlug.trim(),
        mediaUrls: validMediaUrls(draft.mediaUrls),
        sourceType: sourceForSubmit(draft.sourceType),
        isFeatured: draft.status === "approved" && draft.isFeatured,
      };
      if (editingId) {
        const updated = await updateReviewInApi({ id: editingId, ...payload });
        const refreshedReviews = await readReviewsFromApi();
        setReviews(refreshedReviews ?? ((current) => current.map((item) => (item.id === updated.id ? updated : item))));
        setSelectedId(updated.id);
        setMessage("Review saved.");
      } else {
        const created = await createReviewInApi(payload);
        const refreshedReviews = await readReviewsFromApi();
        setReviews(refreshedReviews ?? ((current) => [created, ...current]));
        setSelectedId(created.id);
        setMessage("Review added.");
      }
      setEditorOpen(false);
      setEditingId(null);
      setDraft(emptyReviewDraft(products));
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Review could not be saved.");
    } finally {
      setSavingId(null);
    }
  };

  const activityItems = selectedReview
    ? [
        { time: formatDate(selectedReview.createdAt), title: "Review submitted", detail: `By ${selectedReview.customerName} via ${sourceLabels[selectedReview.sourceType]}`, tone: "emerald" },
        { time: formatDate(selectedReview.updatedAt), title: `Marked as ${statusLabels[selectedReview.status].toLowerCase()}`, detail: "Moderation status synchronized", tone: selectedReview.status === "rejected" ? "rose" : selectedReview.status === "hidden" ? "fuchsia" : "cyan" },
        ...(visualDemoMode
          ? [{ time: "10:29 AM", title: "Review flagged", detail: "Contains feature request keyword", tone: "rose" }]
          : []),
        ...(selectedReview.verifiedPurchase && selectedReview.sourceType === "order-linked"
          ? [{ time: formatDate(selectedReview.createdAt), title: "Customer verified", detail: "Order-linked purchase confirmed", tone: "emerald" }]
          : []),
        ...(selectedReview.approvedAt
          ? [{ time: formatDate(selectedReview.approvedAt), title: "Public approval recorded", detail: "Eligible for product page display", tone: "emerald" }]
          : []),
      ]
    : [];

  return (
    <div className="mt-6 space-y-4">
      <AdminConfirmModal
        open={Boolean(reviewDeleteTarget)}
        title="Delete review permanently?"
        description={
          reviewDeleteTarget
            ? `This will permanently delete the review from ${reviewDeleteTarget.customerName}.`
            : undefined
        }
        confirmLabel="Delete Review"
        variant="danger"
        impactItems={["Review is removed from moderation queues.", "Public display eligibility is revoked.", "This action cannot be undone."]}
        loading={Boolean(reviewDeleteTarget && savingId === reviewDeleteTarget.id)}
        onCancel={() => !savingId && setReviewDeleteTarget(null)}
        onConfirm={confirmDeleteReview}
      />
      <section className="relative overflow-hidden rounded-[1.5rem] border border-fuchsia-200/16 bg-[#050b19]/88 p-5 shadow-[0_0_90px_rgba(118,54,255,0.16)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(236,72,255,0.24),transparent_28%),radial-gradient(circle_at_65%_10%,rgba(34,211,238,0.18),transparent_24%),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:auto,auto,42px_42px,42px_42px]" />
        <div className="absolute left-1/2 top-2 h-28 w-[34rem] -translate-x-1/2 rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 blur-sm" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Reviews Command Center</h1>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,255,190,0.9)]" />
                Live
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/62">
              Monitor customer feedback, ensure quality, and build trust.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/62">
              May 13 - May 19, 2026
            </button>
            <button type="button" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/62">
              Export
            </button>
            <button
              type="button"
              onClick={openCreate}
              disabled={!canManage}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/24 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/16 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              New Feedback
            </button>
          </div>
        </div>
        <div className="relative mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
          <ReviewMetricCard label="Total Reviews" value={displayCounts.all} trend={trendFor()} tone="total" />
          <ReviewMetricCard label="Pending Reviews" value={displayCounts.pending} trend={trendFor("pending")} tone="pending" />
          <ReviewMetricCard label="Approved Reviews" value={displayCounts.approved} trend={trendFor("approved")} tone="approved" />
          <ReviewMetricCard label="Hidden Reviews" value={displayCounts.hidden} trend={trendFor("hidden")} tone="hidden" />
          <ReviewMetricCard label="Rejected Reviews" value={displayCounts.rejected} trend={trendFor("rejected")} tone="rejected" />
        </div>
      </section>

      {(message || error || (!canModerate && !visualDemoMode)) && (
        <div className="grid gap-2">
          {message && <div className="rounded-xl border border-emerald-200/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{message}</div>}
          {error && <div className="rounded-xl border border-rose-200/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</div>}
          {!canModerate && !visualDemoMode && <div className="rounded-xl border border-amber-200/20 bg-amber-300/10 p-3 text-sm text-amber-100">Missing review moderation permission. Actions require reviews.manage or reviews.moderate.</div>}
        </div>
      )}

      <section className="rounded-[1.35rem] border border-white/10 bg-[#050b19]/76 p-3">
        <div className="grid gap-2 xl:grid-cols-[minmax(260px,1fr)_160px_150px_150px_150px_160px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fuchsia-100/48" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reviews by content, customer, product..."
              className="h-11 w-full rounded-xl border border-white/10 bg-[#070d1c]/90 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/32 transition focus:border-cyan-200/45"
            />
          </label>
          <CommandSelect label="Product filter" value={productFilter} onChange={setProductFilter}>
            <option value="all">All Products</option>
            {reviewProducts.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </CommandSelect>
          <CommandSelect label="Rating filter" value={ratingFilter} onChange={setRatingFilter}>
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Star</option>)}
          </CommandSelect>
          <CommandSelect label="Source filter" value={sourceFilter} onChange={setSourceFilter}>
            <option value="all">All Sources</option>
            <option value="order-linked">Order-linked</option>
            <option value="admin-added">Customer feedback</option>
            <option value="imported">Imported</option>
          </CommandSelect>
          <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-fuchsia-200/20 bg-fuchsia-300/10 px-3 text-xs font-semibold text-fuchsia-100/72">
            <Filter className="h-3.5 w-3.5" />
            More Filters
          </button>
          <CommandSelect label="Sort" value={sortMode} onChange={(value) => setSortMode(value as SortMode)}>
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-high">Rating High</option>
            <option value="rating-low">Rating Low</option>
          </CommandSelect>
          <div className="flex h-11 items-center rounded-xl border border-white/10 bg-[#070d1c]/90 p-1">
            {[
              { mode: "detail" as const, icon: List },
              { mode: "compact" as const, icon: MonitorDot },
              { mode: "grid" as const, icon: Grid2X2 },
            ].map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`grid h-9 w-9 place-items-center rounded-lg transition ${viewMode === mode ? "bg-fuchsia-300/16 text-fuchsia-100" : "text-white/42 hover:text-white"}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[390px_minmax(0,1fr)_360px]">
        <aside className="rounded-[1.35rem] border border-white/10 bg-[#050b19]/82 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Review Moderation</h2>
            <span className="text-xs text-white/42">
              {visualDemoMode ? "Showing 1 to 5 of 24 reviews" : `Showing ${filteredReviews.length}`}
            </span>
          </div>
          <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  statusFilter === status
                    ? "border-fuchsia-200/32 bg-fuchsia-300/14 text-fuchsia-50 shadow-[0_0_22px_rgba(217,70,239,0.18)]"
                    : "border-white/10 bg-white/[0.03] text-white/54 hover:text-white"
                }`}
              >
                {statusLabels[status]} <span className="text-white/38">{displayCounts[status]}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 max-h-[664px] space-y-2 overflow-y-auto pr-1">
            {filteredReviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/12 bg-black/20 p-5 text-sm text-white/42">No reviews match this command view.</p>
            ) : (
              filteredReviews.map((review) => {
                const product = productForReview(review, displayProducts);
                const active = selectedReview?.id === review.id;
                return (
                  <button
                    key={review.id}
                    type="button"
                    onClick={() => setSelectedId(review.id)}
                    className={`group w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-fuchsia-200/45 bg-fuchsia-300/12 shadow-[0_0_26px_rgba(217,70,239,0.2)]"
                        : "border-white/10 bg-white/[0.035] hover:border-cyan-200/24 hover:bg-cyan-300/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ReviewThumb src={productImage(product, review)} label={product?.name || review.productSlug} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{product?.name || review.productSlug || "Unknown product"}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="truncate text-xs text-white/56">{review.customerName}</span>
                          <Stars value={review.rating} size="h-3 w-3" />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-[0.68rem] text-white/38">{relativeTime(review.createdAt)}</span>
                        <StatusPill status={review.status} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="min-w-0 rounded-[1.35rem] border border-cyan-200/14 bg-[#050b19]/86 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          {!selectedReview ? (
            <div className="grid min-h-[520px] place-items-center rounded-xl border border-dashed border-white/12 bg-black/18 text-sm text-white/42">
              Select a review to inspect moderation detail.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">Review by {selectedReview.customerName}</h2>
                    <StatusPill status={selectedReview.status} />
                    {selectedReview.title && (
                      <span className="rounded-full border border-fuchsia-200/24 bg-fuchsia-300/10 px-2.5 py-1 text-[0.68rem] font-semibold text-fuchsia-100">
                        {selectedReview.title}
                      </span>
                    )}
                    {selectedReview.isFeatured && !visualDemoMode && (
                      <span className="rounded-full border border-fuchsia-200/24 bg-fuchsia-300/10 px-2.5 py-1 text-[0.68rem] font-semibold text-fuchsia-100">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs text-white/42">
                    <span>Review ID: #{selectedReview.id}</span>
                    <Copy className="h-3.5 w-3.5 text-white/46" aria-hidden="true" />
                  </div>
                </div>
                <span className="text-xs text-white/42">Submitted {formatDate(selectedReview.createdAt)}</span>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
                <div className="flex gap-3">
                  <ReviewThumb src={selectedImage} label={selectedProduct?.name || selectedReview.productSlug} className="h-20 w-20 rounded-2xl" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">{selectedProduct?.name || selectedReview.productSlug || "Unknown product"}</h3>
                    <p className="mt-1 text-xs text-white/44">SKU/Slug: {selectedProduct?.slug || selectedReview.productSlug || selectedReview.productId}</p>
                    <Link href={`/product/${selectedProduct?.slug || selectedReview.productSlug}`} className="mt-3 inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/68 transition hover:text-white">
                      View Product
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-white/38">Date</p>
                    <p className="mt-1 text-white/76">{formatDate(selectedReview.createdAt, false)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-white/38">Source</p>
                    <p className="mt-1 text-white/76">{sourceLabels[selectedReview.sourceType]}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-white/38">Verified Purchase</p>
                    <p className="mt-1 text-emerald-100">{selectedReview.sourceType === "order-linked" && selectedReview.verifiedPurchase ? "Yes" : "No"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-white/38">Rating</p>
                    <p className="mt-1"><Stars value={selectedReview.rating} /></p>
                  </div>
                </div>
              </div>

              <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="text-sm font-semibold text-white">Review Content</h3>
                {!visualDemoMode && (
                  <p className="mt-3 text-base font-semibold text-white/88">{selectedReview.title || "Untitled review"}</p>
                )}
                <p className="mt-3 break-words text-sm leading-7 text-white/68 [overflow-wrap:anywhere]">{selectedReview.body}</p>
              </section>

              <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4 xl:grid-cols-[minmax(0,1fr)_110px_110px_120px]">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">Customer Info</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm text-white/82">{selectedReview.customerName}</p>
                    <span className="rounded-full border border-emerald-200/22 bg-emerald-300/10 px-2 py-0.5 text-[0.68rem] font-semibold text-emerald-100">
                      Verified Buyer
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-white/48">
                    <Mail className="h-3.5 w-3.5 text-cyan-100/70" />
                    {selectedReview.customerPhone?.includes("@") ? selectedReview.customerPhone : "fatema.j@example.com"}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-white/48">
                    <MapPin className="h-3.5 w-3.5 text-fuchsia-100/70" />
                    Dhaka, Bangladesh
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/38">Total Reviews</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {visualDemoMode
                      ? 7
                      : displayReviews.filter((review) => review.customerId && review.customerId === selectedReview.customerId).length ||
                        displayReviews.filter((review) => review.customerName === selectedReview.customerName).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/38">Helpful Votes</p>
                  <p className="mt-2 text-lg font-semibold text-white">{visualDemoMode ? 12 : 0}</p>
                </div>
                <div>
                  <p className="text-xs text-white/38">Customer Since</p>
                  <p className="mt-2 text-sm font-semibold text-white">{visualDemoMode ? "Feb 8, 2026" : formatDate(selectedReview.createdAt, false)}</p>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="text-sm font-semibold text-white">Moderation Actions</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  <ReviewActionButton tone="approve" disabled={(!visualDemoMode && !canModerate) || savingId === selectedReview.id || (!visualDemoMode && selectedReview.status === "approved")} onClick={() => saveReview(selectedReview, { status: "approved" })}>
                    <Check className="h-4 w-4" /> Approve
                  </ReviewActionButton>
                  <ReviewActionButton tone="hide" disabled={(!visualDemoMode && !canModerate) || savingId === selectedReview.id || (!visualDemoMode && selectedReview.status === "hidden")} onClick={() => saveReview(selectedReview, { status: "hidden" })}>
                    <Inbox className="h-4 w-4" /> Hide
                  </ReviewActionButton>
                  <ReviewActionButton tone="reject" disabled={(!visualDemoMode && !canModerate) || savingId === selectedReview.id || (!visualDemoMode && selectedReview.status === "rejected")} onClick={() => saveReview(selectedReview, { status: "rejected" })}>
                    <X className="h-4 w-4" /> Reject
                  </ReviewActionButton>
                  <ReviewActionButton tone="edit" disabled={(!visualDemoMode && !canEditReview) || savingId === selectedReview.id} onClick={() => openEdit(selectedReview)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </ReviewActionButton>
                </div>
                <div className="mt-2">
                  <ReviewActionButton tone="delete" disabled={(!visualDemoMode && !canEditReview) || savingId === selectedReview.id} onClick={() => deleteReview(selectedReview)}>
                    <Trash2 className="h-4 w-4" /> Delete Review
                  </ReviewActionButton>
                </div>
              </section>

              <p className="border-t border-white/10 pt-3 text-xs text-white/38">Submitted on {formatDate(selectedReview.createdAt)}. Last updated {formatDate(selectedReview.updatedAt)}.</p>
            </div>
          )}
        </main>

        <aside className="space-y-4">
          <section className="rounded-[1.35rem] border border-white/10 bg-[#050b19]/84 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Eye className="h-4 w-4 text-cyan-100" /> Public Review Preview</h2>
            {selectedReview ? (
              <div className={`mt-3 rounded-xl border p-3 ${selectedReview.status === "approved" ? "border-cyan-200/16 bg-white/[0.035]" : "border-amber-200/18 bg-amber-300/[0.06]"}`}>
                <div className="flex gap-3">
                  <ReviewThumb src={selectedImage} label={selectedProduct?.name || selectedReview.productSlug} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{selectedProduct?.name || selectedReview.productSlug}</p>
                    <Stars value={selectedReview.rating} />
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/52">
                      <span>{selectedReview.customerName}</span>
                      <span className={selectedReview.sourceType === "order-linked" && selectedReview.verifiedPurchase ? "text-emerald-100" : "text-cyan-100/70"}>{publicLabel(selectedReview)}</span>
                    </div>
                  </div>
                  <span className="text-[0.68rem] text-white/38">{formatDate(selectedReview.createdAt, false)}</span>
                </div>
                {selectedReview.status !== "approved" && (
                  <p className="mt-3 rounded-lg border border-amber-200/18 bg-black/20 p-2 text-xs text-amber-100/80">Not public until approved.</p>
                )}
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/68">{selectedReview.body}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/38">
                  <span>Was this review helpful?</span>
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-white/56">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {visualDemoMode ? 12 : 0}
                    </span>
                    <span className="inline-flex items-center gap-1 text-white/42">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {visualDemoMode ? 2 : 0}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-white/12 p-4 text-sm text-white/42">No selected review.</p>
            )}
          </section>

          <section className="rounded-[1.35rem] border border-white/10 bg-[#050b19]/84 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Moderation Activity</h2>
              <button type="button" disabled className="rounded-full border border-fuchsia-200/18 bg-fuchsia-300/10 px-2.5 py-1 text-[0.68rem] font-semibold text-fuchsia-100/58">View All</button>
            </div>
            <div className="mt-3 space-y-3">
              {activityItems.map((item, index) => (
                <div key={`${item.title}-${index}`} className="grid grid-cols-[68px_22px_1fr] gap-2 text-xs">
                  <span className="text-white/40">{item.time}</span>
                  <span className={`mt-1 h-5 w-5 rounded-lg border ${item.tone === "rose" ? "border-rose-200/24 bg-rose-300/12" : item.tone === "fuchsia" ? "border-fuchsia-200/24 bg-fuchsia-300/12" : item.tone === "emerald" ? "border-emerald-200/24 bg-emerald-300/12" : "border-cyan-200/24 bg-cyan-300/12"}`} />
                  <span>
                    <strong className="block text-white/78">{item.title}</strong>
                    <span className="mt-1 block text-white/42">{item.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-white/10 bg-[#050b19]/84 p-4">
            <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "Bulk Approve", icon: Check, tone: "border-emerald-200/20 bg-emerald-300/10 text-emerald-100" },
                { label: "Bulk Hide", icon: Inbox, tone: "border-amber-200/20 bg-amber-300/10 text-amber-100" },
                { label: "Bulk Reject", icon: X, tone: "border-rose-200/20 bg-rose-300/10 text-rose-100" },
                { label: "Manage Filters", icon: SlidersHorizontal, tone: "border-fuchsia-200/20 bg-fuchsia-300/10 text-fuchsia-100" },
                { label: "Review Settings", icon: ShieldCheck, tone: "border-violet-200/20 bg-violet-300/10 text-violet-100" },
              ].map(({ label, icon: Icon, tone }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setError("");
                    setMessage("Bulk review controls are visually staged for this design pass.");
                  }}
                  className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 text-xs font-semibold transition hover:bg-white/[0.08] ${tone}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-white/38"><Zap className="h-3.5 w-3.5 text-emerald-100/70" /> Single-review actions are live. Bulk controls are staged.</p>
          </section>
        </aside>
      </section>

      {editorOpen && (
        <ReviewEditorModal
          draft={draft}
          setDraft={setDraft}
          products={products}
          saving={savingId === "new" || savingId === editingId}
          error={draftError}
          title={editingId ? "Edit review" : "Add customer feedback"}
          onClose={() => {
            setEditorOpen(false);
            setEditingId(null);
            setDraftError("");
          }}
          onSubmit={saveDraft}
          canSave={editingId ? canEditReview : canManage}
        />
      )}
    </div>
  );
}
