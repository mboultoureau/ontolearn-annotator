import { LanguageForm } from "@/app/_components/account/language-form";
import { api, HydrateClient } from "@/trpc/server";

export default async function UserSettingsPage() {
    const account = await api.account.get();
    void api.account.get.prefetch();

    return (
        <HydrateClient>
            <LanguageForm locale={account.locale} />
        </HydrateClient>
    );
}