"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { useState } from "react";

interface Props {
  projectId: string;
}

export default function IntegrationApi({ projectId }: Props) {
  const t = useTranslations("Project.Settings");
  const [copied, setCopied] = useState<boolean>(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("integrationApi")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="project-id">{t("projectId")}</Label>
          <div className="flex space-x-2">
            <Input value={projectId} readOnly id="project-id" />
            <Button variant="secondary" className="shrink-0" onClick={() => {
                navigator.clipboard.writeText(projectId)
                setCopied(true)

                setTimeout(() => {
                  setCopied(false)
                }, 2000)
            }}>
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
