import { AppearanceForm } from "@/app/_components/account/appearance-form";
import { api, HydrateClient } from "@/trpc/server";

export default async function UserAppearancePage() {
    const account = await api.account.get();
    void api.account.get.prefetch();

    return (
        <HydrateClient>
            <AppearanceForm theme={account.theme} />
        </HydrateClient>
    )
}