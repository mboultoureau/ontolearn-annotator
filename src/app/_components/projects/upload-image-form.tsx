"use client";

import { uploadImage } from "@/actions/projects";
import { uploadImageInputSchema } from "@/lib/validation-schemas/project-image";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useServerAction } from "zsa-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useToast } from "../ui/use-toast";

type Props = {
  formId?: string;
  projectId: string;
}

export function UploadImageForm({ formId, projectId }: Props) {
  const t = useTranslations("Project.Image");

  const { toast } = useToast();
  const form = useForm<z.infer<typeof uploadImageInputSchema>>({
    resolver: zodResolver(uploadImageInputSchema)
  });

  const { execute, isError, error } = useServerAction(uploadImage, {
    onSuccess: () => {
      form.reset();
      toast({
        title: "Image uploaded",
      })
    }
  })

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    formData.append("image", data.image);
    formData.append("projectId", projectId)
    execute(formData);
  })

  return (
    <Form {...form}>
      <form id={formId} onSubmit={onSubmit}>
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>An error occured</AlertTitle>
            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Alert>
        )}
        <FormField
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('image')}</FormLabel>
              <FormControl>
                <Input type="file" {...form.register('image')} />
              </FormControl>
              <FormDescription>{t('imageDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}