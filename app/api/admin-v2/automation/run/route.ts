import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { runTaskAutomationRule, validId } from "@/lib/admin-v2/operations-store";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 const session=await verifyFreshAdminRequestPermission(request,"automation.manage");
 if(!session)return forbiddenAdminResponse();
 const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
 const id=typeof body?.id==="string"?body.id:"";
 if(!validId(id))return Response.json({errors:["Invalid rule."]},{status:400});
 try{
  const result=await runTaskAutomationRule(id,session.username);
  await logStaffActivity({actor:session,action:result.reused?"automation.run_reused":"automation.run_created",targetType:"automation_rule",targetId:id,metadata:{workTaskId:result.work_task_id,runId:result.run_id}});
  return Response.json({result},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return Response.json({errors:["Rule did not run. Check enablement and task backend."]},{status:409});}
}
