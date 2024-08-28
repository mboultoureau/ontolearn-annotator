import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { auth, providerMap, signIn } from "@/server/auth";
import { Metadata } from "next";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCsrfToken } from "next-auth/react";
import { cookies } from "next/headers";
import { FormItem, FormLabel } from "../_components/ui/form";
import { Input } from "../_components/ui/input";
import EmailLoginForm from "../_components/account/email-login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account.Login");

  return {
    title: t("title"),
  };
}

export default async function LoginForm() {
  const SIGNIN_ERROR_URL = "/api/auth/error";
  const t = await getTranslations("Account.Login");
  const session = await auth();
  const csrfToken = cookies().get("authjs.csrf-token")?.value.split("|")[0];

  if (session) {
    redirect("/projects");
  }

  return (
    <Card className="mx-auto max-w-sm my-8">
      <CardHeader>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mt-4">
          {Object.values(providerMap).map((provider) => {
            if (provider.id === "credentials") {
              return null;
            }

            return (
              <>
                {(provider.type === "oauth" || provider.type === "oidc") && (
                  <form
                    key={provider.id}
                    action={async () => {
                      "use server";
                      try {
                        await signIn(provider.id);
                      } catch (error) {
                        // Signin can fail for a number of reasons, such as the user
                        // not existing, or the user not having the correct role.
                        // In some cases, you may want to redirect to a custom error
                        if (error instanceof AuthError) {
                          return redirect(
                            `${SIGNIN_ERROR_URL}?error=${error.type}`
                          );
                        }

                        // Otherwise if a redirects happens NextJS can handle it
                        // so you can just re-thrown the error and let NextJS handle it.
                        // Docs:
                        // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
                        throw error;
                      }
                    }}
                  >
                    <Button variant="outline" className="w-full">
                      <Image
                        src={`/img/providers/${provider.id}.svg`}
                        alt="GitHub"
                        width="20"
                        height="20"
                        className="mr-2"
                      ></Image>
                      {t("loginWith", { provider: provider.name })}
                    </Button>
                  </form>
                )}

                {provider.type === "email" && (
                  <>
                    <hr />
                    <EmailLoginForm csrfToken={csrfToken} />
                  </>
                )}
              </>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
