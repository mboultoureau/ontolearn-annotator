"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsMenu() {
    const pathname = usePathname();
    const t = useTranslations('Account.Settings');
    const menu = [
        {
            label: t('general'),
            link: "/account/settings"
        },
        {
            label: t('appearance'),
            link: "/account/settings/appearance"
        }
    ];

    return (
        <nav
            className="grid gap-4 text-sm text-muted-foreground"
        >
            {menu.map((link) => (
                <Link key={link.link} href={link.link} className={pathname === link.link ? "font-semibold text-primary" : ""}>
                    {link.label}
                </Link>
            ))}
        </nav>
    )
}