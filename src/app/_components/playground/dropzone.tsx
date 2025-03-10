"use client";

import { Card, CardContent } from "@/app/_components/ui/card";
import { cn } from "@/lib/utils";
import { uploadPlayground } from "@/server/actions/playground";
import React, { forwardRef, useRef, useState } from "react";
import { useServerAction } from "zsa-react";
import { useToast } from "../ui/use-toast";
import { useTranslations } from "next-intl";
import { PlaygroundTask, PlaygroundTaskStatus } from "@prisma/client";
import Image from "next/image";

interface DropzoneProps extends React.InputHTMLAttributes<HTMLInputElement> {
  projectId: string;
  className?: string;
  fileExtension?: string;
  status?: PlaygroundTaskStatus;
  onUploaded: (playgroundTask: PlaygroundTask) => void;
}

interface DropzoneHandle {
  click: () => void;
  getFiles: () => FileList | null;
}

const Dropzone = forwardRef<DropzoneHandle, DropzoneProps>(function Dropzone(
  { onUploaded, projectId, status, className, fileExtension, ...props },
  ref
) {
  // Initialize state variables using the useState hook
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Reference to file input element
  const [fileInfo, setFileInfo] = useState<string | null>(null); // Information about the uploaded file
  const [filePreview, setFilePreview] = useState<string | null>(null); // File preview state
  const [error, setError] = useState<string | null>(null); // Error message state
  const { toast } = useToast();
  const t = useTranslations("Playground.Index");

  const { execute, isPending } = useServerAction(uploadPlayground, {
    onSuccess: (result) => {
      onUploaded(result.data);
    },
    onError: (error) => {
      toast({
        title: t("errorUpload"),
        description: t("errorUploadDescription"),
        variant: "destructive"
      });
      setError(t("errorUpload"));
      setFileInfo(null);
      setFilePreview(null);
    }
  });

  // Function to handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Function to handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { files } = e.dataTransfer;
    handleFiles(files);
  };

  // Function to handle file input change event
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files) {
      handleFiles(files);
    }
  };

  // Function to handle processing of uploaded files
  const handleFiles = (files: FileList) => {
    const uploadedFile = files[0];

    // Check file extension
    if (fileExtension && !uploadedFile.name.endsWith(`.${fileExtension}`)) {
      setError(`Invalid file type. Expected: .${fileExtension}`);
      return;
    }

    const fileSizeInKB = Math.round(uploadedFile.size / 1024); // Convert to KB

    const fileList = Array.from(files).map((file) => URL.createObjectURL(file));
    // onChange((prevFiles) => [...prevFiles, ...fileList]);

    // Display file information
    setFileInfo(`Uploaded file: ${uploadedFile.name} (${fileSizeInKB} KB)`);
    setFilePreview(URL.createObjectURL(uploadedFile));
    setError(null); // Reset error state

    // Execute server action
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("projectId", projectId);
    execute(formData);
  };

  // Function to simulate a click on the file input element
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card
      className={cn(
        filePreview
          ? `h-96 border-2 bg-muted hover:border-muted-foreground/50`
          : `h-96 border-2 border-dashed bg-muted hover:cursor-pointer hover:border-muted-foreground/50}`,
        className
      )}
    >
      {filePreview ? (
        <CardContent className="flex flex-col items-center justify-center h-full space-y-2 px-2 py-4 text-xs">
          <div className="w-full h-full relative">
            <Image src={filePreview} alt="Preview" className={cn("h-full w-auto", (status === "PROCESSING" || status === "PENDING") && "shimmer")} fill />
          </div>
        </CardContent>
      ) : (
        <CardContent
          className="flex flex-col items-center justify-center h-full space-y-2 px-2 py-4 text-xs"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="flex items-center justify-center text-muted-foreground">
            <span className="font-medium">
              {t('dragOrUpload')}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={`.${fileExtension}`} // Set accepted file type
              onChange={handleFileInputChange}
              className="hidden"
              multiple
              {...props}
            />
          </div>
          {fileInfo && <p className="text-muted-foreground">{fileInfo}</p>}
          {error && <span className="text-red-500">{error}</span>}
        </CardContent>
      )}
    </Card>
  );
});

Dropzone.displayName = "Dropzone";
export { Dropzone };