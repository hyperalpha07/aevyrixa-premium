import { Alert, Stack } from "@mui/material";
import type { AdminV2ProductCatalogData } from "@/lib/admin-v2/products";
import type { MediaLibraryStorageObject } from "@/lib/admin-v2/product-media-store";
import { V2Button } from "@/components/admin-v2/shared/V2Button";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { AdminV2MediaLibraryClient } from "@/components/admin-v2/views/media/AdminV2MediaLibraryClient";

export function AdminV2MediaView({ data, library, canManage }: { data: AdminV2ProductCatalogData; library: { available: boolean; items: MediaLibraryStorageObject[] }; canManage: boolean }) {
  return <>
    <V2PageHeader title="Media Library" description="Real images in the dedicated Admin V2 library and existing product-linked media. Product association uses the current product media workflow."
      breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: "Media" }]}
      actions={<V2Button href="/admin-v2/products" variant="outlined">All products</V2Button>} />
    <Stack spacing={2}>
      {!data.available ? <Alert severity="error">The product catalog is unavailable. Product-linked media cannot be verified.</Alert> : null}
      {!library.available ? <Alert severity="warning">The dedicated media-library storage prefix is unavailable. Existing product media remains unchanged.</Alert> : null}
      <AdminV2MediaLibraryClient catalog={data} initialLibraryItems={library.items} canManage={canManage} />
    </Stack>
  </>;
}
