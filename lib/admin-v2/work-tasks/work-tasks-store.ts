import "server-only";

export type AdminWorkTask = {
 id: string; title: string; description: string;
 task_status: "todo" | "doing" | "blocked" | "done";
 priority: "low" | "normal" | "high";
 due_date: string | null; assignee_label: string;
 actor_name: string; version: number; created_at: string; updated_at: string;
};
const columns="id,title,description,task_status,priority,due_date,assignee_label,actor_name,version,created_at,updated_at";

function configured() {
 return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function endpoint(path: string) {
 return `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/,"")}/rest/v1/${path}`;
}
function auth() {
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
 return { apikey: secret, authorization: `Bearer ${secret}`, "content-type": "application/json" };
}
async function check(r: Response, action: string) {
 if (!r.ok) {
   console.error("[admin-v2:work-tasks]",action,r.status);
   throw new Error(`Task ${action} unavailable.`);
 }
 return r;
}
function nextMonth(month: string) {
 const [y,m] = month.split("-").map(Number);
 return new Date(Date.UTC(y,m,1)).toISOString().slice(0,7);
}
export async function loadWorkTasks(month?: string) {
 if (!configured()) return { available:false, rows:[] as AdminWorkTask[], totalCount:0 };
 const params=new URLSearchParams({select:columns,order:"updated_at.desc,id.desc"});
 if(month) {
   if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid calendar month.");
   params.append("due_date",`gte.${month}-01`);
   params.append("due_date",`lt.${nextMonth(month)}-01`);
 }
 const response=await check(await fetch(endpoint(`admin_work_tasks?${params}`),{
   headers:{...auth(),prefer:"count=exact",range:"0-249"},cache:"no-store",
 }),"load");
 const rows=await response.json() as AdminWorkTask[];
 const count=Number(response.headers.get("content-range")?.split("/").at(-1));
 if(!Number.isFinite(count) || count>250) throw new Error("Task count exceeds complete view; search or archive not implemented.");
 return {available:true,rows,totalCount:count};
}
export async function createWorkTask(input: {
 title:string; description:string; priority:AdminWorkTask["priority"];
 dueDate:string|null; assignee:string; actor:string;
}) {
 if(!configured()) throw new Error("Task backend unavailable");
 const r=await check(await fetch(endpoint(`admin_work_tasks?select=${columns}`), {
   method:"POST",headers:{...auth(),prefer:"return=representation"},cache:"no-store",
   body:JSON.stringify({title:input.title,description:input.description,priority:input.priority,
     due_date:input.dueDate,assignee_label:input.assignee,actor_name:input.actor}),
 }),"creation");
 const rows=await r.json() as AdminWorkTask[];
 if(!rows[0]) throw new Error("Task was not confirmed after creation");
 return rows[0];
}
export async function updateWorkTask(input: {
 id:string; version:number; title:string; description:string;
 priority:AdminWorkTask["priority"]; status:AdminWorkTask["task_status"];
 dueDate:string|null; assignee:string; actor:string;
}) {
 if(!configured()) throw new Error("Task backend unavailable");
 const params=new URLSearchParams({id:`eq.${input.id}`,version:`eq.${input.version}`,select:columns});
 const r=await check(await fetch(endpoint(`admin_work_tasks?${params}`),{
  method:"PATCH",headers:{...auth(),prefer:"return=representation"},cache:"no-store",
  body:JSON.stringify({title:input.title,description:input.description,task_status:input.status,
   priority:input.priority,due_date:input.dueDate,assignee_label:input.assignee,actor_name:input.actor,version:input.version+1}),
 }),"update");
 const rows=await r.json() as AdminWorkTask[];
 if(!rows[0]) throw new Error("Task changed in another session; refresh to resolve conflict.");
 return rows[0];
}
