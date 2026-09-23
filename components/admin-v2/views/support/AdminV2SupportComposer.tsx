"use client";

import { useRef, useState } from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import { V2Button } from "@/components/admin-v2/shared/V2Button";

export function AdminV2SupportComposer({ busy, onReply }: { busy: boolean; onReply: (body: string) => Promise<boolean> }) {
  const [body, setBody] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);

  async function submitReply() {
    const value = body.trim();
    if (busy || submitting.current || !value) return;
    submitting.current = true;
    try {
      if (await onReply(value)) setBody("");
    } finally {
      submitting.current = false;
    }
  }

  return <Box component="form" ref={formRef} onSubmit={event => {
    event.preventDefault();
    void submitReply();
  }} sx={{ p: 2, borderTop: 1, borderColor: "divider", bgcolor: "rgba(248, 247, 252, 0.72)" }}>
    <Box sx={{ p: 1.25, border: 1, borderColor: "rgba(124, 77, 255, 0.2)", borderRadius: 2.5, bgcolor: "background.paper", boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.75)" }}>
      <TextField placeholder="Write a helpful reply..." fullWidth multiline minRows={2} maxRows={6}
        value={body} disabled={busy}
        onChange={event => setBody(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        slotProps={{ htmlInput: { maxLength: 4000, "aria-label": "Reply to customer" } }}
        sx={{
          "& .MuiInputBase-root": { p: 0, border: 0, bgcolor: "transparent" },
          "& .MuiOutlinedInput-notchedOutline": { border: 0 },
          "& textarea": { lineHeight: 1.58 },
        }} />
      <Stack direction="row" sx={{ mt: 1.25, justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography variant="caption" color="text.secondary">Enter to send - Shift+Enter for new line - {body.length} / 4000</Typography>
        <V2Button type="submit" variant="contained" loading={busy} disabled={busy || submitting.current || !body.trim()}>Send Reply</V2Button>
      </Stack>
    </Box>
  </Box>;
}
