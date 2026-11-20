import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { parseTaxProfile, readTaxPlanningProfile, saveTaxPlanningProfile, validVersion } from "@/lib/admin-v2/operations-store";
export const dynamic="force-dynamic";
const reply=(v:Record<string,unknown>,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
 if(!(await verifyFreshAdminRequestPermission(request,"tax.view")))return forbiddenAdminResponse();
 try{return reply({profile:await readTaxPlanningProfile()});}
 catch{return reply({errors:["Tax planning source unavailable."]},503);}
}
export async function PUT(request:Request){
 const session=await verifyFreshAdminRequestPermission(request,"tax.manage");
 if(!session)return forbiddenAdminResponse();
 const raw=await request.json().catch(()=>null) as Record<string,unknown>|null;
 const input=parseTaxProfile(raw);
 const revision=raw?.version;
 if(!input || !(revision===null||validVersion(revision)))return reply({errors:["Invalid tax profile or revision."]},400);
 try{
  const profile=await saveTaxPlanningProfile(input,session.username,revision);
  if(!profile)return reply({errors:["Tax profile changed; refresh to avoid overwriting."]},409);
  await logStaffActivity({actor:session,action:"tax.planning_updated",targetType:"tax_planning_profile",targetId:"BD",metadata:{revision:profile.version,checkoutTaxActive:false}});
  return reply({profile});
 }catch{return reply({errors:["Tax planning settings could not be saved."]},503);}
}
