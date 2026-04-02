export type ShopifyCheckoutItem = {
  id: string;
  slug: string;
  shopifyHandle: string;
  shopifyVariantId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export function validateShopifyCheckoutItems(items: ShopifyCheckoutItem[]) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      ok: false,
      message: "Your cart is empty.",
    };
  }

  for (const item of items) {
    if (!item.shopifyVariantId || !item.shopifyHandle) {
      return {
        ok: false,
        message: `Missing Shopify data for ${item.name}.`,
      };
    }
  }

  return {
    ok: true,
    message: "Checkout data is ready.",
  };
}

export function buildShopifyCheckoutPayload(items: ShopifyCheckoutItem[]) {
  return items.map((item) => ({
    variantId: item.shopifyVariantId,
    quantity: item.quantity,
    title: item.name,
    handle: item.shopifyHandle,
  }));
}

export async function startShopifyCheckout(
  items: ShopifyCheckoutItem[]
): Promise<{
  ok: boolean;
  message: string;
  checkoutUrl?: string;
  payload?: ReturnType<typeof buildShopifyCheckoutPayload>;
}> {
  const validation = validateShopifyCheckoutItems(items);

  if (!validation.ok) {
    return {
      ok: false,
      message: validation.message,
    };
  }

  const payload = buildShopifyCheckoutPayload(items);

  return {
    ok: true,
    message:
      "Shopify checkout handoff structure is ready. Real checkout URL will be connected in the next phase.",
    payload,
    checkoutUrl: "",
  };
}