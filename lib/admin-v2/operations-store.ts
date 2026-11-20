import "server-only";

export type TaskAutomationRule = {
  id: string; name: string; is_enabled: boolean; schedule_mode: "manual" | "daily";
  task_title: string; task_description: string; task_priority: "low" | "normal" | "high";
  assignee_label: string; version: number; updated_at: string;
};
export type TaskAutomationRun = {
  id: string; rule_id: string; run_day: string; run_mode: string;
  work_task_id: string; actor: string; created_at: string;
};
export type TaxPlanningProfile = {
  id: boolean; jurisdiction: "BD"; registration_number: string;
  tax_rate_percent: number; reporting_notes: string;
  is_checkout_tax_active: false; version: number; updated_at: string;
};
export type WebhookSubscriptionDraft = {
  id: string; label: string; event_type: "order.created"|"order.updated"|"refund.recorded"|"payment.recorded";
  destination_url: string; is_enabled: false; version: number; updated_at: string;
};
export type TaskRuleInput = Pick<TaskAutomationRule,"name"|"is_enabled"|"schedule_mode"|"task_title"|"task_description"|"task_priority"|"assignee_label">;
export type TaxProfileInput = Pick<TaxPlanningProfile,"registration_number"|"tax_rate_percent"|"reporting_notes">;
export type WebhookInput = Pick<WebhookSubscriptionDraft,"label"|"event_type"|"destination_url">;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const obj = (v:unknown):Record<string,unknown> => v && typeof v==="object" && !Array.isArray(v) ? v as Record<string,unknown> : {};
const str = (v:unknown,max:number) => typeof v==="string" && v.length<=max ? v.trim() : null;
export const validId = (s:string) => uuid.test(s);
export function validVersion(v:unknown): v is number { return typeof v==="number" && Number.isSafeInteger(v) && v>=1 && v<=1_000_000; }

export function parseTaskRule(raw:unknown):TaskRuleInput|null {
 const v=obj(raw);
 const name=str(v.name,120),title=str(v.task_title,160),description=str(v.task_description,2000),assignee=str(v.assignee_label,120);
 if(!name || name.length<3 || !title || title.length<3 || description===null || assignee===null ||
    !["manual","daily"].includes(String(v.schedule_mode)) || !["low","normal","high"].includes(String(v.task_priority)) ||
    typeof v.is_enabled!=="boolean") return null;
 return {name,task_title:title,task_description:description,assignee_label:assignee,
   schedule_mode:v.schedule_mode as TaskRuleInput["schedule_mode"],
   task_priority:v.task_priority as TaskRuleInput["task_priority"],is_enabled:v.is_enabled};
}
export function parseTaxProfile(raw:unknown):TaxProfileInput|null {
 const v=obj(raw),reg=str(v.registration_number,80),notes=str(v.reporting_notes,3000);
 const rate=v.tax_rate_percent;
 if(reg===null || notes===null || typeof rate!=="number" || !Number.isFinite(rate) ||
    rate<0 || rate>100 || Math.round(rate*100)!==rate*100) return null;
 return {registration_number:reg,tax_rate_percent:rate,reporting_notes:notes};
}

export function parseWebhookDraft(raw:unknown):WebhookInput|null {
 const v=obj(raw);
 const label=str(v.label,120);
 if(!label || label.length<3 || !["order.created","order.updated","refund.recorded","payment.recorded"].includes(String(v.event_type)) ||
 typeof v.destination_url!=="string" || v.destination_url.length>300) return null;
 let dest:URL;
 try {dest=new URL(v.destination_url);}catch{return null;}
 // Never accept URL credentials, query parameters, fragments, IP literals or internal hosts.
 const host=dest.hostname.toLowerCase();
 if(dest.protocol!=="https:" || dest.username || dest.password || dest.search || dest.hash ||
    dest.port || host==="localhost" || host.endsWith(".localhost") ||
    host.endsWith(".local") || host.endsWith(".internal") ||
    !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host) || /\d$/.test(host.split(".").at(-1)??"") ||
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) return null;
 return {label,event_type:v.event_type as WebhookInput["event_type"],destination_url:dest.toString()};
}

function config(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error("Operations backend is unavailable.");
 return {url,key};
}
function endpoint(path:string){return `${config().url}/rest/v1/${path}`;}
function headers(prefer?:string){
 const {key}=config();
 return {apikey:key,Authorization:`Bearer ${key}`,"content-type":"application/json",...(prefer?{Prefer:prefer}:{})};
}
async function readList<T>(table:string,params:string):Promise<T[]>{
 const r=await fetch(endpoint(`${table}?${params}`),{headers:headers(),cache:"no-store",signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new Error("Persisted operations source unavailable.");
 return await r.json() as T[];
}
async function writeOne<T>(table:string,method:"POST"|"PATCH",body:Record<string,unknown>,filter?:string):Promise<T|null>{
 const path=`${table}?${filter?filter+"&":""}select=*`;
 const r=await fetch(endpoint(path),{method,headers:headers("return=representation"),cache:"no-store",
  body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new Error("Persisted update unavailable.");
 const rows=await r.json() as T[];
 return rows[0]??null;
}
export async function listTaskAutomationRules(){
 const [rules,runs]=await Promise.all([
 readList<TaskAutomationRule>("admin_automation_rules","select=*&order=updated_at.desc&limit=100"),
 readList<TaskAutomationRun>("admin_automation_runs","select=*&order=created_at.desc&limit=100"),
 ]);
 return {rules,runs};
}
export async function createTaskAutomationRule(input:TaskRuleInput,actor:string){
 return writeOne<TaskAutomationRule>("admin_automation_rules","POST",{...input,created_by:actor.slice(0,120),updated_by:actor.slice(0,120)});
}
export async function updateTaskAutomationRule(id:string,version:number,input:TaskRuleInput,actor:string){
 if(!validId(id)||!validVersion(version))return null;
 return writeOne<TaskAutomationRule>("admin_automation_rules","PATCH",
 {...input,updated_by:actor.slice(0,120),version:version+1,updated_at:new Date().toISOString()},
 `id=eq.${encodeURIComponent(id)}&version=eq.${version}`);
}
export async function runTaskAutomationRule(id:string,actor:string,mode:"manual"|"scheduled"="manual"){
 if(!validId(id))throw new Error("Invalid automation rule.");
 const r=await fetch(endpoint("rpc/admin_v2_run_internal_automation"),{
  method:"POST",headers:headers(),cache:"no-store",
  body:JSON.stringify({p_rule_id:id,p_actor:actor.slice(0,120),p_mode:mode}),
  signal:AbortSignal.timeout(15000),
 });
 if(!r.ok)throw new Error("Rule cannot execute: disabled, invalid or internal task backend unavailable.");
 const rows=await r.json() as Array<{run_id:string;work_task_id:string;reused:boolean}>;
 if(!rows[0]?.run_id)throw new Error("Automation execution was not confirmed.");
 return rows[0];
}
export async function readTaxPlanningProfile(){
 const rows=await readList<TaxPlanningProfile>("admin_tax_profiles","select=*&id=eq.true&limit=1");
 return rows[0]??null;
}
export async function saveTaxPlanningProfile(input:TaxProfileInput,actor:string,revision:number|null){
 if(revision===null) {
  return writeOne<TaxPlanningProfile>("admin_tax_profiles","POST",
   {id:true,jurisdiction:"BD",...input,is_checkout_tax_active:false,updated_by:actor.slice(0,120)});
 }
 if(!validVersion(revision))return null;
 return writeOne<TaxPlanningProfile>("admin_tax_profiles","PATCH",
  {...input,version:revision+1,updated_by:actor.slice(0,120),updated_at:new Date().toISOString()},
  `id=eq.true&version=eq.${revision}`);
}
export async function listWebhookSubscriptions(){
 return readList<WebhookSubscriptionDraft>("admin_webhook_subscriptions",
  "select=*&archived_at=is.null&order=updated_at.desc&limit=100");
}
export async function createWebhookSubscription(input:WebhookInput,actor:string){
 return writeOne<WebhookSubscriptionDraft>("admin_webhook_subscriptions","POST",
   {...input,is_enabled:false,updated_by:actor.slice(0,120)});
}
export async function updateWebhookSubscription(id:string,revision:number,input:WebhookInput,actor:string,archive=false){
 if(!validId(id)||!validVersion(revision))return null;
 return writeOne<WebhookSubscriptionDraft>("admin_webhook_subscriptions","PATCH",
  {...input,is_enabled:false,version:revision+1,updated_by:actor.slice(0,120),updated_at:new Date().toISOString(),
    ...(archive?{archived_at:new Date().toISOString()}:{})},
  `id=eq.${encodeURIComponent(id)}&version=eq.${revision}&archived_at=is.null`);
}
