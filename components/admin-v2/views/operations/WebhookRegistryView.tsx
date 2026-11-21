"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, Chip, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import type { WebhookInput, WebhookSubscriptionDraft } from "@/lib/admin-v2/operations-store";

const blank:WebhookInput={label:"",event_type:"order.created",destination_url:""};
const eventTypes=["order.created","order.updated","payment.recorded","refund.recorded"] as const;

export function WebhookRegistryView({initial,canManage}:{
 initial:WebhookSubscriptionDraft[]|null;
 canManage:boolean;
}){
 const [records,setRecords]=useState(initial??[]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [form,setForm]=useState<WebhookInput>(blank);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const selected=records.find(x=>x.id===selectedId)??null;

 function choose(item:WebhookSubscriptionDraft|null){
  setSelectedId(item?.id??null);
  setForm(item?{label:item.label,event_type:item.event_type,destination_url:item.destination_url}:blank);
  setMessage("");setError("");
 }
 async function save(archive=false){
  if(!canManage||!initial||busy)return;
  if(archive&&(!selected||!window.confirm("Archive this disabled webhook registration?")))return;
  setBusy(true);setError("");setMessage("");
  try{
   const r=await fetch("/api/admin-v2/webhooks",{
    method:selected?"PATCH":"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(selected?{...form,id:selected.id,version:selected.version,archive}:form),
   });
   const payload=await r.json() as {subscription?:WebhookSubscriptionDraft;errors?:string[]};
   if(!r.ok||!payload.subscription)throw new Error(payload.errors?.join(" ")||"Webhook registration not saved.");
   const record=payload.subscription;
   setRecords(old=>archive?old.filter(x=>x.id!==record.id):[record,...old.filter(x=>x.id!==record.id)]);
   choose(archive?null:record);
   setMessage(archive?"Webhook registration archived.": "Webhook destination saved as DISABLED; no network request was sent.");
  }catch(e){setError(e instanceof Error?e.message:"Save failed.");}
  finally{setBusy(false);}
 }

 return <>
  <V2PageHeader title="Webhooks" description="Persisted outbound event destination registry, reserved for later verified delivery."
   breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Webhooks"}]}
   actions={<Button variant="outlined" component={Link} href="/admin-v2/integrations">Provider onboarding</Button>}/>
  <Stack spacing={2}>
   <Alert severity="warning">
    This registry never sends HTTP requests, accepts external callbacks, signs payloads, or claims delivery.
    Connections remain disabled until a verified delivery adapter, signing secret, destination allowlist,
    retry policy, and delivery audit are implemented and tested.
   </Alert>
   {!initial?<Alert severity="error">Webhook registry unavailable. No saved endpoints are assumed.</Alert>:null}
   {!canManage?<Alert severity="info">Read-only. Editing requires webhooks.manage.</Alert>:null}
   {error?<Alert severity="error">{error}</Alert>:null}{message?<Alert severity="success">{message}</Alert>:null}
   <Box sx={{display:"grid",gridTemplateColumns:{xs:"minmax(0,1fr)",lg:"minmax(270px,0.85fr) minmax(0,2.15fr)"},gap:2,alignItems:"start"}}>
    <V2Card sx={{width:"100%",minWidth:0}}>
     <Stack spacing={1.25} sx={{minWidth:{lg:270}}}>
      <Typography variant="h6">Reserved destinations ({initial?records.length:"Unavailable"})</Typography>
      {canManage?<Button variant="outlined" disabled={!initial||busy} onClick={()=>choose(null)}>New destination</Button>:null}
      <Divider/>
      {!records.length?<Typography variant="body2" color="text.secondary">No saved webhook destinations.</Typography>:null}
      {records.map(item=><Button key={item.id} variant={selectedId===item.id?"contained":"text"}
       sx={{textTransform:"none",justifyContent:"flex-start",textAlign:"left"}}
       disabled={busy} onClick={()=>choose(item)}>
       <Stack spacing={0.25} sx={{minWidth:0}}>
        <Typography variant="body2" sx={{fontWeight:700}}>{item.label}</Typography>
        <Typography variant="caption" color="text.secondary">{item.event_type} · Disabled · v{item.version}</Typography>
       </Stack>
      </Button>)}
     </Stack>
    </V2Card>
    <V2Card sx={{width:"100%",minWidth:0}}>
     <Stack spacing={2}>
      <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between"}}>
       <Typography variant="h6">{selected?"Edit destination":"Reserve destination"}</Typography>
       <Chip label="Delivery disabled" size="small" variant="outlined"/>
      </Stack>
      <TextField label="Connection label" fullWidth value={form.label} disabled={!initial||!canManage||busy}
       onChange={e=>setForm(f=>({...f,label:e.target.value}))} slotProps={{htmlInput:{maxLength:120}}}/>
      <TextField select label="Event type" fullWidth value={form.event_type} disabled={!initial||!canManage||busy}
       onChange={e=>setForm(f=>({...f,event_type:e.target.value as WebhookInput["event_type"]}))}>
       {eventTypes.map(t=><MenuItem key={t} value={t}>{t}</MenuItem>)}
      </TextField>
      <TextField label="Future HTTPS receiving URL" fullWidth value={form.destination_url}
       disabled={!initial||!canManage||busy} onChange={e=>setForm(f=>({...f,destination_url:e.target.value}))}
       slotProps={{htmlInput:{maxLength:300}}}
       helperText="Public HTTPS domain only; no localhost, private IP, URL credentials, query strings, fragments or alternate port."/>
      {selected?<Typography variant="caption" color="text.secondary">
       Revision {selected.version}. Last saved {new Date(selected.updated_at).toLocaleString()}. External delivery is not active.
      </Typography>:null}
      <Stack direction="row" spacing={1} sx={{flexWrap:"wrap"}}>
       <Button variant="contained" disabled={!initial||!canManage||busy||!form.label||!form.destination_url}
        onClick={()=>void save()}>{busy?"Saving...":"Save disabled destination"}</Button>
       {selected&&canManage?<Button color="error" variant="outlined" disabled={busy} onClick={()=>void save(true)}>Archive</Button>:null}
      </Stack>
     </Stack>
    </V2Card>
   </Box>
  </Stack>
 </>;
}
