"use client";

import { Button } from "@/app/_components/ui/button";
import { uploadPlaygroundInputSchema } from "@/lib/validation-schemas/playground";
import { uploadPlayground } from "@/server/actions/playground";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useServerAction } from "zsa-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";

type Props = {
  projectSlug: string;
  projectId: string;
}

export default function PlaygroundForm({ projectSlug, projectId }: Props) {
  const t = useTranslations("Playground.Index");

  const form = useForm<z.infer<typeof uploadPlaygroundInputSchema>>({
    resolver: zodResolver(uploadPlaygroundInputSchema),
    defaultValues: {
      projectId: projectId,
    }
  });

  const { execute, isError, error, isPending } = useServerAction(uploadPlayground, {
    onSuccess: (result) => {
      form.reset();
      redirect(`/projects/${projectSlug}/playground/${result.data.id}`);
    },
  });

    const onSubmit = form.handleSubmit(async (data) => {
        const formData = new FormData();
        formData.append("file", data.file);
        formData.append("projectId", projectId);
        execute(formData);
    });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
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
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('file')}</FormLabel>
              <FormControl>
                <Input type="file" {...form.register('file')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-2 float-end" type="submit">{t("submit")}</Button>
      </form>
    </Form>

  );
}
