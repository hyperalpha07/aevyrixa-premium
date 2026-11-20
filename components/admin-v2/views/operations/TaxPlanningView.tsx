"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Chip, Stack, TextField, Typography } from "@mui/material";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import type { TaxPlanningProfile } from "@/lib/admin-v2/operations-store";

type Draft={registration_number:string;tax_rate_percent:string;reporting_notes:string};
const empty:Draft={registration_number:"",tax_rate_percent:"0",reporting_notes:""};
function fromProfile(p:TaxPlanningProfile|null):Draft{
 return p?{registration_number:p.registration_number,tax_rate_percent:String(p.tax_rate_percent),reporting_notes:p.reporting_notes}:empty;
}

export function TaxPlanningView({
 initial,canManage,
}:{
 initial:{available:boolean;profile:TaxPlanningProfile|null};
 canManage:boolean;
}){
 const [profile,setProfile]=useState(initial.profile);
 const [form,setForm]=useState<Draft>(fromProfile(initial.profile));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const rate=Number(form.tax_rate_percent);
 async function save(){
  if(!initial.available||!canManage||busy)return;
  setBusy(true);setError("");setMessage("");
  try{
   const r=await fetch("/api/admin-v2/tax",{
    method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({registration_number:form.registration_number,
     tax_rate_percent:rate,reporting_notes:form.reporting_notes,version:profile?.version??null}),
   });
   const data=await r.json() as {profile?:TaxPlanningProfile;errors?:string[]};
   if(!r.ok||!data.profile)throw new Error(data.errors?.join(" ")||"Tax planning profile not saved.");
   setProfile(data.profile);setForm(fromProfile(data.profile));
   setMessage("Tax planning profile saved. Checkout prices, invoices and official filings are unchanged.");
  }catch(e){setError(e instanceof Error?e.message:"Save failed.");}
  finally{setBusy(false);}
 }
 return <>
  <V2PageHeader title="Tax" description="Real persisted tax-planning settings, clearly separated from collected tax and statutory filings."
   breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Tax"}]}
   actions={<Button component={Link} href="/admin-v2/billing" variant="outlined">Finance overview</Button>}/>
  <Stack spacing={2}>
   <Alert severity="warning">
    No verified tax charge is recorded in the current order schema. This module does not modify checkout totals,
    historical invoices, receipts, refund amounts or government filings. Confirm the applicable jurisdiction,
    rate and registration status with your accountant before any future tax-calculation rollout.
   </Alert>
   {!initial.available?<Alert severity="error">Tax planning database unavailable. Nothing is shown as saved.</Alert>:null}
   {!canManage?<Alert severity="info">Read-only. Editing requires tax.manage.</Alert>:null}
   {error?<Alert severity="error">{error}</Alert>:null}
   {message?<Alert severity="success">{message}</Alert>:null}
   <V2Card>
    <Stack spacing={2}>
     <Stack direction="row" spacing={1} sx={{justifyContent:"space-between",alignItems:"center"}}>
      <Typography variant="h6">Bangladesh tax planning profile</Typography>
      <Chip size="small" label="Draft — not applied" variant="outlined"/>
     </Stack>
     <TextField label="Jurisdiction" value="Bangladesh (BD)" disabled fullWidth/>
     <TextField label="Registration / BIN reference (optional)" value={form.registration_number}
      onChange={e=>setForm(f=>({...f,registration_number:e.target.value}))}
      disabled={!canManage||!initial.available||busy} fullWidth
      slotProps={{htmlInput:{maxLength:80}}} helperText="Stored only for internal planning; not printed on invoices."/>
     <TextField label="Planned rate (%)" type="number" fullWidth value={form.tax_rate_percent}
      onChange={e=>setForm(f=>({...f,tax_rate_percent:e.target.value}))}
      disabled={!canManage||!initial.available||busy}
      slotProps={{htmlInput:{min:0,max:100,step:0.01}}}
      helperText="Reference rate only. No charges are calculated from this value."/>
     <TextField label="Reporting and accountant notes" multiline minRows={4} fullWidth value={form.reporting_notes}
      onChange={e=>setForm(f=>({...f,reporting_notes:e.target.value}))}
      disabled={!canManage||!initial.available||busy} slotProps={{htmlInput:{maxLength:3000}}}/>
     <Stack direction="row" spacing={1} sx={{flexWrap:"wrap",alignItems:"center"}}>
      <Button variant="contained" disabled={!canManage||!initial.available||busy||!Number.isFinite(rate)||rate<0||rate>100||Math.round(rate*100)!==rate*100} onClick={()=>void save()}>
       {busy?"Saving...":"Save planning profile"}
      </Button>
      <Chip label="Checkout tax: disabled" size="small" variant="outlined"/>
      <Chip label="Tax filing: not integrated" size="small" variant="outlined"/>
     </Stack>
     {profile?<Typography color="text.secondary" variant="caption">Last saved {new Date(profile.updated_at).toLocaleString()}. Revision {profile.version}. Simultaneous edits are rejected.</Typography>:
      <Typography color="text.secondary" variant="body2">No persisted tax profile. Save to create one.</Typography>}
    </Stack>
   </V2Card>
  </Stack>
 </>;
}
