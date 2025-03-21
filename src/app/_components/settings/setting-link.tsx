"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingLink({ href, children }: { href: string, children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <Link href={href} className={pathname === href ? "font-semibold text-primary" : ""}>
            {children}
        </Link>
    )
}