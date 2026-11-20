import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { hasPermission } from "@/app/lib/admin-permissions";
import { readTaxPlanningProfile } from "@/lib/admin-v2/operations-store";
import { TaxPlanningView } from "@/components/admin-v2/views/operations/TaxPlanningView";

export default async function AdminV2TaxPage() {
 const session=await requireAdminV2Session();
 requireAdminV2RouteAccess(session,"tax");
 const result=await readTaxPlanningProfile().then(profile=>({available:true,profile})).catch(()=>({available:false,profile:null}));
 return <TaxPlanningView initial={result} canManage={hasPermission(session,"tax.manage")} />;
}
