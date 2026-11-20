import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { createWebhookSubscription, listWebhookSubscriptions, parseWebhookDraft, updateWebhookSubscription, validId, validVersion } from "@/lib/admin-v2/operations-store";
export const dynamic="force-dynamic";
const reply=(v:Record<string,unknown>,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
 if(!(await verifyFreshAdminRequestPermission(request,"webhooks.view")))return forbiddenAdminResponse();
 try{return reply({subscriptions:await listWebhookSubscriptions()});}
 catch{return reply({errors:["Webhook registry unavailable."]},503);}
}
export async function POST(request:Request){
 const session=await verifyFreshAdminRequestPermission(request,"webhooks.manage");
 if(!session)return forbiddenAdminResponse();
 const input=parseWebhookDraft(await request.json().catch(()=>null));
 if(!input)return reply({errors:["Use an HTTPS public hostname, no URL credentials, port, query, or fragment."]},400);
 try{
  const subscription=await createWebhookSubscription(input,session.username);
  if(!subscription)return reply({errors:["Webhook record was not persisted."]},503);
  await logStaffActivity({actor:session,action:"webhook.registry_created",targetType:"webhook_subscription",targetId:subscription.id,metadata:{eventType:subscription.event_type,enabled:false}});
  return reply({subscription},201);
 }catch{return reply({errors:["Webhook record could not be saved."]},503);}
}
export async function PATCH(request:Request){
 const session=await verifyFreshAdminRequestPermission(request,"webhooks.manage");
 if(!session)return forbiddenAdminResponse();
 const raw=await request.json().catch(()=>null) as Record<string,unknown>|null;
 const input=parseWebhookDraft(raw),id=typeof raw?.id==="string"?raw.id:"";
 const revision=raw?.version;
 const archive=raw?.archive===true;
 if(!input||!validId(id)||!validVersion(revision))return reply({errors:["Invalid webhook record or revision."]},400);
 try{
  const subscription=await updateWebhookSubscription(id,revision,input,session.username,archive);
  if(!subscription)return reply({errors:["Webhook changed; refresh to avoid overwriting."]},409);
  await logStaffActivity({actor:session,action:archive?"webhook.registry_archived":"webhook.registry_updated",targetType:"webhook_subscription",targetId:id,metadata:{eventType:subscription.event_type,enabled:false}});
  return reply({subscription});
 }catch{return reply({errors:["Webhook record could not be updated."]},503);}
}
