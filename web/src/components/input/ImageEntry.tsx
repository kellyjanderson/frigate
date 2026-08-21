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
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LuUpload, LuX } from "react-icons/lu";
import { z } from "zod";

type ImageEntryProps = {
  onSave: (file: File) => void;
  children?: ReactNode;
  maxSize?: number;
  accept?: Record<string, string[]>;
  initialImageLink?: string;
};

const DEFAULT_ACCEPT = {
  "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
};

function normalizedExtension(name: string): string | null {
  const extensionIndex = name.lastIndexOf(".");
  return extensionIndex === -1
    ? null
    : name.slice(extensionIndex).toLowerCase();
}

function extensionForMime(mimeType: string): string | null {
  const subtype = mimeType.toLowerCase().split("/")[1];
  if (!subtype) return null;
  return subtype === "jpeg" ? ".jpeg" : `.${subtype}`;
}

function extensionMatchesMime(extension: string, mimeType: string): boolean {
  if (mimeType.toLowerCase() === "image/jpeg") {
    return extension === ".jpeg" || extension === ".jpg";
  }
  return extension === extensionForMime(mimeType);
}

function acceptsFile(
  file: Pick<File, "name" | "type" | "size">,
  accept: Record<string, string[]>,
  maxSize: number,
): boolean {
  const mimeType = file.type.toLowerCase();
  const extension = normalizedExtension(file.name);
  if (!mimeType.startsWith("image/") || !extension || file.size > maxSize) {
    return false;
  }

  return Object.entries(accept).some(([acceptedMime, extensions]) => {
    const normalizedMime = acceptedMime.toLowerCase();
    const mimeMatches =
      normalizedMime === mimeType ||
      (normalizedMime.endsWith("/*") &&
        mimeType.startsWith(normalizedMime.slice(0, -1)));
    return (
      mimeMatches &&
      extensionMatchesMime(extension, mimeType) &&
      extensions.map((value) => value.toLowerCase()).includes(extension)
    );
  });
}

function disableSubmitControls(node: ReactNode, disabled: boolean): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;

    const element = child as ReactElement<{
      children?: ReactNode;
      disabled?: boolean;
      type?: string;
    }>;
    const nestedChildren = disableSubmitControls(
      element.props.children,
      disabled,
    );
    const disabledProp =
      element.props.type === "submit"
        ? { disabled: disabled || element.props.disabled }
        : {};
    return cloneElement(element, disabledProp, nestedChildren);
  });
}

export default function ImageEntry({
  onSave,
  children,
  maxSize = 20 * 1024 * 1024, // 20MB default
  accept = DEFAULT_ACCEPT,
  initialImageLink,
}: ImageEntryProps) {
  const { t } = useTranslation(["views/faceLibrary"]);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationFailed, setHydrationFailed] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<string | null>(null);
  const hydrationControllerRef = useRef<AbortController | null>(null);
  const hydrationRequestRef = useRef(0);
  const suppressedLinkRef = useRef<string | null>(null);

  // Auto focus the dropzone
  useEffect(() => {
    if (dropzoneRef.current && !preview) {
      dropzoneRef.current.focus();
    }
  }, [preview]);

  const formSchema = z.object({
    file: z
      .instanceof(File, { message: t("imageEntry.validation.selectImage") })
      .refine((file) => acceptsFile(file, accept, maxSize)),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const selectedFile = form.watch("file");

  const revokePreview = useCallback(() => {
    if (!previewRef.current) return;
    URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
  }, []);

  const clearFileAndPreview = useCallback(() => {
    form.resetField("file");
    revokePreview();
    setPreview(null);
  }, [form, revokePreview]);

  const applyValidatedFile = useCallback(
    (file: File) => {
      hydrationRequestRef.current += 1;
      hydrationControllerRef.current?.abort();
      hydrationControllerRef.current = null;
      revokePreview();
      const objectUrl = URL.createObjectURL(file);
      previewRef.current = objectUrl;
      form.setValue("file", file, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setPreview(objectUrl);
      setHydrationFailed(false);
      setIsHydrating(false);
    },
    [form, revokePreview],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        applyValidatedFile(acceptedFiles[0]);
      }
    },
    [applyValidatedFile],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      maxSize,
      accept,
      multiple: false,
    });

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const clipboardItems = Array.from(event.clipboardData.items);
      for (const item of clipboardItems) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob && blob.size <= maxSize) {
            const mimeType = blob.type.split("/")[1];
            const fileName = blob.name || `pasted-image.${mimeType}`;
            const file = new File([blob], fileName, { type: blob.type });
            if (acceptsFile(file, accept, maxSize)) {
              applyValidatedFile(file);
              return; // Take the first valid image
            }
          }
        }
      }
    },
    [applyValidatedFile, maxSize, accept],
  );

  useEffect(() => {
    hydrationRequestRef.current += 1;
    const requestId = hydrationRequestRef.current;
    hydrationControllerRef.current?.abort();
    hydrationControllerRef.current = null;
    clearFileAndPreview();
    setHydrationFailed(false);
    setIsHydrating(false);

    if (!initialImageLink) return;
    if (suppressedLinkRef.current === initialImageLink) return;
    suppressedLinkRef.current = null;

    let initialUrl: URL;
    try {
      initialUrl = new URL(initialImageLink, window.location.origin);
    } catch {
      setHydrationFailed(true);
      return;
    }
    if (initialUrl.origin !== window.location.origin) {
      setHydrationFailed(true);
      return;
    }

    const controller = new AbortController();
    hydrationControllerRef.current = controller;
    setIsHydrating(true);

    const hydrate = async () => {
      try {
        const response = await fetch(initialUrl, { signal: controller.signal });
        if (!response.ok) throw new Error("Initial image request failed");

        const finalUrl = new URL(response.url || initialUrl.href);
        if (finalUrl.origin !== window.location.origin) {
          throw new Error("Initial image redirect was refused");
        }

        const declaredSize = response.headers.get("Content-Length");
        if (declaredSize !== null) {
          const parsedSize = Number(declaredSize);
          if (Number.isFinite(parsedSize) && parsedSize > maxSize) {
            controller.abort();
            if (hydrationRequestRef.current === requestId) {
              hydrationControllerRef.current = null;
              setIsHydrating(false);
              setHydrationFailed(true);
            }
            return;
          }
        }

        const blob = await response.blob();
        if (blob.size === 0 || blob.size > maxSize) {
          throw new Error("Initial image has an invalid size");
        }

        const fallbackExtension = extensionForMime(blob.type);
        if (!fallbackExtension) {
          throw new Error("Initial image type is not supported");
        }
        let decodedName = "";
        try {
          decodedName = decodeURIComponent(
            finalUrl.pathname.split("/").pop() ?? "",
          );
        } catch {
          decodedName = "";
        }
        const decodedExtension = normalizedExtension(decodedName);
        const admittedExtensions = Object.values(accept)
          .flat()
          .map((value) => value.toLowerCase());
        let fileName = `initial-image${fallbackExtension}`;
        if (decodedExtension && admittedExtensions.includes(decodedExtension)) {
          if (!extensionMatchesMime(decodedExtension, blob.type)) {
            throw new Error("Initial image extension does not match its type");
          }
          fileName = decodedName;
        }
        const file = new File([blob], fileName, { type: blob.type });
        if (!acceptsFile(file, accept, maxSize)) {
          throw new Error("Initial image type is not accepted");
        }

        if (
          controller.signal.aborted ||
          hydrationRequestRef.current !== requestId
        ) {
          return;
        }
        hydrationControllerRef.current = null;
        applyValidatedFile(file);
      } catch {
        if (
          controller.signal.aborted ||
          hydrationRequestRef.current !== requestId
        ) {
          return;
        }
        hydrationControllerRef.current = null;
        setIsHydrating(false);
        setHydrationFailed(true);
      }
    };

    void hydrate();
    return () => controller.abort();
  }, [
    accept,
    applyValidatedFile,
    clearFileAndPreview,
    initialImageLink,
    maxSize,
  ]);

  useEffect(() => {
    return () => {
      hydrationRequestRef.current += 1;
      hydrationControllerRef.current?.abort();
      revokePreview();
    };
  }, [revokePreview]);

  const onSubmit = useCallback(
    (data: z.infer<typeof formSchema>) => {
      if (!data.file) return;
      onSave(data.file);
    },
    [onSave],
  );

  const clearSelection = () => {
    hydrationRequestRef.current += 1;
    hydrationControllerRef.current?.abort();
    hydrationControllerRef.current = null;
    suppressedLinkRef.current = initialImageLink ?? null;
    clearFileAndPreview();
    setHydrationFailed(false);
    setIsHydrating(false);
  };

  return (
    <Form {...form}>
      <form
        aria-busy={isHydrating}
        onSubmit={(event) => {
          if (isHydrating) {
            event.preventDefault();
            return;
          }
          void form.handleSubmit(onSubmit)(event);
        }}
      >
        <FormField
          control={form.control}
          name="file"
          render={() => (
            <FormItem>
              <FormControl>
                <div
                  className="w-full"
                  onPaste={handlePaste}
                  tabIndex={0}
                  ref={dropzoneRef}
                >
                  {!preview ? (
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
                          ? t("imageEntry.dropActive")
                          : t("imageEntry.dropInstructions")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("imageEntry.maxSize", {
                          size: Math.round(maxSize / (1024 * 1024)),
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="relative h-40 w-full">
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full rounded-lg border object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 size-5 rounded-full"
                        onClick={clearSelection}
                      >
                        <LuX className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
              {isHydrating && (
                <div className="flex items-center justify-between gap-2">
                  <p role="status" className="text-sm text-muted-foreground">
                    {t("imageEntry.initialImageLoading")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                  >
                    {t("imageEntry.removeInitialImage")}
                  </Button>
                </div>
              )}
              {hydrationFailed && (
                <p role="alert" className="text-sm text-destructive">
                  {t("imageEntry.initialImageFailure")}
                </p>
              )}
            </FormItem>
          )}
        />
        <div className="mt-4 flex justify-end">
          {disableSubmitControls(children, isHydrating || !selectedFile)}
        </div>
      </form>
    </Form>
  );
}
