"use client";

import { Button } from "@/app/_components/ui/button";
import { Task } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import Link from "next/link";

export const columns: ColumnDef<Task>[] = [
    {
            accessorKey: "type",
        header: "type",
    },
    {
        accessorKey: "createdAt",
        header: "createdAt",
        cell: ({ row }) => {
            const date: Date = row.getValue("createdAt");
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
];