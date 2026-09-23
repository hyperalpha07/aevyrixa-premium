"use client";

import { TextField, type TextFieldProps } from "@mui/material";

/** Shared page-search appearance; callers retain their own form/state behavior. */
export function V2SearchField({ sx, ...props }: TextFieldProps) {
  return (
    <TextField
      fullWidth
      type="search"
      {...props}
      size="small"
      variant="outlined"
      sx={[
        (theme) => ({
          "& .MuiOutlinedInput-root": {
            height: 40,
            borderRadius: "8px",
            backgroundColor: "action.hover",
            transition: "box-shadow 150ms ease",
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "text.secondary",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "text.primary" },
            "&.Mui-focused": { boxShadow: `0 0 0 3px ${theme.palette.primary.main}1f` },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "primary.main",
            },
          },
          "& .MuiOutlinedInput-input": {
            padding: "9px 12px",
            "&::placeholder": { color: "text.secondary", opacity: 1 },
          },
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
}
