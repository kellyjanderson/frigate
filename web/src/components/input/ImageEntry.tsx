import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuUpload, LuX } from "react-icons/lu";
import { z } from "zod";

type BaseImageEntryProps = {
  children?: React.ReactNode;
  maxSize?: number;
  accept?: Record<string, string[]>;
};

type ImageEntryProps = BaseImageEntryProps &
  (
    | {
        multiple: true;
        onSave: (files: File[]) => void;
      }
    | {
        multiple?: false;
        onSave: (file: File) => void;
      }
  );

export default function ImageEntry(props: ImageEntryProps) {
  const {
    children,
    maxSize = 20 * 1024 * 1024, // 20MB default
    accept = { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    multiple = false,
  } = props;
  const { t } = useTranslation(["views/faceLibrary"]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const previews = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles],
  );

  // Auto focus the dropzone
  useEffect(() => {
    if (dropzoneRef.current && selectedFiles.length === 0) {
      dropzoneRef.current.focus();
    }
  }, [selectedFiles]);

  // Release preview URLs when the selected files change or the component
  // unmounts.
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const formSchema = z.object({
    files: z
      .array(z.instanceof(File))
      .min(1, { message: t("imageEntry.validation.selectImage") }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
    },
  });

  const updateFiles = useCallback(
    (files: File[]) => {
      const nextFiles = multiple ? files : files.slice(0, 1);
      setSelectedFiles(nextFiles);
      form.setValue("files", nextFiles, { shouldValidate: true });
    },
    [form, multiple],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        updateFiles(acceptedFiles);
      }
    },
    [updateFiles],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      maxSize,
      accept,
      multiple,
    });

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const clipboardItems = Array.from(event.clipboardData.items);
      const pastedFiles: File[] = [];

      for (const item of clipboardItems) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob && blob.size <= maxSize) {
            const mimeType = blob.type.split("/")[1];
            const extension = `.${mimeType}`;
            if (accept["image/*"].includes(extension)) {
              const fileName = blob.name || `pasted-image.${mimeType}`;
              pastedFiles.push(new File([blob], fileName, { type: blob.type }));

              if (!multiple) {
                break;
              }
            }
          }
        }
      }

      if (pastedFiles.length > 0) {
        updateFiles(pastedFiles);
      }
    },
    [accept, maxSize, multiple, updateFiles],
  );

  const onSubmit = useCallback(
    (data: z.infer<typeof formSchema>) => {
      if (props.multiple) {
        props.onSave(data.files);
      } else {
        props.onSave(data.files[0]);
      }
    },
    [props],
  );

  const removeSelection = (index: number) => {
    updateFiles(selectedFiles.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="files"
          render={() => (
            <FormItem>
              <FormControl>
                <div
                  className="w-full"
                  onPaste={handlePaste}
                  tabIndex={0}
                  ref={dropzoneRef}
                >
                  {previews.length === 0 ? (
                    <div
                      {...getRootProps()}
                      className={cn(
                        "flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                        isDragActive && "border-primary bg-primary/5",
                        isDragReject && "border-destructive bg-destructive/5",
                        "cursor-pointer hover:border-primary hover:bg-primary/5",
                      )}
                    >
                      <input {...getInputProps()} />
                      <LuUpload className="mb-2 h-10 w-10 text-muted-foreground" />
                      <p className="text-center text-sm text-muted-foreground">
                        {isDragActive
                          ? t(
                              multiple
                                ? "imageEntry.dropActiveMultiple"
                                : "imageEntry.dropActive",
                            )
                          : t(
                              multiple
                                ? "imageEntry.dropInstructionsMultiple"
                                : "imageEntry.dropInstructions",
                            )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t(
                          multiple
                            ? "imageEntry.maxSizeMultiple"
                            : "imageEntry.maxSize",
                          {
                            size: Math.round(maxSize / (1024 * 1024)),
                          },
                        )}
                      </p>
                    </div>
                  ) : multiple ? (
                    <div className="flex h-40 flex-col gap-2">
                      <p
                        className="text-sm text-muted-foreground"
                        aria-live="polite"
                      >
                        {t("imageEntry.selectedImages", {
                          count: selectedFiles.length,
                        })}
                      </p>
                      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                        {previews.map((preview, index) => (
                          <div
                            className="relative h-24 min-w-0"
                            key={`${selectedFiles[index].name}-${index}`}
                          >
                            <img
                              src={preview}
                              alt={t("imageEntry.previewAlt", {
                                fileName: selectedFiles[index].name,
                              })}
                              className="h-full w-full rounded-lg border object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute right-1 top-1 size-8 rounded-full"
                              aria-label={t("imageEntry.removeImage", {
                                fileName: selectedFiles[index].name,
                              })}
                              onClick={() => removeSelection(index)}
                            >
                              <LuX className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-40 w-full">
                      <img
                        src={previews[0]}
                        alt={t("imageEntry.previewAlt", {
                          fileName: selectedFiles[0].name,
                        })}
                        className="h-full w-full rounded-lg border object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 size-8 rounded-full"
                        aria-label={t("imageEntry.removeImage", {
                          fileName: selectedFiles[0].name,
                        })}
                        onClick={() => removeSelection(0)}
                      >
                        <LuX className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="mt-4 flex justify-end">{children}</div>
      </form>
    </Form>
  );
}
