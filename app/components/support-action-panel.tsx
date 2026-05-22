"use client";

import Link from "next/link";
import { Headset, MessageCircle, PackageSearch, PhoneCall } from "lucide-react";

export default function SupportActionPanel({
  whatsappUrl,
}: {
  whatsappUrl: string;
}) {
  const openLiveChat = () => {
    const openEvent = new CustomEvent("aevyrixa:open-live-chat", {
      cancelable: true,
    });

    if (window.dispatchEvent(openEvent)) window.location.assign("/contact");
  };

  return (
    <div className="mt-5 grid gap-2.5 min-[430px]:grid-cols-2">
      <button
        type="button"
        onClick={openLiveChat}
        className="aev-button-primary aev-intent-card aev-intent-support inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold text-white"
      >
        <MessageCircle className="h-4 w-4" />
        Live Chat
      </button>
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="aev-button-secondary aev-intent-card aev-intent-delivery inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
        >
          <PhoneCall className="h-4 w-4" />
          WhatsApp
        </a>
      ) : (
        <Link
          href="/contact"
          className="aev-button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
        >
          <Headset className="h-4 w-4" />
          Contact Details
        </Link>
      )}
      <Link
        href="/track-order"
        className="aev-button-ghost aev-intent-card aev-intent-orders inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
      >
        <PackageSearch className="h-4 w-4" />
        Track Order
      </Link>
    </div>
  );
}
