import { IconButton, Tooltip } from "@mui/material";
import type { IconButtonProps } from "@mui/material";

type V2IconButtonProps = IconButtonProps & {
  label: string;
};

export function V2IconButton({ label, ...props }: V2IconButtonProps) {
  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} {...props} />
    </Tooltip>
  );
}
