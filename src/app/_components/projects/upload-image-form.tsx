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
  const t = useTranslations("Project.Icon");

  const { toast } = useToast();
  const form = useForm<z.infer<typeof uploadImageInputSchema>>({
    resolver: zodResolver(uploadImageInputSchema)
  });

  const { execute, isError, error } = useServerAction(uploadImage, {
    onSuccess: () => {
      form.reset();
      toast({
        title: "Icon uploaded",
      })
    }
  })

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    formData.append("icon", data.icon);
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
          control={form.control}
          /* Was name="image", which matches no schema field — so useFormField
             looked up errors under a key that never has any, and validation
             messages for `icon` never rendered. */
          name="icon"
          render={() => (
            <FormItem>
              <FormLabel>{t('icon')}</FormLabel>
              <FormControl>
                <Input type="file" {...form.register('icon')} />
              </FormControl>
              <FormDescription>{t('iconDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}