"use client";

import { Button } from "@/app/_components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        pending ? (
            <Button type="submit" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
            </Button>
        ) : (
            <Button type="submit">Upload</Button>

        )
    )
}