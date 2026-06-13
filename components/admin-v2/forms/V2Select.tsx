import { MenuItem, TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

type V2SelectProps = TextFieldProps & {
  options: Array<{ label: string; value: string }>;
};

export function V2Select({ options, ...props }: V2SelectProps) {
  return (
    <TextField select fullWidth size="small" {...props}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
