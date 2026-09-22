"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Package, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/app/lib/currency";
import { accountStatusChipClass as statusChipClass, formatAccountDate as formatDate, readableAccountValue as readable } from "@/app/account/_shared/account-format";
import type { AccountOrder } from "@/app/account/_shared/account-types";
import { firstOrderImage } from "@/app/account/orders/account-orders-model";

function orderDetailHref(orderRef: string) {
  return `/account/orders/${encodeURIComponent(orderRef)}`;
}

function trackOrderHref(order: AccountOrder) {
  const params = new URLSearchParams({ ref: order.orderRef });
  if (order.customerPhone) params.set("phone", order.customerPhone);
  return `/track-order?${params.toString()}`;
}

function OrderThumbnail({ image, name }: { image: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="aev-account-order-thumbnail">
    {image && !failed ? <Image src={image} alt={name} fill sizes="80px" unoptimized onError={() => setFailed(true)} /> : <Package size={25} aria-label="Product image unavailable" />}
  </div>;
}

export function DetailedOrderRows({ orders, onSelect, emptyMessage }: { orders: AccountOrder[]; onSelect?: (orderRef: string) => void; emptyMessage?: string }) {
  if (orders.length === 0) {
    return (
      <div className="aev-account-orders-empty">
        <span className="aev-account-orders-empty-icon">
          <ShoppingBag className="h-6 w-6" />
        </span>
        <h3>{emptyMessage ? "No matching orders" : "No orders yet"}</h3>
        <p>{emptyMessage ?? "Your Noromi Care orders will appear here after they are placed."}</p>
        {!emptyMessage && <Link href="/product" className="aev-account-care-cta">
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>}
      </div>
    );
  }
  return (
    <div className="aev-account-order-list">
      {orders.map((order, index) => {
        const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
        const deliveryArea = order.deliveryArea || order.cityArea || order.deliveryZone;
        const firstItem = order.items[0];
        const firstImage = firstOrderImage(order.items);

        return (
          <article
            key={order.orderRef}
            className={`aev-account-order-card is-variant-${(index % 3) + 1}`}
          >
            <div className="aev-account-order-card-content">
              <div className="aev-account-order-card-primary">
                <OrderThumbnail key={firstImage ?? order.orderRef} image={firstImage} name={firstItem?.name ?? "Ordered product"} />
                <div className="aev-account-order-main-info">
                <div className="aev-account-order-title-line">
                  <p className="aev-account-order-reference" title={order.orderRef}>
                    {order.orderRef}
                  </p>
                  <span className={`aev-account-order-status border capitalize ${statusChipClass(order.status)}`}>
                    {readable(order.status)}
                  </span>
                </div>
                <p className="aev-account-order-placed">Placed {formatDate(order.createdAt)}</p>
                <p className="aev-account-order-product" title={firstItem?.name}>{firstItem?.name ?? "Order items unavailable"}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}</p>
                {firstItem?.variant && <p className="aev-account-order-variant" title={firstItem.variant}>{firstItem.variant}</p>}

                <div className="aev-account-order-meta-grid">
                  <OrderMeta label="Items" value={`${itemCount} ${itemCount === 1 ? "item" : "items"}`} />
                  <OrderMeta label="Payment" value={readable(order.paymentMethod)} />
                  {deliveryArea && <OrderMeta label="Delivery area" value={deliveryArea} />}
                  {order.deliveryStatus && <OrderMeta label="Delivery" value={readable(order.deliveryStatus)} />}
                </div>

                </div>
              </div>

              <div className="aev-account-order-card-actions">
                <div className="aev-account-order-total">
                  <p>Total</p>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(order.orderRef)}
                    className="mini-action min-h-10 w-full justify-center"
                  >
                    View details
                  </button>
                ) : (
                  <Link className="mini-action min-h-10 w-full justify-center text-center" href={orderDetailHref(order.orderRef)}>
                    View details
                  </Link>
                )}
                <div className="aev-account-order-secondary-actions">
                  {order.customerPhone && (
                    <Link className="mini-action min-h-10 flex-1 justify-center text-center" href={trackOrderHref(order)}>
                      Track order
                    </Link>
                  )}
                  <Link className="mini-action min-h-10 flex-1 justify-center text-center" href="/account/support">
                    Get support
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function OrderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9C91AA]/64">{label}</p>
      <p className="mt-1 break-words text-xs font-medium capitalize text-[#E9DEEF]/82 [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

