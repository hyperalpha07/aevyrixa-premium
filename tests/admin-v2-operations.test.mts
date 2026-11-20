import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
function loadOperationsValidation(){
 const exports:Record<string,any>={};
 const compiled=ts.transpileModule(read("lib/admin-v2/operations-store.ts"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText;
 new Function("require","exports",compiled)((name:string)=>{if(name==="server-only")return {};throw new Error(`Unexpected import ${name}`);},exports);
 return exports;
}

test("all three modules have truthful routes and least-privilege guards",()=>{
 const routes=read("configs/admin-v2/routes.ts");
 const policy=read("configs/admin-v2/permissions.ts");
 const rights=read("app/lib/admin-permissions.ts");
 for(const module of ["automation","tax","webhooks"]){
  assert.match(routes,new RegExp(`module: "${module}"[^\\n]+implemented: true`));
  assert.match(policy,new RegExp(`${module}: \\{ permission: "${module}\\.view" \\}`));
  assert.match(rights,new RegExp(`"${module}\\.manage"`));
  assert.match(read(`app/admin-v2/${module}/page.tsx`),new RegExp(`requireAdminV2RouteAccess\\(session,"${module}"\\)`));
 }
});

test("additive migrations enforce service-role RLS and disabled external capabilities",()=>{
 const sql=read("supabase/migrations/20261120160000_admin_v2_automation_tax_webhooks.sql");
 for(const table of ["admin_automation_rules","admin_automation_runs","admin_tax_profiles","admin_webhook_subscriptions"]){
  assert.match(sql,new RegExp(`create table if not exists public\\.${table}`));
  assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`));
 }
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/revoke delete on public\.admin_automation_rules/);
 assert.match(sql,/is_checkout_tax_active=false/);
 assert.match(sql,/is_enabled=false/);
 assert.match(sql,/security invoker/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.admin_v2_run_internal_automation/);
});

test("task runner locks rule and atomically creates one real task and one log",()=>{
 const sql=read("supabase/migrations/20261120160000_admin_v2_automation_tax_webhooks.sql");
 assert.match(sql,/where id=p_rule_id for update/);
 assert.match(sql,/unique\(rule_id,run_day\)/);
 assert.match(sql,/insert into public\.admin_work_tasks/);
 assert.match(sql,/insert into public\.admin_automation_runs/);
 assert.match(sql,/if not v_rule\.is_enabled/);
 assert.match(sql,/if p_mode='scheduled' and v_rule\.schedule_mode <> 'daily'/);
 assert.doesNotMatch(sql,/http_post|net\.http|sendMessage|webhook_dispatch|send_email/);
});

test("validation rejects unsafe webhook destination URLs and invalid finance inputs",()=>{
 const {parseWebhookDraft,parseTaxProfile,parseTaskRule}=loadOperationsValidation();
 const baseline={label:"Test endpoint",event_type:"order.created",destination_url:"https://example.org/hooks"};
 assert.equal(parseWebhookDraft(baseline)?.event_type,"order.created");
 for(const destination_url of ["http://example.org/hook","https://localhost/path","https://127.0.0.1/",
 "https://user:password@example.org/hook","https://example.org/hook?token=secret",
 "https://example.org:8080/hook","https://example.internal/hook","https://[::1]/hook"]){
  assert.equal(parseWebhookDraft({...baseline,destination_url}),null,destination_url);
 }
 assert.equal(parseTaxProfile({registration_number:"",tax_rate_percent:101,reporting_notes:""}),null);
 assert.equal(parseTaxProfile({registration_number:"",tax_rate_percent:7.5,reporting_notes:""})?.tax_rate_percent,7.5);
 assert.equal(parseTaskRule({name:"x",task_title:"a",task_description:"",task_priority:"normal",schedule_mode:"manual",is_enabled:true,assignee_label:""}),null);
});

test("mutating API routes require a fresh manage permission; read endpoints require view",()=>{
 for(const module of ["automation","tax","webhooks"]){
  const file=read(`app/api/admin-v2/${module}/route.ts`);
  assert.match(file,new RegExp(`verifyFreshAdminRequestPermission\\(request,"${module}\\.view"\\)`));
  assert.match(file,new RegExp(`verifyFreshAdminRequestPermission\\(request,"${module}\\.manage"\\)`));
  assert.match(file,/logStaffActivity/);
 }
 const run=read("app/api/admin-v2/automation/run/route.ts");
 assert.match(run,/verifyFreshAdminRequestPermission\(request,"automation\.manage"\)/);
 assert.match(run,/runTaskAutomationRule/);
});

test("native UIs never claim unverified tax charges or webhook deliveries",()=>{
 const automation=read("components/admin-v2/views/operations/AutomationOperationsView.tsx");
 const tax=read("components/admin-v2/views/operations/TaxPlanningView.tsx");
 const hooks=read("components/admin-v2/views/operations/WebhookRegistryView.tsx");
 assert.match(automation,/internal staff-task rules/);
 assert.match(automation,/Run once today/);
 assert.match(tax,/does not modify checkout totals/);
 assert.match(tax,/Checkout tax: disabled/);
 assert.match(hooks,/never sends HTTP requests/);
 assert.match(hooks,/Delivery disabled/);
 assert.doesNotMatch(hooks,/fetch\("https:\/\//);
});
