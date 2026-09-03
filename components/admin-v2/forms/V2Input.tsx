import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

export function V2Input(props: TextFieldProps) {
  return <TextField fullWidth size="small" {...props} />;
}
