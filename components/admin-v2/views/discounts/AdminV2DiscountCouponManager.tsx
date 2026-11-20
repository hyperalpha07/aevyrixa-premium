"use client";

import { useState } from "react";
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { DiscountCoupon } from "@/lib/admin-v2/discounts-store";
import { V2Card } from "@/components/admin-v2/shared/V2Card";

type CouponForm = Omit<DiscountCoupon, "id" | "usageCount" | "maximumDiscount" | "usageLimit" | "startsAt" | "expiresAt"> & { id?: string; maximumDiscount: number | ""; usageLimit: number | ""; startsAt: string; expiresAt: string };

type Redemption = { order_ref: string; coupon_code: string; subtotal_amount: number; discount_amount: number; created_at: string };

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const blank: CouponForm = { code: "", name: "", discountType: "percentage", discountValue: 0, minimumSubtotal: 0, maximumDiscount: "", usageLimit: "", isActive: true, startsAt: "", expiresAt: "" };

function formCoupon(coupon: DiscountCoupon): CouponForm {
  return { ...coupon, maximumDiscount: coupon.maximumDiscount ?? "", usageLimit: coupon.usageLimit ?? "", startsAt: localDateTime(coupon.startsAt), expiresAt: localDateTime(coupon.expiresAt) };
}

export function AdminV2DiscountCouponManager({ initial }: { initial: DiscountCoupon[] | null }) {
  const [coupons, setCoupons] = useState(initial ?? []);
  const [form, setForm] = useState<CouponForm>(blank);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{ code: string; rows: Redemption[] } | null>(null);
  const [historyBusy, setHistoryBusy] = useState(false);

  async function loadHistory(coupon: DiscountCoupon) {
    setMessage("");
    setHistoryBusy(true);
    try {
      const response = await fetch(`/api/admin-v2/discounts/${encodeURIComponent(coupon.id)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null) as { redemptions?: Redemption[]; errors?: string[] } | null;
      if (!response.ok || !Array.isArray(payload?.redemptions)) {
        setMessage(payload?.errors?.join(" ") || "Redemption history is unavailable.");
        return;
      }
      setHistory({ code: coupon.code, rows: payload.redemptions });
    } catch { setMessage("Redemption history is unavailable."); }
    finally { setHistoryBusy(false); }
  }

  const save = async () => {
    const response = await fetch(form.id ? `/api/admin-v2/discounts/${form.id}` : "/api/admin-v2/discounts", {
      method: form.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, discountValue: Number(form.discountValue), minimumSubtotal: Number(form.minimumSubtotal), maximumDiscount: form.maximumDiscount === "" ? null : Number(form.maximumDiscount), usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit) }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.errors?.join(" ") ?? "Save failed.");
      return;
    }
    setCoupons((current) => form.id ? current.map((coupon) => coupon.id === payload.coupon.id ? payload.coupon : coupon) : [payload.coupon, ...current]);
    setOpen(false);
    setMessage("Coupon saved.");
  };

  return <>
    <V2Card><Stack spacing={1.5}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Coupon codes</Typography>
        <Button variant="contained" onClick={() => { setForm(blank); setOpen(true); }}>Create code</Button>
      </Stack>
      {!initial ? <Alert severity="warning">Coupon source unavailable. No campaign data is substituted.</Alert> : coupons.length ? coupons.map((coupon) => <Stack key={coupon.id} direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", borderTop: 1, borderColor: "divider", pt: 1.5 }}>
        <div><Typography sx={{ fontWeight: 700 }}>{coupon.code} · {coupon.name}</Typography><Typography variant="body2" color="text.secondary">{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `BDT ${coupon.discountValue}`} · Used {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""} · {coupon.expiresAt ? `Expires ${new Date(coupon.expiresAt).toLocaleDateString()}` : "No expiry"}</Typography></div>
        <Stack direction="row" spacing={1}><Chip size="small" label={coupon.isActive ? "Active" : "Inactive"} color={coupon.isActive ? "success" : "default"} /><Button size="small" onClick={() => { setForm(formCoupon(coupon)); setOpen(true); }}>Edit</Button><Button size="small" disabled={historyBusy} onClick={() => void loadHistory(coupon)}>History</Button></Stack>
      </Stack>) : <Alert severity="info">No coupon codes have been created.</Alert>}
    </Stack></V2Card>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>{form.id ? "Edit coupon" : "Create coupon"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {(["code", "name", "discountValue", "minimumSubtotal", "maximumDiscount", "usageLimit"] as const).map((key) => <TextField key={key} label={{ code: "Code", name: "Name", discountValue: "Discount value", minimumSubtotal: "Minimum subtotal", maximumDiscount: "Maximum discount", usageLimit: "Usage limit" }[key]} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />)}
      <TextField select label="Type" value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value as CouponForm["discountType"] })}><MenuItem value="percentage">Percentage</MenuItem><MenuItem value="fixed">Fixed BDT</MenuItem></TextField>
      <TextField type="datetime-local" label="Starts at" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
      <TextField type="datetime-local" label="Expires at" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
      <Button onClick={() => setForm({ ...form, isActive: !form.isActive })}>{form.isActive ? "Deactivate" : "Activate"}</Button>
    </Stack></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={() => void save()}>Save</Button></DialogActions></Dialog>
    <Dialog open={history !== null} onClose={() => setHistory(null)} fullWidth maxWidth="sm">
      <DialogTitle>Redemption history{history ? ` · ${history.code}` : ""}</DialogTitle>
      <DialogContent>
        {history?.rows.length ? <Stack spacing={1.5} sx={{ pt: 1 }}>
          {history.rows.map((entry) => <Typography key={entry.order_ref} variant="body2">
            {entry.order_ref} · BDT {Number(entry.discount_amount).toLocaleString("en-BD")} discount · {new Date(entry.created_at).toLocaleString()}
          </Typography>)}
        </Stack> : <Alert severity="info">No recorded redemptions.</Alert>}
      </DialogContent>
      <DialogActions><Button onClick={() => setHistory(null)}>Close</Button></DialogActions>
    </Dialog>
    {message ? <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert> : null}
  </>;
}
