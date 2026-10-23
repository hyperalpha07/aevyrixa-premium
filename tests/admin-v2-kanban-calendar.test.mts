import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { safeTaskPayload } from "../lib/admin-v2/work-tasks/work-tasks-validation.ts";

const read=(p:string)=>readFileSync(new URL(`../${p}`,import.meta.url),"utf8");

test("Work tasks reject invalid title, priority, date and version",()=>{
 const original={title:"Ship launch bundle",description:"Prepare courier list",assignee:"Ops",priority:"high",dueDate:"2026-10-31"};
 const created=safeTaskPayload(original);
 assert.equal(created?.title,"Ship launch bundle");
 assert.equal(created?.status,"todo");
 assert.equal(created?.dueDate,"2026-10-31");
 for(const data of [
  {...original,title:"x"},
  {...original,priority:"urgent"},
  {...original,dueDate:"2026-02-31"},
  {...original,dueDate:"tomorrow"},
  {...original,description:"x".repeat(2100)},
  {...original,assignee:"x".repeat(125)},
  null,
 ]) assert.equal(safeTaskPayload(data),null);
 assert.ok(safeTaskPayload({...original,status:"doing",version:1},true));
 assert.equal(safeTaskPayload({...original,status:"doing",version:0},true),null);
});

test("Task tables enforce RLS, optimistic versioning and append-only audit",()=>{
 const sql=read("supabase/migrations/20261024100000_admin_work_tasks_calendar.sql");
 assert.match(sql,/admin_work_tasks enable row level security/);
 assert.match(sql,/admin_work_task_events enable row level security/);
 assert.match(sql,/new.version <> old.version \+ 1/);
 assert.match(sql,/old.task_status='done'/);
 assert.match(sql,/admin_work_task_audit_trigger after insert or update/);
 assert.match(sql,/revoke all on public.admin_work_tasks from public, anon, authenticated/);
 assert.match(sql,/grant select,insert,update on public.admin_work_tasks to service_role/);
 assert.doesNotMatch(sql,/update public.orders|update public.finance_/);
});

test("Kanban and Calendar require actual authorized staff session and persisted source",()=>{
 const kanban=read("app/admin-v2/kanban/page.tsx");
 const calendar=read("app/admin-v2/calendar/page.tsx");
 const routes=read("configs/admin-v2/routes.ts");
 for(const [page,permission] of [[kanban,"kanban"],[calendar,"calendar"]] as const){
  assert.match(page,/requireAdminV2Session\(\)/);
  assert.match(page, /requireAdminV2RouteAccess\\(/);
  assert.match(page, new RegExp(`"${permission}"`));
  assert.match(page,/loadWorkTasks\(/);
  assert.match(routes,new RegExp(`module: "${permission}"[^\\n]+implemented: true`));
 }
 const store=read("lib/admin-v2/work-tasks/work-tasks-store.ts");
 assert.match(store,/"server-only"/);
 assert.match(store,/count>250/);
 assert.match(store,/version:\`eq\.\$\{input\.version\}\`/);
});

test("Write endpoints check fresh staff.manage and never post financial transactions",()=>{
 const create=read("app/api/admin-v2/work-tasks/route.ts");
 const update=read("app/api/admin-v2/work-tasks/[id]/route.ts");
 for(const source of [create,update]){
  assert.match(source,/getFreshAdminRequestSession\(request\)/);
  assert.match(source,/hasPermission\(session,"staff.manage"\)/);
  assert.doesNotMatch(source,/finance\/payments|finance\/refunds|updateOrderStatus/);
 }
 const board=read("components/admin-v2/views/kanban/AdminV2KanbanView.tsx");
 assert.match(board,/\/api\/admin-v2\/work-tasks/);
 const month=read("components/admin-v2/views/calendar/AdminV2CalendarView.tsx");
 assert.match(month,/task\.due_date/);
 assert.match(month,/Not connected to Google Calendar/);
});
