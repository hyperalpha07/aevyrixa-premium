import { AdminV2KanbanView } from "@/components/admin-v2/views/kanban/AdminV2KanbanView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { loadWorkTasks } from "@/lib/admin-v2/work-tasks/work-tasks-store";

export default async function AdminV2KanbanPage() {
 const session=await requireAdminV2Session();
 requireAdminV2RouteAccess(session,"kanban");
 const data=await loadWorkTasks().catch(()=>({available:false,rows:[],totalCount:0}));
 return <AdminV2KanbanView data={data} />;
}
