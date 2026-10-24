import {
 forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { getStoreSettings, saveStoreSettings } from "@/app/lib/settings-store";
import {
 extractHomepageAppearance, extractHomepageContent,
 mergeHomepageAppearance, mergeHomepageContent,
 validateHomepageAppearance, validateHomepageContent,
} from "@/lib/admin-v2/homepage/homepage-settings";

export const dynamic="force-dynamic";

export async function PATCH(request:Request) {
 const session=await getFreshAdminRequestSession(request);
 if(!session)return unauthorizedAdminResponse();
 const body=await request.json().catch(()=>null);
 if(!body||typeof body!=="object"||Array.isArray(body))
  return Response.json({errors:["Invalid homepage changes."]},{status:400});
 const {kind,before,after}=body as Record<string,unknown>;
 if(kind!=="content"&&kind!=="appearance")
  return Response.json({errors:["Unknown homepage settings group."]},{status:400});
 if(!hasPermission(session,kind==="content"?"homepage.manage":"settings.editBasic"))
  return forbiddenAdminResponse();
 const valid=kind==="content"
   ?validateHomepageContent(before)&&validateHomepageContent(after)
   :validateHomepageAppearance(before)&&validateHomepageAppearance(after);
 if(!valid)return Response.json({errors:["Homepage fields or values are invalid."]},{status:400});
 if(JSON.stringify(before)===JSON.stringify(after))
  return Response.json({errors:["No changes to save."]},{status:400});
 try {
  const source=await getStoreSettings();
  if(source.storageMode!=="supabase")
   return Response.json({errors:["Persisted store settings are unavailable."]},{status:503});
  const existing=kind==="content"
   ?extractHomepageContent(source.settings.homepageMediaSettings)
   :extractHomepageAppearance(source.settings.appearanceSettings);
  if(JSON.stringify(existing)!==JSON.stringify(before))
   return Response.json({errors:["The homepage was modified elsewhere. Refresh before retrying."]},{status:409});
  const next=kind==="content"
   ? {...source.settings,homepageMediaSettings:
       mergeHomepageContent(source.settings.homepageMediaSettings,after as typeof existing & ReturnType<typeof extractHomepageContent>)}
   : {...source.settings,appearanceSettings:
       mergeHomepageAppearance(source.settings.appearanceSettings,after as ReturnType<typeof extractHomepageAppearance>)};
  const saved=await saveStoreSettings(next);
  if(saved.storageMode!=="supabase")
   return Response.json({errors:["The changes could not be confirmed in persistent settings."]},{status:503});
  const current=kind==="content"
   ?extractHomepageContent(saved.settings.homepageMediaSettings)
   :extractHomepageAppearance(saved.settings.appearanceSettings);
  if(JSON.stringify(current)!==JSON.stringify(after))
   return Response.json({errors:["The save result did not match the submitted changes. Reload before retrying."]},{status:409});
  try {
   await logStaffActivity({actor:session,action:"settings.saved",targetType:"settings",
      targetId:kind==="content"?"homepage-media":"homepage-appearance",
      metadata:{source:"admin-v2-homepage",group:kind}});
  } catch(error) {
   console.error("[admin-v2:homepage] Saved but audit logging failed",error);
  }
  return Response.json({group:kind,updated:current},{headers:{"cache-control":"no-store"}});
 } catch(error) {
  console.error("[admin-v2:homepage] Unable to save homepage settings",error);
  return Response.json({errors:["Homepage changes were not saved. Retry after the source recovers."]},{status:503});
 }
}
