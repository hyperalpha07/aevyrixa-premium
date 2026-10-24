import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
 activeEditPayload, activeEditQuery, draftEditInitialValues, isEditableActive,
 persistActiveEdit, type DraftEditRequest,
} from "../lib/admin-v2/product-edit.ts";

const read=(p:string)=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const id="b11d7a23-eef6-4d2d-9f7c-0ce50f1b5a13";
const row={
 id,status:"active",deleted_at:null,updated_at:"2026-10-23T12:00:00.000Z",
 name:"Live Comfort Panty",slug:"live-comfort-panty",category:"Comfort Panty",price:790,
 compare_at_price:990,short_description:"Comfort",description:"Comfortable daily wear",stock_status:"in_stock",
 stock_quantity:12,sizes:["S","M"],colors:["Rose"],benefits:["Gentle"],care:["Wash cold"],
 absorbency:"Moderate",seo_title:"Comfort Panty",seo_description:"Soft",
 merchandising:{lowStockThreshold:3,isTrending:true,isBestSeller:true,isNewArrival:true,
 showOnHomepage:true,showInFeaturedCollection:true},
 image_url:"https://example.com/original.webp",featured:true,
};

test("Active editor preserves published status, merchandising flags and image",()=>{
 const form=draftEditInitialValues(row);
 const {input,payload}=activeEditPayload(form,row.merchandising);
 assert.ok(input);
 assert.ok(payload);
 assert.equal(Object.hasOwn(payload!,"status"),false);
 assert.equal(Object.hasOwn(payload!,"featured"),false);
 assert.equal(Object.hasOwn(payload!,"image_url"),false);
 assert.deepEqual(payload?.merchandising,row.merchandising);
 assert.equal(payload?.stock_quantity,12);
 assert.equal(activeEditQuery(id).get("status"),"eq.active");
 assert.equal(isEditableActive(row),true);
 assert.equal(isEditableActive({...row,status:"draft"}),false);
});

test("Persisted active editor uses fresh read, slug uniqueness, conditional PATCH and return state",async()=>{
 const form=draftEditInitialValues(row);
 const calls:Array<{query:string;method:string;body?:any}>=[];
 const request:DraftEditRequest=async(query,init)=>{
  calls.push({query:query.toString(),method:init?.method??"GET",body:init?.body?JSON.parse(String(init.body)):undefined});
  if(init?.method==="PATCH")return Response.json([{id,status:"active"}]);
  if(query.has("slug"))return Response.json([]);
  return Response.json([row]);
 };
 const result=await persistActiveEdit(id,form,request);
 assert.equal(result.saved,true);
 assert.equal(calls.length,3);
 assert.equal(calls[2].method,"PATCH");
 assert.ok(calls[2].query.includes("status=eq.active"));
 assert.ok(calls[2].query.includes("updated_at"));
 assert.equal(calls[2].body.status,undefined);
 assert.equal(calls[2].body.featured,undefined);
 assert.equal(calls[2].body.image_url,undefined);
 assert.equal(calls[2].body.merchandising.isTrending,true);
 assert.equal(calls[2].body.merchandising.showOnHomepage,true);
});

test("Active edit denies draft, deleted, duplicate slugs and stale writes",async()=>{
 const form=draftEditInitialValues(row);
 const draft:DraftEditRequest=async()=>Response.json([{...row,status:"draft"}]);
 assert.ok((await persistActiveEdit(id,form,draft)).errors.some(x=>x.includes("no longer active")));
 const stale:DraftEditRequest=async(query,init)=>init?.method==="PATCH"?Response.json([]):query.has("slug")?Response.json([]):Response.json([row]);
 assert.ok((await persistActiveEdit(id,form,stale)).errors.some(x=>x.includes("concurrently")));
 const duplicated:DraftEditRequest=async(query)=>query.has("slug")?Response.json([{id:"other"}]):Response.json([row]);
 assert.ok((await persistActiveEdit(id,form,duplicated)).fields.slug);
});

test("Published editor is accessed only via product editor RBAC, and doesn't trigger publication",()=>{
 const page=read("app/admin-v2/products/[productId]/edit/page.tsx");
 const actions=read("app/admin-v2/products/[productId]/edit/actions.ts");
 const detail=read("components/admin-v2/views/products/AdminV2ProductDetailView.tsx");
 assert.ok(page.includes('requireAdminV2RouteAccess(session, "productEdit")'));
 assert.ok(page.includes("isEditableActive(product)"));
 assert.ok(actions.includes('hasPermission(session, "products.edit")'));
 assert.ok(actions.includes("persistActiveEdit(id"));
 assert.ok(detail.includes('product.status === "active" ? "Edit active" : "Edit draft"'));
 const ui=read("components/admin-v2/views/products/AdminV2EditProductView.tsx");
 assert.ok(ui.includes("Save active product"));
 assert.ok(ui.includes('status === "active" ? saveAdminV2ActiveProduct'));
});
