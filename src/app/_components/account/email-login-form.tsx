"use client";

import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface EmailLoginFormProps {
  /**
   * Server action that performs the sign-in. Posting to /api/auth/signin/... by hand
   * would require a CSRF token, which is only minted once a /api/auth/* route has been
   * hit — so a first, cold visit to /login used to fail with MissingCSRF. Going through
   * signIn() lets Auth.js handle the CSRF exchange itself.
   */
  action: (formData: FormData) => Promise<void>;
}

export default function EmailLoginForm({ action }: EmailLoginFormProps) {
  const t = useTranslations("Account.Login");

  return (
    <form action={action}>
      <div className="mb-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          autoFocus
          type="email"
          name="email"
          placeholder="email@example.com"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        {t("loginWith", { provider: "email" })}
      </Button>
    </form>
  );
}
