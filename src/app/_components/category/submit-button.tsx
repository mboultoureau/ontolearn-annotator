"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";
import { Button } from "../ui/button";

export type Props = {
    formId: string;
};

export default function SubmitButton({
    formId
}: Props) {
    const t = useTranslations('Category.Form')
    const { pending } = useFormStatus();

    if (pending) {
        return (
            <Button type="submit" form={formId} disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('submitting')}
            </Button>
        )
    }

    return <Button type="submit" form="create-category">{t('submit')}</Button>
}