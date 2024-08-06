"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/_components/ui/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import CategoryForm from "./form";
import SubmitButton from "./submit-button";

export type Props = {
    onCategoryCreated: () => void;
}

export default function DialogCategory({ onCategoryCreated }) {
    const t = useTranslations("Category.Create")
    const [open, setOpen] = useState(false)
    const formId = "create-category";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <a className="underline underline-offset-4 hover:text-primary cursor-pointer">{t('callToAction')}</a>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] g:max-w-screen-lg overflow-y-auto max-h-screen">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>
                <CategoryForm id={formId} onSubmitSuccess={() => {
                    onCategoryCreated()
                    setOpen(false)
                }} /> 
                <DialogFooter>
                    <SubmitButton formId={formId} />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
