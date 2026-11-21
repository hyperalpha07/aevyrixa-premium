"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Activity, CalendarClock, CheckCircle2, ClipboardList, Plus, ShieldCheck } from "lucide-react";
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

 const today=new Date().toISOString().slice(0,10);
 const enabledCount=rules.filter(r=>r.is_enabled).length;
 const dailyCount=rules.filter(r=>r.is_enabled&&r.schedule_mode==="daily").length;
 const todayCount=runs.filter(r=>r.run_day===today).length;
 const metrics=[
  {label:"TOTAL RULES",value:rules.length,icon:<ClipboardList size={20}/>,hint:"Saved workflows"},
  {label:"ENABLED",value:enabledCount,icon:<CheckCircle2 size={20}/>,hint:"Ready to execute"},
  {label:"DAILY RULES",value:dailyCount,icon:<CalendarClock size={20}/>,hint:"Scheduled for UTC"},
  {label:"RUNS TODAY",value:todayCount,icon:<Activity size={20}/>,hint:"Unique task runs"},
 ];
 const panelSx={
  minWidth:0,
  border:"1px solid rgba(174,190,238,0.14)",
  borderRadius:"22px",
  background:"linear-gradient(145deg,rgba(28,29,59,0.86),rgba(15,21,43,0.92) 55%,rgba(13,38,53,0.70))",
  boxShadow:"0 18px 42px rgba(1,5,20,0.20),inset 0 1px rgba(255,255,255,0.04)",
 };
 const fieldSx={
  minWidth:0,
  "& .MuiInputLabel-root":{color:"#aab6d4"},
  "& .MuiInputLabel-root.Mui-focused":{color:"#76e4e0"},
  "& .MuiOutlinedInput-root":{
   borderRadius:"13px",background:"rgba(6,13,32,0.60)",color:"#f5f7ff",
   "& fieldset":{borderColor:"rgba(183,198,230,0.22)"},
   "&:hover fieldset":{borderColor:"rgba(137,218,221,0.50)"},
   "&.Mui-focused fieldset":{borderColor:"#60d9d5"},
   "&.Mui-disabled":{color:"rgba(240,243,255,0.40)"},
  },
  "& .MuiInputBase-input.Mui-disabled":{WebkitTextFillColor:"rgba(240,243,255,0.40)"},
  "& .MuiSelect-icon":{color:"#a6b5d3"},
  "& .MuiInputBase-input::placeholder":{color:"#a8b2cb",opacity:1},
 };
 const primaryButtonSx={
  textTransform:"none",fontWeight:750,minHeight:44,borderRadius:"12px",px:2.5,
  background:"linear-gradient(115deg,#6555df,#7d51d9 65%,#358fa5)",color:"#ffffff",
  boxShadow:"0 8px 24px rgba(74,65,169,0.26)",
  "&:hover":{background:"linear-gradient(115deg,#7765e9,#875be6 65%,#37a4b5)"},
  "&.Mui-disabled":{background:"rgba(123,139,172,0.20)",color:"rgba(235,241,255,0.36)"},
 };
 const outlinedButtonSx={
  textTransform:"none",fontWeight:700,minHeight:42,borderRadius:"12px",
  borderColor:"rgba(145,175,216,0.30)",color:"#d9e8ff",
  "&:hover":{borderColor:"#5cd8d0",background:"rgba(76,210,206,0.07)"},
 };
 return (
  <Box sx={{
   color:"#f6f7ff",minWidth:0,borderRadius:{xs:2,md:4},p:{xs:2,md:3,lg:3.5},
   background:"radial-gradient(ellipse at 7% 0%,rgba(96,57,167,0.22),transparent 42%),radial-gradient(ellipse at 97% 45%,rgba(37,161,164,0.12),transparent 38%),linear-gradient(135deg,#101329 0%,#10172e 53%,#091d2c 100%)",
   border:"1px solid rgba(135,153,206,0.15)",
   "& .MuiAlert-root":{borderRadius:"13px",alignItems:"center"},
  }}>
   <Stack direction={{xs:"column",md:"row"}} spacing={2} sx={{justifyContent:"space-between",alignItems:{xs:"stretch",md:"center"},mb:3}}>
    <Box>
     <Typography variant="overline" sx={{color:"#74d9d7",fontWeight:800,letterSpacing:"0.17em"}}>
      ADMIN V2  /  OPERATIONS
     </Typography>
     <Typography component="h1" sx={{fontSize:{xs:"1.85rem",md:"2.3rem"},lineHeight:1.15,fontWeight:800,letterSpacing:"-0.045em",mt:0.25,color:"#ffffff"}}>
      Automation workspace
     </Typography>
     <Typography sx={{fontSize:"0.91rem",mt:1,color:"#aebad4",maxWidth:720,lineHeight:1.65}}>
      Manage internal staff-task rules, schedule daily reviews, and monitor real task execution in one place.
     </Typography>
    </Box>
    <Button component={Link} href="/admin-v2/kanban" variant="outlined" sx={{...outlinedButtonSx,flexShrink:0,alignSelf:{xs:"flex-start",md:"center"}}}>
     Open task board
    </Button>
   </Stack>

   <Stack spacing={1.25} sx={{mb:2.5}}>
    <Box sx={{display:"flex",gap:1.5,alignItems:"flex-start",p:{xs:1.6,md:2},border:"1px solid rgba(67,198,194,0.23)",borderRadius:"15px",background:"linear-gradient(95deg,rgba(14,97,110,0.24),rgba(42,49,88,0.17))"}}>
     <ShieldCheck size={21} color="#6fe1d5" style={{flexShrink:0,marginTop:2}}/>
     <Box sx={{minWidth:0}}>
      <Typography sx={{fontWeight:750,fontSize:"0.89rem",color:"#e1faf6"}}>Internal tasks only · Safe by design</Typography>
      <Typography sx={{mt:0.35,fontSize:"0.81rem",lineHeight:1.6,color:"#b7d1dc"}}>
       Rules create staff tasks only. They cannot send customer messages, charge payments or call external provider APIs.
       {" "}{schedulerConfigured?"The CRON_SECRET is present; check execution history to confirm scheduled runs.":"Automatic daily runs require a production CRON_SECRET."}
      </Typography>
     </Box>
    </Box>
    {!initial?<Alert severity="warning">Automation database unavailable. No simulated rules or execution history.</Alert>:null}
    {!canManage?<Alert severity="info">Read-only mode. Managing and running rules requires automation.manage.</Alert>:null}
    {error?<Alert severity="error">{error}</Alert>:null}
    {message?<Alert severity="success">{message}</Alert>:null}
   </Stack>

   <Box sx={{display:"grid",gridTemplateColumns:{xs:"repeat(2,minmax(0,1fr))",lg:"repeat(4,minmax(0,1fr))"},gap:1.5,mb:2.5}}>
    {metrics.map(metric=>
     <Box key={metric.label} sx={{...panelSx,p:{xs:1.7,md:2.1},minHeight:116,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
      <Stack direction="row" spacing={1} sx={{alignItems:"center",justifyContent:"space-between"}}>
       <Typography sx={{fontSize:"0.67rem",letterSpacing:"0.12em",fontWeight:750,color:"#aab8d5"}}>{metric.label}</Typography>
       <Box sx={{color:"#65d5d2",display:"flex"}}>{metric.icon}</Box>
      </Stack>
      <Stack direction="row" spacing={1.2} sx={{alignItems:"baseline",mt:1}}>
       <Typography sx={{fontSize:{xs:"1.75rem",md:"2rem"},fontWeight:800,lineHeight:1,color:"#ffffff"}}>{metric.value}</Typography>
       <Typography sx={{fontSize:"0.71rem",color:"#9caecb"}}>{metric.hint}</Typography>
      </Stack>
     </Box>
    )}
   </Box>

   <Box sx={{display:"grid",gridTemplateColumns:{xs:"minmax(0,1fr)",lg:"minmax(285px,0.9fr) minmax(0,2.1fr)"},gap:2.25,alignItems:"start"}}>
    <Box component="section" aria-label="Saved automation rules" sx={{...panelSx,p:{xs:2,md:2.5},minHeight:{lg:490}}}>
     <Stack direction="row" spacing={1} sx={{alignItems:"center",justifyContent:"space-between"}}>
      <Box>
       <Typography sx={{fontWeight:800,fontSize:"1.11rem",color:"#ffffff"}}>Saved rules</Typography>
       <Typography sx={{fontSize:"0.76rem",mt:0.4,color:"#9eacc8"}}>{initial?rules.length:"Unavailable"} workflows in this workspace</Typography>
      </Box>
      {canManage?<Button onClick={()=>choose(null)} disabled={busy||!initial} startIcon={<Plus size={16}/>} variant="outlined" sx={{...outlinedButtonSx,minHeight:38,px:1.4}}>New</Button>:null}
     </Stack>
     <Box sx={{height:"1px",background:"rgba(178,191,230,0.14)",my:2}}/>
     {!rules.length?
      <Stack sx={{alignItems:"center",textAlign:"center",py:{xs:3,lg:5},px:1}} spacing={1.5}>
       <Box sx={{height:60,width:60,borderRadius:"19px",display:"grid",placeItems:"center",color:"#78ddd8",background:"rgba(59,177,185,0.11)",border:"1px solid rgba(94,205,207,0.19)"}}>
        <ClipboardList size={27}/>
       </Box>
       <Typography sx={{fontSize:"1rem",fontWeight:750,color:"#f5f8ff"}}>No rules created yet</Typography>
       <Typography sx={{fontSize:"0.81rem",lineHeight:1.6,color:"#aab8d1",maxWidth:250}}>
        Start with a daily operations review or create a manual staff checklist.
       </Typography>
       {canManage?<Button onClick={()=>choose(null)} disabled={busy||!initial} sx={{...primaryButtonSx,mt:1}}>Create first rule</Button>:null}
      </Stack>
      :<Stack spacing={1.1}>
       {rules.map(rule=>
        <Button key={rule.id} aria-pressed={selectedId===rule.id} fullWidth onClick={()=>choose(rule)} disabled={busy}
         sx={{textTransform:"none",borderRadius:"14px",p:1.6,textAlign:"left",justifyContent:"flex-start",border:selectedId===rule.id?"1px solid rgba(110,216,210,0.65)":"1px solid rgba(160,185,224,0.15)",background:selectedId===rule.id?"rgba(32,132,143,0.21)":"rgba(6,13,30,0.45)","&:hover":{background:"rgba(45,96,139,0.24)"}}}>
         <Stack sx={{minWidth:0,width:"100%"}} spacing={0.9}>
          <Stack direction="row" spacing={1} sx={{alignItems:"center",justifyContent:"space-between"}}>
           <Typography noWrap sx={{fontSize:"0.9rem",fontWeight:750,color:"#f2f6ff"}}>{rule.name}</Typography>
           <Box sx={{height:8,width:8,borderRadius:"50%",background:rule.is_enabled?"#6fdfcb":"#78839e",flexShrink:0}}/>
          </Stack>
          <Typography sx={{fontSize:"0.74rem",color:"#a9b8d5",textTransform:"capitalize"}}>
           {rule.schedule_mode==="daily"?"Daily · 00:05 UTC":"Manual"} · {rule.is_enabled?"Enabled":"Disabled"} · v{rule.version}
          </Typography>
         </Stack>
        </Button>
       )}
      </Stack>}
    </Box>

    <Box component="section" aria-label="Automation rule editor" sx={{...panelSx,p:{xs:2,md:2.6,lg:3}}}>
     <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{alignItems:{xs:"flex-start",sm:"center"},justifyContent:"space-between",mb:2.5}}>
      <Box>
       <Typography sx={{fontSize:"1.17rem",fontWeight:800,color:"#ffffff"}}>{selected?"Edit automation rule":"Create a new rule"}</Typography>
       <Typography sx={{fontSize:"0.79rem",mt:0.5,color:"#a9b9d4"}}>{selected?"Changes are saved with version checking.":"Configure one meaningful task before enabling it."}</Typography>
      </Box>
      <Chip size="small" icon={<ShieldCheck size={15}/>} label="Internal only" variant="outlined"
       sx={{color:"#87e9da",borderColor:"rgba(95,204,204,0.34)","& .MuiChip-icon":{color:"#87e9da"}}}/>
     </Stack>
     <Box sx={{display:"grid",gridTemplateColumns:{xs:"minmax(0,1fr)",sm:"repeat(2,minmax(0,1fr))"},gap:2}}>
      <TextField sx={fieldSx} label="Rule name" fullWidth value={form.name} onChange={e=>setField({name:e.target.value})}
       disabled={busy||!canManage||!initial} slotProps={{htmlInput:{maxLength:120}}}/>
      <TextField sx={fieldSx} select label="Schedule" fullWidth value={form.schedule_mode} onChange={e=>setField({schedule_mode:e.target.value as "manual"|"daily"})}
       disabled={busy||!canManage||!initial}>
       <MenuItem value="manual">Manual · run on demand</MenuItem>
       <MenuItem value="daily">{schedulerConfigured?"Daily · 00:05 UTC":"Daily · requires CRON_SECRET"}</MenuItem>
      </TextField>
      <TextField sx={fieldSx} label="Staff task title" fullWidth value={form.task_title} onChange={e=>setField({task_title:e.target.value})}
       disabled={busy||!canManage||!initial} slotProps={{htmlInput:{maxLength:160}}}/>
      <TextField sx={fieldSx} select label="Priority" fullWidth value={form.task_priority} onChange={e=>setField({task_priority:e.target.value as "low"|"normal"|"high"})}
       disabled={busy||!canManage||!initial}>
       <MenuItem value="low">Low</MenuItem><MenuItem value="normal">Normal</MenuItem><MenuItem value="high">High</MenuItem>
      </TextField>
      <TextField sx={{...fieldSx,gridColumn:{sm:"1 / -1"}}} label="Task description" fullWidth multiline minRows={3} value={form.task_description}
       onChange={e=>setField({task_description:e.target.value})} disabled={busy||!canManage||!initial}
       slotProps={{htmlInput:{maxLength:2000}}}/>
      <TextField sx={{...fieldSx,gridColumn:{sm:"1 / -1"}}} label="Assigned team/person (optional)" fullWidth value={form.assignee_label}
       onChange={e=>setField({assignee_label:e.target.value})} disabled={busy||!canManage||!initial}
       slotProps={{htmlInput:{maxLength:120}}}/>
     </Box>

     <Box sx={{mt:2.25,p:{xs:1.6,md:2},borderRadius:"15px",border:"1px solid rgba(130,175,219,0.21)",background:"linear-gradient(100deg,rgba(8,35,56,0.70),rgba(30,28,62,0.58))"}}>
      <Stack direction={{xs:"column",sm:"row"}} spacing={1.5} sx={{alignItems:{xs:"stretch",sm:"center"},justifyContent:"space-between"}}>
       <Box>
        <Typography sx={{fontWeight:750,fontSize:"0.89rem",color:"#f3f8ff"}}>Rule status</Typography>
        <Typography sx={{mt:0.4,fontSize:"0.76rem",lineHeight:1.5,color:"#aab9d1"}}>Only enabled rules can run. One task per UTC day, with duplicate protection.</Typography>
       </Box>
       <Button onClick={()=>setField({is_enabled:!form.is_enabled})} disabled={busy||!canManage||!initial}
        aria-pressed={form.is_enabled} variant="outlined" sx={{...outlinedButtonSx,whiteSpace:"nowrap",flexShrink:0,borderColor:form.is_enabled?"rgba(103,225,197,0.65)":"rgba(145,175,216,0.30)",color:form.is_enabled?"#90f1de":"#c7d2e7"}}>
        {form.is_enabled?"Enabled · click to disable":"Disabled · click to enable"}
       </Button>
      </Stack>
     </Box>

     <Box sx={{mt:2,borderRadius:"15px",p:{xs:1.6,md:2},background:"rgba(3,12,27,0.44)",border:"1px dashed rgba(113,191,206,0.30)"}}>
      <Typography sx={{fontSize:"0.67rem",fontWeight:800,letterSpacing:"0.14em",color:"#7ededa"}}>TASK PREVIEW</Typography>
      <Typography sx={{fontWeight:750,color:"#f6f9ff",mt:0.9,fontSize:"0.95rem",overflowWrap:"anywhere"}}>
       {form.task_title.trim()||"Your staff task title appears here"}
      </Typography>
      <Typography sx={{fontSize:"0.76rem",color:"#b2c2d7",mt:0.5,whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>
       {form.task_description.trim()||"Describe what the team should review or complete."}
      </Typography>
      <Stack direction="row" spacing={1} sx={{mt:1.5,flexWrap:"wrap",rowGap:1}}>
       <Chip size="small" label={form.schedule_mode==="daily"?"Daily · UTC":"Manual"} variant="outlined" sx={{color:"#9adbdc",borderColor:"rgba(92,198,209,0.27)"}}/>
       <Chip size="small" label={form.task_priority+" priority"} variant="outlined" sx={{textTransform:"capitalize",color:"#d1c3ff",borderColor:"rgba(164,139,236,0.30)"}}/>
       <Chip size="small" label={form.is_enabled?"Enabled":"Disabled"} variant="outlined" sx={{color:form.is_enabled?"#84e4cd":"#abb6ca",borderColor:"rgba(145,168,199,0.30)"}}/>
      </Stack>
     </Box>

     <Stack direction={{xs:"column",sm:"row"}} spacing={1.5} sx={{alignItems:{xs:"stretch",sm:"center"},justifyContent:"space-between",mt:2.5}}>
      <Typography sx={{fontSize:"0.74rem",color:"#99abc8"}}>
       {selected?"Version "+selected.version+" · Changes are audited":"No external actions are performed on save"}
      </Typography>
      <Stack direction={{xs:"column",sm:"row"}} spacing={1}>
       {selected?<Button variant="outlined" onClick={()=>void run()} sx={outlinedButtonSx}
        disabled={busy||!canManage||!selected.is_enabled||!initial}>
        {alreadyRan?"Run again (deduplicated)":"Run once today"}
       </Button>:null}
       <Button onClick={()=>void save()} sx={primaryButtonSx}
        disabled={busy||!canManage||!initial||!form.name.trim()||!form.task_title.trim()}>
        {busy?"Working...":selected?"Save changes":"Save rule"}
       </Button>
      </Stack>
     </Stack>
    </Box>
   </Box>

   <Box component="section" aria-label="Automation execution history" sx={{...panelSx,p:{xs:2,md:2.5},mt:2.25}}>
    <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{justifyContent:"space-between",alignItems:{xs:"flex-start",sm:"center"}}}>
     <Box>
      <Typography sx={{fontSize:"1.13rem",fontWeight:800,color:"#ffffff"}}>Execution history</Typography>
      <Typography sx={{fontSize:"0.77rem",mt:0.4,color:"#a8b8d2"}}>Recorded internal task creation · latest 30 runs</Typography>
     </Box>
     <Typography sx={{fontSize:"0.76rem",color:"#8fded9"}}>{runs.length} recorded runs</Typography>
    </Stack>
    <Box sx={{height:"1px",background:"rgba(178,191,230,0.14)",my:2}}/>
    {runs.length?
     <Stack spacing={1}>
      {runs.slice(0,30).map(r=>
       <Box key={r.id} sx={{display:"grid",gridTemplateColumns:{xs:"minmax(0,1fr)",md:"140px minmax(0,1fr) 145px"},gap:1.2,alignItems:"center",px:1.5,py:1.25,borderRadius:"12px",border:"1px solid rgba(125,157,198,0.16)",background:"rgba(4,14,35,0.35)"}}>
        <Typography sx={{color:"#8fdfd8",fontWeight:700,fontSize:"0.82rem"}}>{r.run_day}</Typography>
        <Typography sx={{color:"#edf2ff",fontSize:"0.85rem",overflowWrap:"anywhere"}}>{rules.find(x=>x.id===r.rule_id)?.name??"Rule no longer visible"}</Typography>
        <Typography sx={{color:"#a7b7d2",fontSize:"0.79rem",textTransform:"capitalize"}}>{r.run_mode} · Task created</Typography>
       </Box>
      )}
     </Stack>
     :<Stack spacing={1} sx={{alignItems:"center",textAlign:"center",py:{xs:2.5,md:3.5}}}>
       <Activity size={26} color="#6baebc"/>
       <Typography sx={{fontWeight:750,color:"#d7e3f2",fontSize:"0.88rem"}}>No executions yet</Typography>
       <Typography sx={{color:"#99a9c5",fontSize:"0.78rem",maxWidth:420}}>Once an enabled rule runs, its real execution will appear here. No demo activity is shown.</Typography>
      </Stack>
    }
   </Box>
  </Box>
 );
}
