"use client";

import { Button } from "@/app/_components/ui/button";
import { Data } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import Link from "next/link";

export const columns: ColumnDef<Data>[] = [
    {
        accessorKey: "name",
        header: 'name',
    },
    {
        accessorKey: "uploadedAt",
        header: 'uploadedAt',
        cell: ({ row }) => {
            const date: Date = row.getValue("uploadedAt");
            const dateFormatter = new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
            });

            return <div>{dateFormatter.format(date)}</div>;
        },
    },
    {
        id: 'actions',
        header: 'actions',
        cell: ({ row }) => {
            return (
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/datasets/${row.original.projectId}/${row.original.content}`} target="_blank" rel="noopener noreferrer" locale={false} download>
                        <Download className="h-4 w-4" />
                    </Link>
                </Button>
            )
        }
    }
];