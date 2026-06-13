import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import type { DialogProps } from "@mui/material";

type V2DialogProps = DialogProps & {
  title: string;
};

export function V2Dialog({ title, children, ...props }: V2DialogProps) {
  return (
    <Dialog fullWidth maxWidth="sm" {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}
