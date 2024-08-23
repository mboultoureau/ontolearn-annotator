"use client";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/app/_components/ui/form";
import { projectSchema } from "@/lib/zod";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CreateCategory from "../category/dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/use-toast";
import SelectCategories from "./select-categories";
import { Category, Prisma } from "@prisma/client";

type Props = {
  formId?: string;
  displaySubmit?: boolean;
  data?: Prisma.ProjectGetPayload<{
    include: {
      categories: true
    }
  }>;
};

export default function ProjectForm({
  formId = "create-project",
  displaySubmit = true,
  data,
}: Props) {
  const t = useTranslations("Project.Form");
  const { toast } = useToast();
  const [updateCount, setUpdateCount] = useState(0);
  const router = useRouter();

  const { mutate, error, isPending } = api.project.create.useMutation();

//   if (Array.isArray(data?.categories) && data?.categories.length > 0) {
//     categories = data.categories.map((category) => category.id);
//   }

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: data?.name || "",
      slug: data?.slug || "",
      description: data?.description || "",
      visibility: data?.visibility || "PRIVATE",
      categories: data?.categories.map((category: Category) => category.id) || [],
    },
  });

  const onSubmit = async (values: z.infer<typeof projectSchema>) => {
    await mutate({ ...values, visibility: "public" });
    if (error) return;

    toast({
      title: t("projectCreated"),
      description: t("projectCreatedDescription", {
        name: values.name,
      }),
    });

    router.push(`/projects/${values.slug}`);
  };

  function updateSlug(e: React.ChangeEvent<HTMLInputElement>, field: any) {
    form.setValue(
      "slug",
      `${e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`
    );
    form.trigger("slug");
    field.onChange(e);
  }

  return (
    <Form {...form}>
      {error?.data?.code === "INTERNAL_SERVER_ERROR" && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        id={formId}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("namePlaceholder")}
                  {...field}
                  onChange={(e) => updateSlug(e, field)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("slug")}</FormLabel>
              <FormControl>
                <Input placeholder={t("slugPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="visibility"
          render={() => (
            <FormItem>
              <FormLabel>{t("visibility")}</FormLabel>
              <FormControl>
                <RadioGroup
                  defaultValue="private"
                  onValueChange={(value) =>
                    form.setValue(
                      "visibility",
                      value === "PUBLIC" ? "PUBLIC" : "PRIVATE"
                    )
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PUBLIC" id="public" />
                    <Label htmlFor="public">{t("visibilityPublic")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PRIVATE" id="private" />
                    <Label htmlFor="private">{t("visibilityPrivate")}</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>{t("visibilityDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("categories")}</FormLabel>
              <FormControl>
                <SelectCategories
                  updateCount={updateCount}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                {t("categoriesDescription")}&nbsp;
                <CreateCategory
                  onCategoryCreated={() => setUpdateCount(updateCount + 1)}
                />
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {displaySubmit && (
          <div className="flex justify-end">
            <Button type="submit">{t("submit")}</Button>
          </div>
        )}
      </form>
    </Form>
  );
}
