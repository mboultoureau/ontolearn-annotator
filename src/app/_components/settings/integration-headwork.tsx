import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

export default function IntegrationHeadwork() {
    const t = useTranslations("Project.Settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("integrations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch id="toggle-headwork" />
          <Label htmlFor="toggle-headwork">{t('useHeadwork')}</Label>
        </div>
      </CardContent>
    </Card>
  );
}
