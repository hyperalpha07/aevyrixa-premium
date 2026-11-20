"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Chip, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import type { TaskAutomationRule, TaskAutomationRun, TaskRuleInput } from "@/lib/admin-v2/operations-store";

const blank:TaskRuleInput={
 name:"",is_enabled:false,schedule_mode:"manual",task_title:"",
 task_description:"",task_priority:"normal",assignee_label:"",
};

export function AutomationOperationsView({initial,canManage,schedulerConfigured}:{
 initial:{rules:TaskAutomationRule[];runs:TaskAutomationRun[]}|null;
 canManage:boolean;
 schedulerConfigured:boolean;
}) {
 const [rules,setRules]=useState(initial?.rules??[]);
 const [runs,setRuns]=useState(initial?.runs??[]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [form,setForm]=useState<TaskRuleInput>(blank);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const selected=rules.find(r=>r.id===selectedId)??null;
 const setField=(patch:Partial<TaskRuleInput>)=>setForm(current=>({...current,...patch}));

 function choose(rule:TaskAutomationRule|null){
  setSelectedId(rule?.id??null);
  setForm(rule?{name:rule.name,is_enabled:rule.is_enabled,schedule_mode:rule.schedule_mode,
   task_title:rule.task_title,task_description:rule.task_description,task_priority:rule.task_priority,
   assignee_label:rule.assignee_label}:blank);
  setError("");setMessage("");
 }
 async function refresh(){
  const r=await fetch("/api/admin-v2/automation",{cache:"no-store"});
  if(!r.ok)throw new Error("Failed to refresh current automation state.");
  const data=await r.json() as {rules:TaskAutomationRule[];runs:TaskAutomationRun[]};
  setRules(data.rules);setRuns(data.runs);
 }
 async function save(){
  if(busy||!canManage||!initial)return;
  setBusy(true);setError("");setMessage("");
  try {
   const r=await fetch("/api/admin-v2/automation",{
    method:selected?"PATCH":"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(selected?{...form,id:selected.id,version:selected.version}:form),
   });
   const data=await r.json() as {rule?:TaskAutomationRule;errors?:string[]};
   if(!r.ok||!data.rule)throw new Error(data.errors?.join(" ")||"Rule not saved.");
   await refresh();
   choose(data.rule);
   setMessage("Internal rule saved. No customer communication or external service was called.");
  }catch(e){setError(e instanceof Error?e.message:"Save failed.");}
  finally{setBusy(false);}
 }
 async function run(){
  if(!selected||!selected.is_enabled||!canManage||busy) return;
  if(!window.confirm("Create an internal staff task now? Only one task per rule per UTC day is allowed."))return;
  setBusy(true);setError("");setMessage("");
  try{
   const r=await fetch("/api/admin-v2/automation/run",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected.id}),
   });
   const data=await r.json() as {result?:{reused:boolean;work_task_id:string};errors?:string[]};
   if(!r.ok||!data.result)throw new Error(data.errors?.join(" ")||"Rule did not run.");
   setMessage(data.result.reused?"Task for today already exists; no duplicate created.":"Internal staff task created. View it in Kanban.");
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Run failed.");}
  finally{setBusy(false);}
 }
 const alreadyRan=runs.some(r=>r.rule_id===selectedId&&r.run_day===new Date().toISOString().slice(0,10));
 return <>
  <V2PageHeader title="Automation" description="Persisted internal staff-task rules with safe preview and atomic once-per-day execution."
   breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Automation"}]}
   actions={<Button variant="outlined" component={Link} href="/admin-v2/kanban">Open Kanban</Button>}/>
  <Stack spacing={2}>
   <Alert severity="info">This runner creates internal work tasks only. It cannot send messages, charge customers, update orders or invoke provider APIs. Daily rules run via UTC daily scheduler only when CRON_SECRET is configured. ${schedulerConfigured?"Daily scheduler configured.":"Scheduler not yet activated; use Run once today."}</Alert>
   {!initial?<Alert severity="warning">Automation database unavailable. No simulated rules or run history.</Alert>:null}
   {!canManage?<Alert severity="info">Read-only access. Managing and executing rules requires automation.manage.</Alert>:null}
   {error?<Alert severity="error">{error}</Alert>:null}{message?<Alert severity="success">{message}</Alert>:null}
   <Stack direction={{xs:"column",lg:"row"}} spacing={2} sx={{alignItems:"flex-start"}}>
    <V2Card>
     <Stack spacing={1.25} sx={{minWidth:{lg:270}}}>
      <Typography variant="subtitle1" sx={{fontWeight:700}}>Rules ({initial?rules.length:"Unavailable"})</Typography>
      {canManage?<Button variant="outlined" onClick={()=>choose(null)} disabled={busy||!initial}>New rule</Button>:null}
      <Divider/>
      {!rules.length?<Typography color="text.secondary" variant="body2">No saved rules.</Typography>:null}
      {rules.map(rule=><Button key={rule.id} variant={selectedId===rule.id?"contained":"text"}
       sx={{justifyContent:"flex-start",textTransform:"none",textAlign:"left"}}
       onClick={()=>choose(rule)} disabled={busy}>
       <Stack spacing={0.25} sx={{minWidth:0}}>
        <Typography variant="body2" sx={{fontWeight:700}}>{rule.name}</Typography>
        <Typography variant="caption" color="text.secondary">{rule.is_enabled?"Enabled":"Disabled"} · {rule.schedule_mode} · v{rule.version}</Typography>
       </Stack></Button>)}
     </Stack>
    </V2Card>
    <V2Card>
     <Stack spacing={1.75} sx={{minWidth:0}}>
      <Stack direction="row" spacing={1} sx={{justifyContent:"space-between",alignItems:"center"}}>
       <Typography variant="h6">{selected?"Edit internal rule":"Create internal rule"}</Typography>
       <Chip size="small" variant="outlined" label="Internal tasks only"/>
      </Stack>
      <TextField label="Rule name" fullWidth value={form.name} onChange={e=>setField({name:e.target.value})}
       disabled={busy||!canManage||!initial} slotProps={{htmlInput:{maxLength:120}}}/>
      <TextField select label="Schedule" fullWidth value={form.schedule_mode} onChange={e=>setField({schedule_mode:e.target.value as "manual"|"daily"})}
       disabled={busy||!canManage||!initial}>
       <MenuItem value="manual">Manual execution</MenuItem>
       <MenuItem value="daily">Daily (scheduler not connected)</MenuItem>
      </TextField>
      <TextField label="Staff task title" fullWidth value={form.task_title} onChange={e=>setField({task_title:e.target.value})}
       disabled={busy||!canManage||!initial} slotProps={{htmlInput:{maxLength:160}}}/>
      <TextField label="Task description" fullWidth multiline minRows={3} value={form.task_description}
       onChange={e=>setField({task_description:e.target.value})} disabled={busy||!canManage||!initial}
       slotProps={{htmlInput:{maxLength:2000}}}/>
      <TextField select label="Priority" fullWidth value={form.task_priority} onChange={e=>setField({task_priority:e.target.value as "low"|"normal"|"high"})} disabled={busy||!canManage||!initial}>
       <MenuItem value="low">Low</MenuItem><MenuItem value="normal">Normal</MenuItem><MenuItem value="high">High</MenuItem>
      </TextField>
      <TextField label="Assigned team/person label (optional)" fullWidth value={form.assignee_label}
       onChange={e=>setField({assignee_label:e.target.value})} disabled={busy||!canManage||!initial}
       slotProps={{htmlInput:{maxLength:120}}}/>
      <Stack direction="row" spacing={1} sx={{alignItems:"center",flexWrap:"wrap"}}>
       <Button variant={form.is_enabled?"contained":"outlined"} color={form.is_enabled?"success":"inherit"}
        disabled={busy||!canManage||!initial} onClick={()=>setField({is_enabled:!form.is_enabled})}>
        {form.is_enabled?"Enabled — click to disable":"Disabled — click to enable"}
       </Button>
       <Button variant="contained" disabled={busy||!canManage||!initial||!form.name.trim()||!form.task_title.trim()}
        onClick={()=>void save()}>{busy?"Working...":"Save rule"}</Button>
       {selected?<Button variant="outlined" onClick={()=>void run()}
        disabled={busy||!canManage||!selected.is_enabled||!initial}>{alreadyRan?"Run again (deduplicated)":"Run once today"}</Button>:null}
      </Stack>
      {selected?<Typography variant="caption" color="text.secondary">Version {selected.version}. Dry-run preview: an internal task named “{selected.task_title}” with {selected.task_priority} priority would be created if enabled.</Typography>:null}
     </Stack>
    </V2Card>
   </Stack>
   <V2Card>
    <Typography variant="h6" sx={{mb:1}}>Execution history</Typography>
    {runs.length?runs.slice(0,30).map(r=><Typography key={r.id} variant="body2" sx={{py:0.5}}>
     {r.run_day} · {rules.find(x=>x.id===r.rule_id)?.name??"Rule no longer visible"} · internal task created · {r.run_mode}
    </Typography>):<Typography variant="body2" color="text.secondary">No recorded executions.</Typography>}
   </V2Card>
  </Stack>
 </>;
}
