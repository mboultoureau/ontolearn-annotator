"use client";

import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface EmailLoginFormProps {
  csrfToken?: string;
}

export default function EmailLoginForm({ csrfToken }: EmailLoginFormProps) {
  const t = useTranslations("Account.Login");

  return (
    <form action="/api/auth/signin/nodemailer" method="POST">
      <input type="hidden" name="csrfToken" value={csrfToken} />
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
