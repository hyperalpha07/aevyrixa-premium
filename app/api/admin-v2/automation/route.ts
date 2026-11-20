import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { createTaskAutomationRule, listTaskAutomationRules, parseTaskRule, updateTaskAutomationRule, validId, validVersion } from "@/lib/admin-v2/operations-store";
export const dynamic="force-dynamic";
const reply=(data:Record<string,unknown>,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
 if(!(await verifyFreshAdminRequestPermission(request,"automation.view")))return forbiddenAdminResponse();
 try{return reply(await listTaskAutomationRules());}
 catch{return reply({errors:["Automation backend unavailable."]},503);}
}
export async function POST(request:Request){
 const session=await verifyFreshAdminRequestPermission(request,"automation.manage");
 if(!session)return forbiddenAdminResponse();
 const input=parseTaskRule(await request.json().catch(()=>null));
 if(!input)return reply({errors:["Invalid internal automation rule."]},400);
 try{
  const rule=await createTaskAutomationRule(input,session.username);
  if(!rule)return reply({errors:["Rule could not be persisted."]},503);
  await logStaffActivity({actor:session,action:"automation.rule_created",targetType:"automation_rule",targetId:rule.id,metadata:{schedule:rule.schedule_mode}});
  return reply({rule},201);
 }catch{return reply({errors:["Automation rule could not be saved."]},503);}
}
export async function PATCH(request:Request){
 const session=await verifyFreshAdminRequestPermission(request,"automation.manage");
 if(!session)return forbiddenAdminResponse();
 const raw=await request.json().catch(()=>null) as Record<string,unknown>|null;
 const id=typeof raw?.id==="string"?raw.id:"",revision=raw?.version;
 const input=parseTaskRule(raw);
 if(!validId(id)||!validVersion(revision)||!input)return reply({errors:["Invalid rule or revision."]},400);
 try{
  const rule=await updateTaskAutomationRule(id,revision,input,session.username);
  if(!rule)return reply({errors:["Rule changed in another session; refresh."]},409);
  await logStaffActivity({actor:session,action:"automation.rule_updated",targetType:"automation_rule",targetId:id,metadata:{enabled:rule.is_enabled,revision:rule.version}});
  return reply({rule});
 }catch{return reply({errors:["Automation rule could not be updated."]},503);}
}
