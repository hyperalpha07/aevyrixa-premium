import Link from "next/link";
import { Alert, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { futureProviderSlots } from "@/lib/admin-v2/integrations/future-providers";

/** Display only. Never renders a secret-entry form, connection toggle, or API call. */
export function FutureProviderSlots() {
  return <Stack spacing={2}>
    <Stack spacing={0.5}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>Future API connections</Typography>
      <Typography variant="body2" color="text.secondary">
        Ready for provider onboarding when you obtain official accounts and API credentials.
        No integration is enabled here. Credentials must be configured securely on the server after verification.
      </Typography>
    </Stack>
    <Alert severity="info">
      These are reserved integration slots, not active connections. Merchant settlement, courier booking
      and WhatsApp messages are disabled. Existing manual workflows remain available.
    </Alert>
    {futureProviderSlots.map((provider) => <V2Card key={provider.id}>
      <Stack spacing={1.25}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{provider.name}</Typography>
            <Typography variant="caption" color="text.secondary">{provider.category}</Typography>
          </Stack>
          <Chip label="Awaiting API onboarding" size="small" variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary">{provider.description}</Typography>
        <Divider />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Required before activation</Typography>
        <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
          {provider.prerequisites.map((item) => <Typography key={item} component="li" variant="body2" color="text.secondary">{item}</Typography>)}
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Button component={Link} href={provider.destination} size="small" variant="outlined">{provider.destinationLabel}</Button>
        </Stack>
      </Stack>
    </V2Card>)}
  </Stack>;
}
