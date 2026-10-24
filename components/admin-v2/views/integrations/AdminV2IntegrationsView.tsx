import Link from "next/link";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

export type IntegrationFact={name:string;status:string;detail:string};
export function AdminV2IntegrationsView({facts}:{facts:IntegrationFact[]}) {
 return <>
  <V2PageHeader title="Integrations" description="Verified configuration facts, not fabricated platform connections, API health charts or activity histories."
   breadcrumbs={[{label:"Admin V2",href:"/admin-v2/dashboard"},{label:"Integrations"}]}
   actions={<Button component={Link} href="/admin-v2/settings" variant="outlined">Store settings</Button>}/>
  <Stack spacing={2}>
   <Alert severity="info">This page shows configured or unavailable capabilities without exposing API keys. Provider credentials are not validated by a live paid request. No connected-service totals or success percentages are inferred.</Alert>
   {facts.map(fact=><V2Card key={fact.name}>
    <Stack direction={{xs:"column",md:"row"}} spacing={2} sx={{alignItems:{md:"center"},justifyContent:"space-between"}}>
      <Stack spacing={0.5}>
       <Typography variant="subtitle1" sx={{fontWeight:700}}>{fact.name}</Typography>
       <Typography variant="body2" color="text.secondary">{fact.detail}</Typography>
      </Stack>
      <Chip variant="outlined" label={fact.status}
       color={fact.status==="Data source responding"?"success":fact.status==="Source unavailable"?"error":"default"}/>
    </Stack>
   </V2Card>)}
  </Stack>
 </>;
}
