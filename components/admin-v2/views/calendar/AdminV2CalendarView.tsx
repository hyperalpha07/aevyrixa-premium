import Link from "next/link";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { AdminWorkTask } from "@/lib/admin-v2/work-tasks/work-tasks-store";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

type CalendarData={available:boolean;rows:AdminWorkTask[];totalCount:number};
const weekdays=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
function adjacent(month:string,delta:number) {
 const [y,m]=month.split("-").map(Number);
 return new Date(Date.UTC(y,m-1+delta,1)).toISOString().slice(0,7);
}
function dateAt(month:string,day:number) {return `${month}-${String(day).padStart(2,"0")}`;}

export function AdminV2CalendarView({month,data}:{month:string;data:CalendarData}) {
 const [year,num]=month.split("-").map(Number);
 const first=new Date(Date.UTC(year,num-1,1));
 const offset=(first.getUTCDay()+6)%7;
 const days=new Date(Date.UTC(year,num,0)).getUTCDate();
 const cells=Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>{
   const dateNumber=i-offset+1;
   return dateNumber>=1&&dateNumber<=days?dateNumber:null;
 });
 const byDate=new Map<string,AdminWorkTask[]>();
 for(const task of data.rows)if(task.due_date){
   const items=byDate.get(task.due_date)??[];items.push(task);byDate.set(task.due_date,items);
 }
 const label=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric",timeZone:"UTC"}).format(first);
 return <>
  <V2PageHeader title="Task Calendar" description="Verified internal task deadlines, backed by the Kanban work board. Not connected to Google Calendar."
    breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Calendar"}]}
    actions={<Button component={Link} href="/admin-v2/kanban" variant="outlined">Open task board</Button>}/>
  <Stack spacing={2}>
    {!data.available?<Alert severity="error">Calendar task storage could not be loaded; no appointments are fabricated.</Alert>:null}
    <Alert severity="info">Calendar shows the due dates of saved Admin work tasks. It does not create meetings or send reminders and has no external calendar integration.</Alert>
    <V2Card>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{alignItems:"center",justifyContent:"space-between"}}>
          <Button size="small" component={Link} href={`/admin-v2/calendar?month=${adjacent(month,-1)}`}>Previous</Button>
          <Typography variant="h6">{label}</Typography>
          <Button size="small" component={Link} href={`/admin-v2/calendar?month=${adjacent(month,1)}`}>Next</Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">Tasks with due dates this month: {data.available?data.totalCount:"Unavailable"}</Typography>
        <Box sx={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:0.75}}>
          {weekdays.map(weekday=><Typography key={weekday} variant="caption" sx={{fontWeight:700,textAlign:"center"}}>{weekday}</Typography>)}
          {cells.map((day,index)=>{
            const items=day?byDate.get(dateAt(month,day))??[]:[];
            return <Box key={index} sx={{border:"1px solid",borderColor:"divider",borderRadius:1.5,minHeight:110,p:0.8,overflow:"hidden",
              bgcolor:day?"background.paper":"action.hover"}}>
              {day?<Typography variant="caption" sx={{fontWeight:700}}>{day}</Typography>:null}
              <Stack spacing={0.5} sx={{mt:0.4}}>
                {items.map(task=><Box key={task.id} title={task.title} sx={{p:0.6,borderRadius:1,
                  bgcolor:task.task_status==="done"?"action.hover":"primary.main",color:task.task_status==="done"?"text.primary":"primary.contrastText"}}>
                  <Typography variant="caption" sx={{display:"block",overflowWrap:"anywhere",fontSize:"0.66rem"}}>{task.title}</Typography>
                </Box>)}
              </Stack>
            </Box>;
          })}
        </Box>
      </Stack>
    </V2Card>
  </Stack>
 </>;
}
