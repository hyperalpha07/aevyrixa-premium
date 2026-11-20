import Link from "next/link";
import { Alert, Button, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import type { AdminV2ProductCatalogData } from "@/lib/admin-v2/products";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import { AdminV2DiscountCouponManager } from "@/components/admin-v2/views/discounts/AdminV2DiscountCouponManager";
import type { DiscountCoupon } from "@/lib/admin-v2/discounts-store";

export function AdminV2DiscountsView({catalog,freeDeliveryThreshold,coupons}:{
 catalog:AdminV2ProductCatalogData;freeDeliveryThreshold:string|null;coupons:DiscountCoupon[]|null;
}){
 const markdowns=catalog.products.filter(p=>p.status==="active"&&p.compareAtPrice!==null&&p.compareAtPrice>p.price&&p.price>=0);
 const threshold=freeDeliveryThreshold!==null && Number.isFinite(Number(freeDeliveryThreshold))
  ? Number(freeDeliveryThreshold):null;
 return <>
  <V2PageHeader title="Discounts & Offers" description="Only actual catalog markdowns and configured delivery threshold; no invented campaigns, coupons or redemption totals."
   breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Discounts"}]}
   actions={<Button component={Link} href="/admin-v2/products" variant="outlined">Products</Button>}/>
  <Stack spacing={2}>
   {!catalog.available?<Alert severity="error">Product pricing source unavailable. Discounts cannot be calculated safely.</Alert>:null}
   <Alert severity="info">Catalog markdowns and free delivery remain separate from coupon codes. Coupon reductions are calculated only by the checkout transaction.</Alert>
   <AdminV2DiscountCouponManager initial={coupons} />
   <Stack direction="row" spacing={1} sx={{flexWrap:"wrap"}}>
    <Chip variant="outlined" label={catalog.available?`${markdowns.length} active product markdowns`:"Markdowns unavailable"} />
    <Chip variant="outlined" label={threshold===null?"Free shipping setting unavailable":threshold>0?`Free delivery from BDT ${threshold}`:"No positive free-delivery threshold"} />
   </Stack>
   <V2Card>
    <Typography variant="h6" sx={{mb:2}}>Active catalog markdowns</Typography>
    {catalog.available ? <TableContainer><Table size="small" aria-label="Verified product markdowns">
     <TableHead><TableRow><TableCell>Product</TableCell><TableCell>Current price</TableCell><TableCell>Comparison price</TableCell><TableCell>Difference</TableCell><TableCell>Open</TableCell></TableRow></TableHead>
     <TableBody>
      {markdowns.map(product=><TableRow key={product.id}>
       <TableCell>{product.name}</TableCell>
       <TableCell>{product.currency} {product.price.toLocaleString("en-BD")}</TableCell>
       <TableCell>{product.currency} {product.compareAtPrice?.toLocaleString("en-BD")}</TableCell>
       <TableCell>{Math.round((1-product.price/(product.compareAtPrice??product.price))*100)}% below comparison price</TableCell>
       <TableCell><Button size="small" component={Link} href={`/admin-v2/products/${encodeURIComponent(product.id)}`}>Details</Button></TableCell>
      </TableRow>)}
      {markdowns.length===0?<TableRow><TableCell colSpan={5}>No active product markdowns.</TableCell></TableRow>:null}
     </TableBody>
    </Table></TableContainer> : null}
   </V2Card>
  </Stack>
 </>;
}
