import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { createWorkTask } from "@/lib/admin-v2/work-tasks/work-tasks-store";
import { safeTaskPayload } from "@/lib/admin-v2/work-tasks/work-tasks-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
 const session=await getFreshAdminRequestSession(request);
 if(!session) return unauthorizedAdminResponse();
 if(!hasPermission(session,"staff.manage")) return forbiddenAdminResponse();
 const payload=safeTaskPayload(await request.json().catch(()=>null));
 if(!payload) return Response.json({errors:["Invalid task title, due date or priority."]},{status:400});
 try {
   const item=await createWorkTask({...payload,actor:session.displayName});
   return Response.json({task:item},{status:201,headers:{"cache-control":"no-store"}});
 } catch(error) {
   console.error("[admin-v2:tasks] Create rejected",error instanceof Error?error.message:"Unknown");
   return Response.json({errors:["Task could not be created. Check the persistent task source."]},{status:503});
 }
}
