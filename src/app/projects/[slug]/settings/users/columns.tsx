"use client";

import { Button } from "@/app/_components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/app/_components/ui/dropdown-menu";
import { ProjectMember } from "@/lib/definitions";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

export const columns: ColumnDef<ProjectMember>[] = [
    {
        accessorKey: "user.name",
        header: "fullName"
    },
    {
        accessorKey: "user.email",
        header: "email",
    },
    {
        accessorKey: "role",
        header: "role",
    },
    {
        id: "actions",
        header: "actions",
        cell: ({ row }) => {
            return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>Promote to admin</DropdownMenuItem>
                    <DropdownMenuItem >Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
        }
    }
];