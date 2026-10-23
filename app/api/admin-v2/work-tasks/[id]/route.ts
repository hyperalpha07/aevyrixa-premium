import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { updateWorkTask } from "@/lib/admin-v2/work-tasks/work-tasks-store";
import { safeTaskPayload } from "@/lib/admin-v2/work-tasks/work-tasks-validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context:{params:Promise<{id:string}>}) {
 const session=await getFreshAdminRequestSession(request);
 if(!session) return unauthorizedAdminResponse();
 if(!hasPermission(session,"staff.manage")) return forbiddenAdminResponse();
 const {id}=await context.params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
   return Response.json({errors:["Invalid task ID."]},{status:400});
 const payload=safeTaskPayload(await request.json().catch(()=>null),true);
 if(!payload) return Response.json({errors:["Invalid task fields, date or version."]},{status:400});
 try {
   const item=await updateWorkTask({id,...payload,actor:session.displayName});
   return Response.json({task:item},{headers:{"cache-control":"no-store"}});
 } catch(error) {
   console.error("[admin-v2:tasks] Update rejected",error instanceof Error?error.message:"Unknown");
   return Response.json({errors:["Task could not be updated. Refresh if another staff member changed it."]},{status:409});
 }
}
