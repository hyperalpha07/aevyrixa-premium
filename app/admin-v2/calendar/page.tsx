import { AdminV2CalendarView } from "@/components/admin-v2/views/calendar/AdminV2CalendarView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { loadWorkTasks } from "@/lib/admin-v2/work-tasks/work-tasks-store";

export default async function AdminV2CalendarPage(props: PageProps<"/admin-v2/calendar">) {
 const session=await requireAdminV2Session();
 requireAdminV2RouteAccess(session,"calendar");
 const search=await props.searchParams;
 const raw=Array.isArray(search?.month)?search.month[0]:search?.month;
 const month=raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw)?raw:new Date().toISOString().slice(0,7);
 const data=await loadWorkTasks(month).catch(()=>({available:false,rows:[],totalCount:0}));
 return <AdminV2CalendarView month={month} data={data} />;
}
