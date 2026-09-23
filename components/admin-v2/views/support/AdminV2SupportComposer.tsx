"use client";

import { useState } from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { V2Button } from "@/components/admin-v2/shared/V2Button";

export function AdminV2SupportComposer({ busy, onReply }: { busy: boolean; onReply: (body: string) => Promise<boolean> }) {
  const [body, setBody] = useState("");
  return <Box component="form" onSubmit={async event => {
    event.preventDefault();
    if (busy || !body.trim()) return;
    if (await onReply(body.trim())) setBody("");
  }} sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
    <TextField label="Reply to customer" placeholder="Write a helpful reply…" fullWidth multiline minRows={3} maxRows={7}
      value={body} disabled={busy} onChange={event => setBody(event.target.value)} slotProps={{ htmlInput: { maxLength: 4000 } }} />
    <Stack direction="row" sx={{ mt: 1.5, justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="caption" color="text.secondary">{body.length} / 4000 characters</Typography>
      <V2Button type="submit" variant="contained" loading={busy} disabled={busy || !body.trim()}>Send Reply</V2Button>
    </Stack>
  </Box>;
}
