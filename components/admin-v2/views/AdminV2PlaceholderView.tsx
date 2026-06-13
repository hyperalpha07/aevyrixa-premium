import { Stack, Typography } from "@mui/material";
import { Construction } from "lucide-react";
import { V2Card } from "@/components/admin-v2/shared/V2Card";
import { V2EmptyState } from "@/components/admin-v2/shared/V2EmptyState";
import { V2PageHeader } from "@/components/admin-v2/shared/V2PageHeader";

type AdminV2PlaceholderViewProps = {
  title: string;
  description: string;
  detail?: string;
};

export function AdminV2PlaceholderView({ title, description, detail }: AdminV2PlaceholderViewProps) {
  return (
    <>
      <V2PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: "Admin V2", href: "/admin-v2/dashboard" }, { label: title }]}
      />
      <V2Card>
        <Stack spacing={2}>
          <V2EmptyState
            icon={Construction}
            title="Module scaffolded"
            description="Module scaffolded. Backend workflow will be connected in a later phase."
          />
          {detail ? (
            <Typography variant="body2" color="text.secondary">
              {detail}
            </Typography>
          ) : null}
        </Stack>
      </V2Card>
    </>
  );
}
