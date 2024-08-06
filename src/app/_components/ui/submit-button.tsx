"use client";

import { Button } from "@/app/_components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export type Props = {
    text?: string;
    pendingText?: string;
}

export function SubmitButton({ text, pendingText }: Props) {
    const { pending } = useFormStatus();

    return (
        pending ? (
            <Button type="submit" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {pendingText || 'Submitting...'}
            </Button>
        ) : (
            <Button type="submit">{text || 'Submit'}</Button>

        )
    )
}