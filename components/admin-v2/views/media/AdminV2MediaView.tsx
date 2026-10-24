import Link from "next/link";
import { Alert, Box, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import type { AdminV2ProductCatalogData } from "@/lib/admin-v2/products";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

export function AdminV2MediaView({data,canManage}:{data:AdminV2ProductCatalogData;canManage:boolean}) {
 const referenced=data.products.flatMap(product=>product.imageUrls.map(url=>({product,url})));
 const unique=new Set(referenced.map(x=>x.url)).size;
 return <>
  <V2PageHeader title="Media Library" description="Verified product-media references from the actual persisted catalog, not estimated storage usage or sample media."
   breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Media"}]}
   actions={<Button component={Link} href="/admin-v2/products" variant="outlined">All products</Button>}/>
  <Stack spacing={2}>
   {!data.available?<Alert severity="error">Catalog media source is unavailable. Static and demo media are not substituted.</Alert>:null}
   <Alert severity="info">This view counts product-linked image references, not files in cloud storage. Use a product's Media Editor for actual uploads; no bulk media upload or invented folder counts are available here.</Alert>
   <Stack direction="row" spacing={1} sx={{flexWrap:"wrap"}}>
    <Chip label={data.available?`${data.products.length} real products`:"Products unavailable"} variant="outlined"/>
    <Chip label={data.available?`${unique} unique media references`:"Media unavailable"} variant="outlined"/>
   </Stack>
   <Grid container spacing={2}>
    {data.available && referenced.map(({product,url},index)=>(
     <Grid key={`${product.id}-${index}`} size={{xs:12,sm:6,lg:4,xl:3}}>
      <V2Card>
       <Stack spacing={1.5}>
        <Box component="img" src={url} alt={product.name} sx={{height:160,width:"100%",objectFit:"cover",borderRadius:2,bgcolor:"action.hover"}}/>
        <Typography variant="body2" sx={{fontWeight:700}}>{product.name}</Typography>
        <Typography variant="caption" sx={{wordBreak:"break-all"}} color="text.secondary">{url}</Typography>
        <Button component={Link} size="small" variant="outlined" href={canManage?
          `/admin-v2/products/${encodeURIComponent(product.id)}/media`:
          `/admin-v2/products/${encodeURIComponent(product.id)}`}>
          {canManage?"Manage product media":"View product"}
        </Button>
       </Stack>
      </V2Card>
     </Grid>
    ))}
   </Grid>
   {data.available && !referenced.length?<Alert severity="info">No persisted product-media references found.</Alert>:null}
  </Stack>
 </>;
}
