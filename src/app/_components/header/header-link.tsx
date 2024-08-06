"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HeaderLink({ href, children }: { href: string, children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <Link
            href={href}
            className={`${pathname === href
                    ? "text-foreground"
                    : "text-muted-foreground"
                } transition-colors hover:text-foreground whitespace-nowrap`}
        >
            {children}
        </Link>
    )
}