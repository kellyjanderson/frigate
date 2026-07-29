import ImageEntry from "@/components/input/ImageEntry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

type UploadImageDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  setOpen: (open: boolean) => void;
  onSave: (files: File[]) => void;
  progress?: {
    completed: number;
    total: number;
  } | null;
};
export default function UploadImageDialog({
  open,
  title,
  description,
  setOpen,
  onSave,
  progress,
}: UploadImageDialogProps) {
  const { t } = useTranslation(["common", "views/faceLibrary"]);
  const isUploading = progress != null;

  return (
    <Dialog
      open={open}
      defaultOpen={false}
      onOpenChange={(nextOpen) => {
        if (!isUploading) {
          setOpen(nextOpen);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ImageEntry multiple onSave={onSave}>
          {progress && (
            <p
              className="mr-auto self-center text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {t("imageEntry.uploadProgress", {
                ns: "views/faceLibrary",
                completed: progress.completed,
                total: progress.total,
              })}
            </p>
          )}
          <DialogFooter className="pt-4">
            <Button
              type="button"
              disabled={isUploading}
              onClick={() => setOpen(false)}
            >
              {t("button.cancel")}
            </Button>
            <Button variant="select" type="submit" disabled={isUploading}>
              {t("button.save")}
            </Button>
          </DialogFooter>
        </ImageEntry>
      </DialogContent>
    </Dialog>
  );
}
