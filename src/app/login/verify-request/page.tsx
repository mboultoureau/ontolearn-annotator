import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { auth } from "@/server/auth";
import { MailCheck } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account.VerifyRequest");

  return {
    title: t("title"),
  };
}

/**
 * Replaces Auth.js's built-in /api/auth/verify-request page, which is unstyled.
 * Wired up through authConfig.pages.verifyRequest.
 *
 * Auth.js does not pass the address it mailed, so `email` is only shown when the
 * sign-in form forwarded it as a query parameter.
 */
export default async function VerifyRequest({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const t = await getTranslations("Account.VerifyRequest");
  const session = await auth();

  if (session) {
    redirect("/projects");
  }

  const email = searchParams.email;

  return (
    <Card className="mx-auto max-w-sm my-8">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <MailCheck className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>
          {email
            ? t("description", { email })
            : t("descriptionNoEmail")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">{t("spam")}</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">{t("backToLogin")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
