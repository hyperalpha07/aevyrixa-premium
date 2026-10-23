"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
 Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
 Grid, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";
import type { AdminWorkTask } from "@/lib/admin-v2/work-tasks/work-tasks-store";
import { workPriorities, workStatuses } from "@/lib/admin-v2/work-tasks/work-tasks-validation";

type TaskData = {available:boolean; rows:AdminWorkTask[]; totalCount:number};
type Draft = {title:string;description:string;assignee:string;dueDate:string;priority:AdminWorkTask["priority"];status:AdminWorkTask["task_status"]};
const columns={todo:"To do",doing:"In progress",blocked:"Blocked",done:"Done"} as const;
const empty:Draft={title:"",description:"",assignee:"",dueDate:"",priority:"normal",status:"todo"};

export function AdminV2KanbanView({data}:{data:TaskData}) {
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [selected,setSelected]=useState<AdminWorkTask|null>(null);
 const [draft,setDraft]=useState<Draft>(empty);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [done,setDone]=useState("");
 const edit=(item:AdminWorkTask)=>{
   setSelected(item);setDraft({title:item.title,description:item.description,assignee:item.assignee_label,dueDate:item.due_date??"",priority:item.priority,status:item.task_status});
   setOpen(true);setError("");setDone("");
 };
 const create=()=>{setSelected(null);setDraft(empty);setOpen(true);setError("");setDone("");};
 const patch=<K extends keyof Draft>(key:K,value:Draft[K])=>setDraft(x=>({...x,[key]:value}));
 async function submit(){
  if(saving) return;
  setSaving(true);setError("");
  try{
   const path=selected?`/api/admin-v2/work-tasks/${encodeURIComponent(selected.id)}`:"/api/admin-v2/work-tasks";
   const response=await fetch(path,{method:selected?"PATCH":"POST",cache:"no-store",
     headers:{"content-type":"application/json"},body:JSON.stringify({
       title:draft.title,description:draft.description,assignee:draft.assignee,dueDate:draft.dueDate||null,
       priority:draft.priority,...(selected?{status:draft.status,version:selected.version}:{}),
     })});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok) throw new Error(Array.isArray(payload.errors)?payload.errors.join(" "):"Task save failed.");
   setOpen(false);setDone("Task saved and activity history recorded.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Task save failed.");}
  finally{setSaving(false);}
 }
 return <>
  <V2PageHeader title="Task Board" description="Real persisted team tasks, priorities, ownership and due dates. Updates require staff management permission."
    breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Kanban"}]}
    actions={<Stack direction="row" spacing={1}><Button component={Link} href="/admin-v2/calendar" variant="outlined">Calendar</Button>
      <Button variant="contained" disabled={!data.available} onClick={create}>New task</Button></Stack>}/>
  <Stack spacing={2}>
    {!data.available?<Alert severity="error">Work task storage is unavailable; no example tasks have been substituted.</Alert>:null}
    <Alert severity="info">This task board stores internal work items. It does not schedule emails, send notifications to assignees, or alter customer orders.</Alert>
    {done?<Alert severity="success" onClose={()=>setDone("")}>{done}</Alert>:null}
    <Typography variant="body2" color="text.secondary">Total tasks: {data.available?data.totalCount:"Unavailable"} · Maximum complete board: 250 tasks</Typography>
    <Grid container spacing={2}>
      {workStatuses.map(status=>{
       const tasks=data.rows.filter(task=>task.task_status===status);
       return <Grid key={status} size={{xs:12,md:6,xl:3}}>
        <V2Card sx={{minHeight:310}}>
         <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{justifyContent:"space-between",alignItems:"center"}}>
           <Typography variant="subtitle1" sx={{fontWeight:700}}>{columns[status]}</Typography>
           <Chip size="small" label={data.available?String(tasks.length):"—"} />
          </Stack>
          {tasks.map(task=><Stack key={task.id} spacing={1} sx={{p:1.5,border:"1px solid",borderColor:"divider",borderRadius:2}}>
            <Typography variant="body2" sx={{fontWeight:700}}>{task.title}</Typography>
            {task.description?<Typography variant="caption" color="text.secondary">{task.description}</Typography>:null}
            <Stack direction="row" spacing={1} sx={{flexWrap:"wrap",alignItems:"center"}}>
              <Chip size="small" variant="outlined" label={task.priority} color={task.priority==="high"?"error":"default"}/>
              {task.due_date?<Chip size="small" variant="outlined" label={`Due ${task.due_date}`}/>:null}
            </Stack>
            {task.assignee_label?<Typography variant="caption" color="text.secondary">Assigned: {task.assignee_label}</Typography>:null}
            <Button size="small" variant="outlined" onClick={()=>edit(task)}>Edit task</Button>
          </Stack>)}
          {tasks.length===0?<Typography variant="body2" color="text.secondary">No tasks</Typography>:null}
         </Stack>
        </V2Card>
       </Grid>;
      })}
    </Grid>
  </Stack>
  <Dialog open={open} onClose={()=>{if(!saving)setOpen(false);}} fullWidth maxWidth="sm">
    <DialogTitle>{selected?"Edit task":"Create task"}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{mt:1}}>
      {error?<Alert severity="error">{error}</Alert>:null}
      <TextField label="Task title" size="small" value={draft.title} onChange={e=>patch("title",e.target.value)}/>
      <TextField label="Description" size="small" multiline minRows={2} value={draft.description} onChange={e=>patch("description",e.target.value)}/>
      <TextField label="Assignee label" size="small" value={draft.assignee} onChange={e=>patch("assignee",e.target.value)}/>
      <TextField label="Due date" size="small" type="date" value={draft.dueDate}
        onChange={e=>patch("dueDate",e.target.value)} slotProps={{inputLabel:{shrink:true}}}/>
      <TextField select label="Priority" size="small" value={draft.priority} onChange={e=>patch("priority",e.target.value as Draft["priority"])}>
        {workPriorities.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}
      </TextField>
      {selected?<TextField select label="Status" size="small" value={draft.status} onChange={e=>patch("status",e.target.value as Draft["status"])}>
        {workStatuses.map(s=><MenuItem key={s} value={s}>{columns[s]}</MenuItem>)}
      </TextField>:null}
      <Alert severity="info">Due dates appear in the Admin Calendar. Status and edits are saved with version checks.</Alert>
    </Stack></DialogContent>
    <DialogActions><Button disabled={saving} onClick={()=>setOpen(false)}>Cancel</Button>
     <Button variant="contained" disabled={saving||draft.title.trim().length<3} onClick={()=>void submit()}>{saving?"Saving…":"Save task"}</Button>
    </DialogActions>
  </Dialog>
 </>;
}
