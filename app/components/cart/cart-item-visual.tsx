"use client";

import Image from "next/image";
import { useState } from "react";
import ProductVisual from "@/app/components/product-visual";
import type { CartItem } from "@/app/components/cart/cart-context";

const PUBLIC_PRODUCT_IMAGE_HOST = "jafsinalgymjqhkqjqzb.supabase.co";

function isPublicProductImageUrl(value: string) {
  if (value.startsWith("/")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === PUBLIC_PRODUCT_IMAGE_HOST;
  } catch {
    return false;
  }
}

export default function CartItemVisual({
  item,
  sizes,
}: {
  item: CartItem;
  sizes: string;
}) {
  const [failedImage, setFailedImage] = useState("");
  const imageUrl = isPublicProductImageUrl(item.image) ? item.image : "";
  const showImage = Boolean(imageUrl && failedImage !== imageUrl);

  if (!showImage) {
    return (
      <ProductVisual
        visualTheme={item.visualTheme}
        label={item.absorbency || "Noromi Care"}
        compact
      />
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={item.name}
      fill
      sizes={sizes}
      className="object-cover"
      onError={() => setFailedImage(imageUrl)}
    />
  );
}
