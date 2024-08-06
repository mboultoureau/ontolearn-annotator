"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/app/_components/ui/form";
import { setUserLocale } from "@/lib/locale";
import { updateLocaleInputSchema } from "@/lib/validation-schemas/accounts";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";
import LanguageDropdown from "./language-dropdown";

export type Props = {
  locale?: "ENGLISH" | "FRENCH" | "JAPANESE";
};

export function LanguageForm({ locale = "ENGLISH" }: Props) {
  const t = useTranslations("Account.Settings");
  const { mutate, error, isPending } = api.account.updateLocale.useMutation();

  const languages = [
    { label: t("english"), value: "ENGLISH" },
    { label: t("french"), value: "FRENCH" },
    { label: t("japanese"), value: "JAPANESE" },
  ] as const;

  const form = useForm<z.infer<typeof updateLocaleInputSchema>>({
    resolver: zodResolver(updateLocaleInputSchema),
    defaultValues: {
      locale: locale,
    },
  });

  const onSubmit = async (values: z.infer<typeof updateLocaleInputSchema>) => {
    await mutate(values);
    if (error) return;

    switch (values.locale) {
        case "ENGLISH":
            await setUserLocale("en");
            break;
        case "FRENCH":
            await setUserLocale("fr");
            break;
        case "JAPANESE":
            await setUserLocale("ja");
            break;
    }
  };

  useEffect(() => {
    for (const field in error?.data?.zodError?.fieldErrors) {
      if (field != "locale" || !error?.data?.zodError?.fieldErrors[field])
        return;

      form.setError(field, {
        type: "server",
        message: error?.data?.zodError?.fieldErrors[field].join(" "),
      });
    }
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("language")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="language-form"
          >
            {error?.data?.code === "INTERNAL_SERVER_ERROR" && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("preferredLanguage")}</FormLabel>
                  <LanguageDropdown
                    value={field.value}
                    languages={languages}
                    onValueChanged={(value) => form.setValue("locale", value)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="border-t px-6 py-4 flex justify-end">
        <Button form="language-form" type="submit" disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </CardFooter>
    </Card>
  );
}
