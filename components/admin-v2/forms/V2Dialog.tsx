import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import type { DialogProps } from "@mui/material";
import { adminV2Motion } from "@/components/admin-v2/motion/motion-config";

type V2DialogProps = DialogProps & {
  title: string;
};

export function V2Dialog({ title, children, ...props }: V2DialogProps) {
  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      {...props}
      slotProps={{
        ...props.slotProps,
        backdrop: {
          sx: { backdropFilter: "blur(2px)", backgroundColor: "rgba(15, 23, 42, 0.34)" },
        },
        paper: {
          sx: {
            animation: `admin-v2-reveal ${adminV2Motion.duration.overlay}ms ${adminV2Motion.easing.entrance} both`,
          },
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}
