import AccountOrderDetailClient from "@/app/account/orders/[reference]/order-detail-client";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return <AccountOrderDetailClient reference={reference} />;
}
