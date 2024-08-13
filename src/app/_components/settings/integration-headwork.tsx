"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { api } from "@/trpc/react";
import { getTranslations } from "next-intl/server";
import { useToast } from "../ui/use-toast";
import { useState } from "react";

interface Props {
  projectId: string;
  useHeadwork: boolean;
}

export default function IntegrationHeadwork({ projectId, useHeadwork }: Props) {
  const [isHeadworkEnabled, setIsHeadworkEnabled] = useState<boolean>(useHeadwork);
  const t = useTranslations("Project.Settings");
  const { toast } = useToast();

  const { mutateAsync, isError, isPending } =
    api.project.updateUseHeadwork.useMutation();

  const handleChange = async (checked: boolean) => {
    setIsHeadworkEnabled(checked);

    await mutateAsync({
      id: projectId,
      useHeadwork: checked,
    })
      .then(() => {
        toast({
          title: t("headworkUpdated"),
          description: t("headworkUpdatedDescription", {
            value: checked ? t("enabled") : t("disabled"),
          }),
        });
      })
      .catch(() => {
        toast({
          title: t("headworkError"),
          description: t("headworkErrorDescription"),
          variant: "destructive",
        });
        setIsHeadworkEnabled(!checked);
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("integrations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch
            id="toggle-headwork"
            disabled={isPending}
            onCheckedChange={handleChange}
            checked={isHeadworkEnabled}
          />
          <Label htmlFor="toggle-headwork">{t("useHeadwork")}</Label>
        </div>
      </CardContent>
    </Card>
  );
}
